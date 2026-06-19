'use client'

import { useEffect, useState, useMemo } from 'react'
import { useRouter } from 'next/navigation'
import { createClient } from '@/lib/supabase/client'
import { useStoreCtx } from '@/components/AppShell'
import { getCategoryIcon } from '@/lib/constants'
import { computeExpiryAlerts, computeLowStock, formatCurrency, todayISO } from '@/lib/utils'
import type { Product, DailySales } from '@/types'
import { ChatIcon, MoonIcon, SunIcon } from '@/components/Icons'

export default function DashboardPage() {
  const { store, lang, dark, t, setDark } = useStoreCtx()
  const router = useRouter()
  const supabase = useMemo(() => createClient(), [])

  const [products, setProducts] = useState<Product[]>([])
  const [today, setToday] = useState<DailySales | null>(null)
  const [weekProfit, setWeekProfit] = useState(0)
  const [weekRevenue, setWeekRevenue] = useState(0)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    loadData()
  }, [])

  const loadData = async () => {
    const [{ data: prods }, { data: todayRow }, { data: weekRows }] = await Promise.all([
      supabase.from('products').select('*, product_batches(*)').eq('store_id', store.id).eq('is_active', true),
      supabase.from('daily_sales').select('*').eq('store_id', store.id).eq('sale_date', todayISO()).maybeSingle(),
      supabase.from('daily_sales').select('total_revenue, total_profit').eq('store_id', store.id)
        .gte('sale_date', new Date(Date.now() - 7 * 86400000).toISOString().split('T')[0]),
    ])
    setProducts((prods ?? []) as Product[])
    setToday(todayRow as DailySales | null)
    setWeekRevenue((weekRows ?? []).reduce((s, r) => s + Number(r.total_revenue), 0))
    setWeekProfit((weekRows ?? []).reduce((s, r) => s + Number(r.total_profit), 0))
    setLoading(false)
  }

  const expiryAlerts = computeExpiryAlerts(products).filter(a => a.daysUntilExpiry <= 7)
  const lowStock = computeLowStock(products, store.low_stock_threshold)
  const inventoryValue = products.reduce((sum, p) => sum + p.total_quantity * p.buy_price, 0)
  const todayMargin = today && today.total_revenue > 0 ? Math.round((today.total_profit / today.total_revenue) * 100) : 0

  if (loading) {
    return <div className="page" style={{ display: 'flex', justifyContent: 'center', paddingTop: 80 }}><div className="spinner" /></div>
  }

  return (
    <div className="page">
      <div style={{ marginBottom: 14 }}>
        <div className="page-title">{t('goodEvening')}</div>
        <div style={{ fontSize: 12, color: 'var(--muted)' }}>{store.name}</div>
      </div>

      <div className="card" style={{ background: 'var(--green)', marginBottom: 10 }}>
        <div style={{ fontSize: 12, color: 'rgba(255,255,255,0.75)', marginBottom: 4 }}>{t('todayRevenue')}</div>
        <div style={{ fontFamily: 'Outfit, sans-serif', fontSize: 32, fontWeight: 800, color: '#fff', letterSpacing: '-1px' }}>
          {formatCurrency(today?.total_revenue ?? 0, store.currency)}
        </div>
      </div>

      <div className="stat-grid" style={{ marginBottom: 14 }}>
        <div className="card">
          <div style={{ fontSize: 12, color: 'var(--muted)', marginBottom: 4 }}>{t('todayProfit')}</div>
          <div style={{ fontFamily: 'Outfit, sans-serif', fontSize: 20, fontWeight: 700, color: 'var(--green-text)' }}>
            {formatCurrency(today?.total_profit ?? 0, store.currency)}
          </div>
          <div style={{ fontSize: 11, color: 'var(--muted)' }}>{todayMargin}% margin</div>
        </div>
        <div className="card">
          <div style={{ fontSize: 12, color: 'var(--muted)', marginBottom: 4 }}>{t('weekProfit')}</div>
          <div style={{ fontFamily: 'Outfit, sans-serif', fontSize: 20, fontWeight: 700, color: 'var(--text)' }}>
            {formatCurrency(weekProfit, store.currency)}
          </div>
          <div style={{ fontSize: 11, color: 'var(--muted)' }}>{formatCurrency(weekRevenue, store.currency)} rev</div>
        </div>
        <div className="card" style={{ gridColumn: '1 / -1' }}>
          <div style={{ fontSize: 12, color: 'var(--muted)', marginBottom: 4 }}>{t('inventoryValue')}</div>
          <div style={{ fontFamily: 'Outfit, sans-serif', fontSize: 20, fontWeight: 700, color: 'var(--text)' }}>
            {formatCurrency(inventoryValue, store.currency)}
          </div>
          <div style={{ fontSize: 11, color: 'var(--muted)' }}>{products.length} {t('totalProducts')}</div>
        </div>
      </div>

      {expiryAlerts.length > 0 && (
        <>
          <div className="section-title">⚠️ {t('expiryAlerts')}</div>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 6, marginBottom: 14 }}>
            {expiryAlerts.map((a, i) => {
              const level = a.daysUntilExpiry <= 3 ? 'red' : 'amber'
              return (
                <div key={i} className="alert-row">
                  <div className="alert-icon">{getCategoryIcon(a.category)}</div>
                  <div style={{ flex: 1, minWidth: 0 }}>
                    <div className="alert-name">{a.productName}</div>
                    <div className="alert-sub">{a.quantity} {t('units')}</div>
                  </div>
                  <span className={`badge badge-${level}`}>
                    {a.daysUntilExpiry <= 0 ? t('expired') : a.daysUntilExpiry === 1 ? t('tomorrow') : `${a.daysUntilExpiry}${t('daysShort')}`}
                  </span>
                </div>
              )
            })}
          </div>
        </>
      )}

      {lowStock.length > 0 && (
        <>
          <div className="section-title">📦 {t('lowStock')}</div>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 6, marginBottom: 14 }}>
            {lowStock.slice(0, 4).map(p => (
              <div key={p.id} className="alert-row">
                <div className="alert-icon">{getCategoryIcon(p.category)}</div>
                <div style={{ flex: 1, minWidth: 0 }}>
                  <div className="alert-name">{p.name}</div>
                </div>
                <span className={`badge badge-${p.total_quantity <= 3 ? 'red' : 'amber'}`}>{p.total_quantity} {t('left')}</span>
              </div>
            ))}
          </div>
        </>
      )}

      {products.length === 0 && (
        <div className="card" style={{ textAlign: 'center', padding: '32px 20px', marginBottom: 14 }}>
          <div style={{ fontSize: 40, marginBottom: 8 }}>📦</div>
          <div style={{ fontWeight: 600, color: 'var(--text)', marginBottom: 4 }}>{t('noProducts')}</div>
          <div style={{ fontSize: 13, color: 'var(--muted)', marginBottom: 16 }}>{t('addFirstProduct')}</div>
          <button className="btn-primary" onClick={() => router.push('/add')}>+ {t('addProduct')}</button>
        </div>
      )}

      <div className="card" style={{ marginBottom: 14, display: 'flex', alignItems: 'center', gap: 10 }}>
        <div style={{ background: 'var(--green)', borderRadius: 8, padding: 6, display: 'flex' }}>
          <ChatIcon size={14} color="#fff" />
        </div>
        <div style={{ flex: 1, fontSize: 13, color: 'var(--text)' }}>{t('aiRecommendation')}</div>
        <button onClick={() => router.push('/assistant')} className="btn-link" style={{ whiteSpace: 'nowrap' }}>{t('askAI')}</button>
      </div>

      <div className="card" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
          {dark ? <SunIcon size={18} color="var(--green)" /> : <MoonIcon size={18} color="var(--green)" />}
          <span style={{ fontSize: 14, fontWeight: 600, color: 'var(--text)' }}>{t('darkMode')}</span>
        </div>
        <div
          className="toggle-track"
          style={{ background: dark ? 'var(--green)' : 'var(--border)' }}
          onClick={() => setDark(!dark)}
        >
          <div className="toggle-thumb" style={{ left: dark ? 22 : 3 }} />
        </div>
      </div>
    </div>
  )
}
