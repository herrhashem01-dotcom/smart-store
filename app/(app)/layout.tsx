import { redirect } from 'next/navigation'
import { createClient } from '@/lib/supabase/server'
import AppShell from '@/components/AppShell'
import { computeExpiryAlerts, computeLowStock } from '@/lib/utils'
import type { Product, Store } from '@/types'

export default async function AppLayout({ children }: { children: React.ReactNode }) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/login')

  let { data: store } = await supabase
    .from('stores')
    .select('*')
    .eq('owner_id', user.id)
    .single()

  if (!store) {
    const { data: newStore } = await supabase
      .from('stores')
      .insert({ owner_id: user.id })
      .select()
      .single()
    store = newStore
  }

  const { data: products } = await supabase
    .from('products')
    .select('*, product_batches(*)')
    .eq('store_id', store!.id)
    .eq('is_active', true)

  const productList = (products ?? []) as Product[]
  const expiryAlerts = computeExpiryAlerts(productList)
  const lowStockProducts = computeLowStock(productList, (store as Store).low_stock_threshold)

  return (
    <AppShell store={store as Store} expiryAlerts={expiryAlerts} lowStockProducts={lowStockProducts}>
      {children}
    </AppShell>
  )
}
