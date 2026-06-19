import { NextRequest, NextResponse } from 'next/server'
import Anthropic from '@anthropic-ai/sdk'
import { createClient } from '@/lib/supabase/server'
import { computeExpiryAlerts, computeLowStock, computeDeadStock, daysUntilExpiry } from '@/lib/utils'
import type { Product, Store } from '@/types'

const anthropic = new Anthropic({ apiKey: process.env.ANTHROPIC_API_KEY })

function buildSystemPrompt(store: Store, products: Product[], lang: string): string {
  const expiryAlerts = computeExpiryAlerts(products)
  const lowStock = computeLowStock(products, store.low_stock_threshold)
  const deadStock = computeDeadStock(products)
  const inventoryValue = products.reduce((s, p) => s + p.total_quantity * p.buy_price, 0)

  const productLines = products.map(p => {
    const batches = (p.product_batches ?? []).filter(b => b.is_active && b.quantity > 0)
    const minDays = batches.length
      ? Math.min(...batches.filter(b => b.expiry_date).map(b => daysUntilExpiry(b.expiry_date!)))
      : null
    return `- ${p.name} (${p.category}): ${p.total_quantity} units, cost ${p.buy_price} / sell ${p.sell_price} ${store.currency}, ` +
      `${minDays != null ? `expires in ${minDays}d` : 'no expiry'}, ` +
      `${p.last_sold_at ? `last sold ${Math.floor((Date.now() - new Date(p.last_sold_at).getTime()) / 86400000)}d ago` : 'never sold'}`
  }).join('\n')

  return `You are the AI Business Assistant for "${store.name}", a small retail store in Jordan.
${lang === 'ar' ? 'ALWAYS respond in Arabic, using simple everyday language a store owner would use — never accounting jargon.' : 'Respond in clear, plain English — no accounting jargon.'}
Be direct and brief. Give practical, actionable answers grounded only in the data below. If something isn't in the data, say you don't have that information.

STORE INVENTORY VALUE: ${inventoryValue.toFixed(2)} ${store.currency}
TOTAL PRODUCTS: ${products.length}

PRODUCTS:
${productLines || '(no products added yet)'}

EXPIRY ALERTS (within 30 days): ${expiryAlerts.map(a => `${a.productName} (${a.daysUntilExpiry}d, ${a.quantity}u)`).join(', ') || 'none'}

LOW STOCK: ${lowStock.map(p => `${p.name} (${p.total_quantity}u)`).join(', ') || 'none'}

NOT SELLING (30+ days): ${deadStock.map(p => p.name).join(', ') || 'none'}`
}

export async function POST(req: NextRequest) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const { messages, lang } = await req.json()

  const { data: store } = await supabase
    .from('stores')
    .select('*')
    .eq('owner_id', user.id)
    .single()

  if (!store) return NextResponse.json({ error: 'Store not found' }, { status: 404 })

  const { data: products } = await supabase
    .from('products')
    .select('*, product_batches(*)')
    .eq('store_id', store.id)
    .eq('is_active', true)

  const systemPrompt = buildSystemPrompt(store as Store, (products ?? []) as Product[], lang ?? store.language)

  try {
    const response = await anthropic.messages.create({
      model: 'claude-sonnet-4-6',
      max_tokens: 1000,
      system: systemPrompt,
      messages: messages.map((m: { role: string; content: string }) => ({
        role: m.role,
        content: m.content,
      })),
    })

    const textBlock = response.content.find(b => b.type === 'text')
    const reply = textBlock && textBlock.type === 'text' ? textBlock.text : 'Sorry, I could not generate a response.'

    return NextResponse.json({ reply })
  } catch (err) {
    console.error('Anthropic API error:', err)
    return NextResponse.json({ error: 'AI request failed' }, { status: 500 })
  }
}
