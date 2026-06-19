'use client'

import { useEffect, useState, useMemo } from 'react'
import { useRouter } from 'next/navigation'
import { createClient } from '@/lib/supabase/client'
import { useStoreCtx } from '@/components/AppShell'
import { getCategoryIcon, getBatchColor, getBatchLabel } from '@/lib/constants'
import { daysUntilExpiry, getProfitMargin } from '@/lib/utils'
import type { Product } from '@/types'
import { SearchIcon, CameraIcon, MinusIcon, CloseIcon } from '@/components/Icons'
import BarcodeScanner from '@/components/BarcodeScanner'

export default function ProductsPage() {
  const { store, lang, t } = useStoreCtx()
  const router = useRouter()
  const supabase = useMemo(() => createClient(), [])

  const [products, setProducts] = useState<Product[]>([])
  const [search, setSearch] = useState('')
  const [loading, setLoading] = useState(true)
  const [showScanner, setShowScanner] = useState(false)
  const [sellTarget, setSellTarget] = useState<Product | null>(null)
  const [sellQty, setSellQty] = useState('1')
  const [selling, setSelling] = useState(false)

  useEffect(() => { loadProducts() }, [])

  const loadProducts = async () => {
    const { data } = await supabase
      .from('products')
      .select('*, product_batches(*)')
      .eq('store_id', store.id)
      .eq('is_active', true)
      .order('name')
    setProducts((data ?? []) as Product[])
    setLoading(false)
  }

  const filtered = products.filter(p => p.name.toLowerCase().includes(search.toLowerCase()))

  const handleBarcodeDetected = (code: string) => {
    setShowScanner(false)
    const existing = products.find(p => p.barcode === code)
    if (existing) {
      router.push(`/add?name=${encodeURIComponent(existing.name)}`)
    } else {
      router.push(`/add?barcode=${encodeURIComponent(code)}`)
    }
  }

  const handleSell = async () => {
    if (!sellTarget) return
    const qty = parseInt(sellQty)
    if (!qty || qty <= 0 || qty > sellTarget.total_quantity) return
    setSelling(true)
    const res = await fetch('/api/sell', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ productId: sellTarget.id, quantity: qty }),
    })
    setSelling(false)
    if (res.ok) {
      setSellTarget(null)
      setSellQty('1')
      loadProducts()
    }
  }

  return (
    <div className="page">
      <div style={{ display: 'flex', gap: 10, marginBottom: 12 }}>
        <div style={{ position: 'relative', flex: 1 }}>
          <div style={{ position: 'absolute', [lang === 'ar' ? 'right' : 'left']: 13, top: '50%', transform: 'translateY(-50%)' }}>
            <SearchIcon size={16} color="var(--muted)" />
          </div>
          <input
            className="input"
            value={search}
            onChange={e => setSearch(e.target.value)}
            placeholder={t('searchProducts')}
            style={{ [lang === 'ar' ? 'paddingRight' : 'paddingLeft']: 40 }}
          />
        </div>
        <button
          onClick={() => setShowScanner(true)}
          style={{ background: 'var(--green)', border: 'none', borderRadius: 12, padding: '12px 14px', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: 6, color: '#fff', fontWeight: 700, fontSize: 13, flexShrink: 0 }}
        >
          <CameraIcon size={18} color="#fff" />{t('scanBarcode')}
        </button>
      </div>

      <div style={{ fontSize: 12, color: 'var(--muted)', marginBottom: 10 }}>
        {filtered.length} {t('of')} {products.length} {t('totalProducts')}
      </div>

      {loading ? (
        <div style={{ display: 'flex', justifyContent: 'center', paddingTop: 40 }}><div className="spinner" /></div>
      ) : products.length === 0 ? (
        <div className="card" style={{ textAlign: 'center', padding: '32px 20px' }}>
          <div style={{ fontSize: 40, marginBottom: 8 }}>📦</div>
          <div style={{ fontWeight: 600, marginBottom: 4 }}>{t('noProducts')}</div>
          <div style={{ fontSize: 13, color: 'var(--muted)', marginBottom: 16 }}>{t('addFirstProduct')}</div>
          <button className="btn-primary" onClick={() => router.push('/add')}>+ {t('addProduct')}</button>
        </div>
      ) : (
        <div className="product-grid">
          {filtered.map(p => {
            const batches = (p.product_batches ?? []).filter(b => b.is_active && b.quantity > 0)
            const minDays = batches.length
              ? Math.min(...batches.filter(b => b.expiry_date).map(b => daysUntilExpiry(b.expiry_date!)))
              : null
            const expLevel = minDays != null ? (minDays <= 3 ? 'red' : minDays <= 7 ? 'amber' : null) : null
            const threshold = p.low_stock_threshold ?? store.low_stock_threshold
            const stockLevel = p.total_quantity <= Math.ceil(threshold / 2) ? 'red' : p.total_quantity <= threshold ? 'amber' : null

            return (
              <div
                key={p.id}
                className="card"
                style={{ aspectRatio: '1', display: 'flex', flexDirection: 'column', cursor: 'pointer', padding: 12 }}
                onClick={() => setSellTarget(p)}
              >
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
                  <span style={{ fontSize: 34, lineHeight: 1 }}>{getCategoryIcon(p.category)}</span>
                  <div style={{ display: 'flex', flexDirection: 'column', gap: 3, alignItems: 'flex-end' }}>
                    {stockLevel && <span className={`badge badge-${stockLevel}`}>{p.total_quantity} {t('left')}</span>}
                    {expLevel && <span className={`badge badge-${expLevel}`}>{minDays}{t('daysShort')}</span>}
                  </div>
                </div>
                <div style={{ flex: 1 }} />
                <div style={{ display: '-webkit-box', WebkitLineClamp: 2, WebkitBoxOrient: 'vertical', overflow: 'hidden', fontWeight: 600, fontSize: 12, color: 'var(--text)', lineHeight: 1.35, marginBottom: 6 }}>
                  {p.name}
                </div>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                  <span style={{ fontFamily: 'Outfit, sans-serif', fontWeight: 700, fontSize: 15, color: 'var(--text)' }}>
                    {store.currency} {p.sell_price.toFixed(2)}
                  </span>
                  <div style={{ display: 'flex', gap: 2 }}>
                    {batches.slice(0, 3).map((_, i) => (
                      <div key={i} style={{ width: 14, height: 14, borderRadius: 4, background: getBatchColor(i), display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 8, fontWeight: 800, color: '#fff', fontFamily: 'Outfit, sans-serif' }}>
                        {getBatchLabel(i)}
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            )
          })}
        </div>
      )}

      <button
        onClick={() => router.push('/add')}
        className="btn-primary"
        style={{ marginTop: 16, display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 8 }}
      >
        + {t('addProduct')}
      </button>

      {showScanner && (
        <BarcodeScanner lang={lang} onDetected={handleBarcodeDetected} onClose={() => setShowScanner(false)} />
      )}

      {/* SELL MODAL */}
      {sellTarget && (
        <>
          <div className="overlay" onClick={() => setSellTarget(null)} />
          <div style={{ position: 'fixed', bottom: 0, left: '50%', transform: 'translateX(-50%)', width: '100%', maxWidth: 430, background: 'var(--surface)', borderRadius: '24px 24px 0 0', padding: 24, zIndex: 901, paddingBottom: 'max(24px, env(safe-area-inset-bottom, 24px))' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 16 }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                <span style={{ fontSize: 28 }}>{getCategoryIcon(sellTarget.category)}</span>
                <div>
                  <div style={{ fontWeight: 700, fontSize: 15 }}>{sellTarget.name}</div>
                  <div style={{ fontSize: 12, color: 'var(--muted)' }}>{sellTarget.total_quantity} {t('units')} {t('left')}</div>
                </div>
              </div>
              <button onClick={() => setSellTarget(null)} style={{ background: 'none', border: 'none', cursor: 'pointer' }}>
                <CloseIcon size={20} color="var(--muted)" />
              </button>
            </div>
            <label className="label">{t('qtySold')}</label>
            <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 16 }}>
              <button
                onClick={() => setSellQty(String(Math.max(1, parseInt(sellQty || '1') - 1)))}
                style={{ width: 44, height: 44, borderRadius: 12, border: '1px solid var(--border)', background: 'var(--surface-2)', display: 'flex', alignItems: 'center', justifyContent: 'center', cursor: 'pointer' }}
              >
                <MinusIcon size={18} color="var(--text)" />
              </button>
              <input
                className="input"
                type="number"
                min={1}
                max={sellTarget.total_quantity}
                value={sellQty}
                onChange={e => setSellQty(e.target.value)}
                style={{ textAlign: 'center', fontSize: 18, fontWeight: 700 }}
              />
              <button
                onClick={() => setSellQty(String(Math.min(sellTarget.total_quantity, parseInt(sellQty || '0') + 1)))}
                style={{ width: 44, height: 44, borderRadius: 12, border: 'none', background: 'var(--green)', display: 'flex', alignItems: 'center', justifyContent: 'center', cursor: 'pointer', fontSize: 20, color: '#fff', fontWeight: 700 }}
              >
                +
              </button>
            </div>
            <button onClick={handleSell} disabled={selling} className="btn-primary">
              {selling ? t('saving') : `${t('recordSale')} — ${store.currency} ${(sellTarget.sell_price * (parseInt(sellQty) || 0)).toFixed(2)}`}
            </button>
          </div>
        </>
      )}
    </div>
  )
}
