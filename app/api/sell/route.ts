import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'

export async function POST(req: NextRequest) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const { productId, quantity } = await req.json()
  if (!productId || !quantity || quantity <= 0) {
    return NextResponse.json({ error: 'Invalid input' }, { status: 400 })
  }

  const { data: product } = await supabase
    .from('products')
    .select('*, product_batches(*)')
    .eq('id', productId)
    .single()

  if (!product) return NextResponse.json({ error: 'Product not found' }, { status: 404 })
  if (product.total_quantity < quantity) {
    return NextResponse.json({ error: 'Not enough stock' }, { status: 400 })
  }

  // FIFO: consume oldest batches first (by expiry date, then received date)
  const batches = (product.product_batches ?? [])
    .filter((b: any) => b.is_active && b.quantity > 0)
    .sort((a: any, b: any) => {
      if (a.expiry_date && b.expiry_date) return a.expiry_date.localeCompare(b.expiry_date)
      if (a.expiry_date) return -1
      if (b.expiry_date) return 1
      return new Date(a.received_at).getTime() - new Date(b.received_at).getTime()
    })

  let remaining = quantity
  for (const batch of batches) {
    if (remaining <= 0) break
    const consume = Math.min(batch.quantity, remaining)
    const newQty = batch.quantity - consume
    await supabase
      .from('product_batches')
      .update({ quantity: newQty, is_active: newQty > 0 })
      .eq('id', batch.id)
    remaining -= consume
  }

  const newTotal = product.total_quantity - quantity
  await supabase
    .from('products')
    .update({ total_quantity: newTotal, last_sold_at: new Date().toISOString() })
    .eq('id', productId)

  const revenue = product.sell_price * quantity
  const cost = product.buy_price * quantity
  const profit = revenue - cost
  const today = new Date().toISOString().split('T')[0]

  const { data: existing } = await supabase
    .from('daily_sales')
    .select('*')
    .eq('store_id', product.store_id)
    .eq('sale_date', today)
    .maybeSingle()

  if (existing) {
    await supabase
      .from('daily_sales')
      .update({
        total_revenue: Number(existing.total_revenue) + revenue,
        total_cost: Number(existing.total_cost) + cost,
        total_profit: Number(existing.total_profit) + profit,
        items_sold: existing.items_sold + quantity,
      })
      .eq('id', existing.id)
  } else {
    await supabase.from('daily_sales').insert({
      store_id: product.store_id,
      sale_date: today,
      total_revenue: revenue,
      total_cost: cost,
      total_profit: profit,
      items_sold: quantity,
    })
  }

  return NextResponse.json({ success: true, newTotal })
}
