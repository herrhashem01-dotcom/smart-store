'use client'

import { useEffect, useState, useMemo } from 'react'
import { useRouter, useSearchParams } from 'next/navigation'
import { createClient } from '@/lib/supabase/client'
import { useStoreCtx } from '@/components/AppShell'
import { CATEGORIES, getCategoryIcon, getBatchColor, getBatchLabel } from '@/lib/constants'
import { daysUntilExpiry, formatDate, getProfitMargin, nextBatchLabel } from '@/lib/utils'
import type { Product } from '@/types'
import { CameraIcon, CheckIcon, TrendIcon } from '@/components/Icons'
import BarcodeScanner from '@/components/BarcodeScanner'

export default function AddProductPage() {
  const { store, lang, t } = useStoreCtx()
  const router = useRouter()
  const searchParams = useSearchParams()
  const supabase = useMemo(() => createClient(), [])

  const [allProducts, setAllProducts] = useState<Product[]>([])
  const [name, setName] = useState(searchParams.get('name') ?? '')
  const [barcode, setBarcode] = useState(searchParams.get('barcode') ?? '')
  const [buyPrice, setBuyPrice] = useState('')
  const [sellPrice, setSellPrice] = useState('')
  const [category, setCategory] = useState('General')
  const [notes, setNotes] = useState('')
  const [batchQty, setBatchQty] = useState('')
  const [batchExp, setBatchExp] = useState('')
  const [showDetails, setShowDetails] = useState(false)
  const [showScanner, setShowScanner] = useState(false)
  const [saving, setSaving] = useState(false)
  const [saved, setSaved] = useState(false)
  const [error, setError] = useState('')

  useEffect(() => { loadProducts() }, [])

  const loadProducts = async () => {
    const { data } = await supabase
      .from('products')
      .select('*, product_batches(*)')
      .eq('store_id', store.id)
      .eq('is_active', true)
    setAllProducts((data ?? []) as Product[])
  }

  const matchedProduct = name.trim().length >= 2
    ? allProducts.find(p => p.name.toLowerCase() === name.toLowerCase().trim())
    : null

  const handleScanResult = (code: string) => {
    setShowScanner(false)
    setBarcode(code)
    const existing = allProducts.find(p => p.barcode === code)
    if (existing) {
      setName(existing.name)
      setBuyPrice(String(existing.buy_price))
      setSellPrice(String(existing.sell_price))
      setCategory(existing.category)
    }
  }

  const profit = buyPrice && sellPrice ? parseFloat(sellPrice) - parseFloat(buyPrice) : null
  const margin = profit != null && sellPrice ? getProfitMargin(parseFloat(buyPrice), parseFloat(sellPrice)) : null

  const handleAddBatch = async () => {
    if (!matchedProduct || !batchQty) return
    setSaving(true)
    setError('')
    const existingBatches = (matchedProduct.product_batches ?? []).filter(b => b.is_active)
    const label = nextBatchLabel(existingBatches.map(b => b.batch_label))
    const qty = parseInt(batchQty)

    const { error: batchErr } = await supabase.from('product_batches').insert({
      product_id: matchedProduct.id,
      store_id: store.id,
      batch_label: label,
      quantity: qty,
      expiry_date: batchExp || null,
    })
    if (batchErr) { setError(batchErr.message); setSaving(false); return }

    const { error: prodErr } = await supabase
      .from('products')
      .update({ total_quantity: matchedProduct.total_quantity + qty })
      .eq('id', matchedProduct.id)
    if (prodErr) { setError(prodErr.message); setSaving(false); return }

    setSaving(false)
    setSaved(true)
    setBatchQty(''); setBatchExp('')
    await loadProducts()
    setTimeout(() => setSaved(false), 2000)
  }

  const handleAddNewProduct = async () => {
    if (!name.trim() || !batchQty) return
    setSaving(true)
    setError('')
    const qty = parseInt(batchQty)

    const { data: newProduct, error: prodErr } = await supabase
      .from('products')
      .insert({
        store_id: store.id,
        name: name.trim(),
        category,
        barcode: barcode || null,
        notes: notes || null,
        buy_price: parseFloat(buyPrice) || 0,
        sell_price: parseFloat(sellPrice) || 0,
        total_quantity: qty,
      })
      .select()
      .single()

    if (prodErr || !newProduct) { setError(prodErr?.message ?? t('errorGeneric')); setSaving(false); return }

    if (batchExp || qty) {
      await supabase.from('product_batches').insert({
        product_id: newProduct.id,
        store_id: store.id,
        batch_label: 'A',
        quantity: qty,
        expiry_date: batchExp || null,
      })
    }

    setSaving(false)
    setSaved(true)
    setName(''); setBarcode(''); setBuyPrice(''); setSellPrice(''); setNotes(''); setBatchQty(''); setBatchExp(''); setCategory('General')
    await loadProducts()
    setTimeout(() => setSaved(false), 2000)
  }

  return (
    <div className="page">
      {saved && (
        <div style={{ background: 'var(--green-light)', border: '1px solid var(--green)', borderRadius: 12, padding: '12px 16px', marginBottom: 14, display: 'flex', alignItems: 'center', gap: 8 }}>
          <CheckIcon size={18} color="var(--green)" />
          <span style={{ color: 'var(--green-text)', fontWeight: 600, fontSize: 14 }}>{t('saved')}</span>
        </div>
      )}
      {error && (
        <div style={{ background: 'var(--red-bg)', color: 'var(--red-text)', borderRadius: 12, padding: '12px 16px', marginBottom: 14, fontSize: 13 }}>
          {error}
        </div>
      )}

      {/* SCAN CTA */}
      <button
        onClick={() => setShowScanner(true)}
        style={{ background: 'var(--green)', border: 'none', borderRadius: 20, padding: '20px 16px', width: '100%', cursor: 'pointer', display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 6, marginBottom: 16, boxShadow: '0 4px 14px rgba(22,101,52,0.3)' }}
      >
        <CameraIcon size={34} color="#fff" />
        <div style={{ fontFamily: 'Outfit, sans-serif', fontWeight: 700, fontSize: 16, color: '#fff' }}>{t('scanFirst')}</div>
        <div style={{ fontSize: 12, color: 'rgba(255,255,255,0.8)' }}>{t('scanSub')}</div>
      </button>

      <div style={{ textAlign: 'center', fontSize: 12, color: 'var(--muted)', marginBottom: 14, position: 'relative' }}>
        <div style={{ position: 'absolute', top: '50%', left: 0, right: 0, height: 1, background: 'var(--border)' }} />
        <span style={{ position: 'relative', background: 'var(--bg)', padding: '0 12px' }}>{t('orTypeManually')}</span>
      </div>

      <div className="card" style={{ marginBottom: 10 }}>
        <label className="label">{t('productName')}</label>
        <input
          className="input"
          value={name}
          onChange={e => setName(e.target.value)}
          placeholder={lang === 'ar' ? 'مثال: 7Up 330مل' : 'e.g. 7Up 330ml'}
          style={{ fontSize: 16, padding: 14 }}
        />
        {barcode && <div style={{ marginTop: 8, fontSize: 12, color: 'var(--green-text)' }}>📷 {t('barcodeLabel')}: {barcode}</div>}
      </div>

      {/* RESTOCK MODE */}
      {matchedProduct && (
        <div className="card" style={{ marginBottom: 10 }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 4 }}>
            <span style={{ fontSize: 26 }}>{getCategoryIcon(matchedProduct.category)}</span>
            <div>
              <div style={{ fontFamily: 'Outfit, sans-serif', fontWeight: 700, fontSize: 15 }}>{matchedProduct.name}</div>
              <div style={{ fontSize: 12, color: 'var(--muted)' }}>{t('restockTitle')} · {matchedProduct.total_quantity} {t('units')}</div>
            </div>
          </div>
          <div style={{ height: 1, background: 'var(--border)', margin: '12px 0' }} />

          <div style={{ display: 'flex', gap: 10, overflowX: 'auto', paddingBottom: 6, marginBottom: 4 }}>
            {(matchedProduct.product_batches ?? []).filter(b => b.is_active && b.quantity > 0).map((b, i, arr) => {
              const days = b.expiry_date ? daysUntilExpiry(b.expiry_date) : null
              const color = getBatchColor(i)
              return (
                <div key={b.id} style={{ flexShrink: 0, width: 130, background: 'var(--surface-2)', borderRadius: 14, padding: 12, border: `2px solid ${i === 0 ? color : 'var(--border)'}`, position: 'relative' }}>
                  {i === 0 && <div style={{ position: 'absolute', top: -9, left: 12, background: color, color: '#fff', fontSize: 9, fontWeight: 800, padding: '2px 8px', borderRadius: 10 }}>{t('sellingNow')}</div>}
                  {i > 0 && i === arr.length - 1 && <div style={{ position: 'absolute', top: -9, left: 12, background: 'var(--muted)', color: '#fff', fontSize: 9, fontWeight: 800, padding: '2px 8px', borderRadius: 10 }}>{t('nextUp')}</div>}
                  <div style={{ display: 'flex', alignItems: 'center', gap: 6, marginBottom: 8 }}>
                    <div style={{ width: 28, height: 28, borderRadius: 8, background: color, color: '#fff', display: 'flex', alignItems: 'center', justifyContent: 'center', fontFamily: 'Outfit, sans-serif', fontWeight: 800, fontSize: 15 }}>
                      {b.batch_label}
                    </div>
                    <span style={{ fontSize: 11, color: 'var(--muted)' }}>Batch {b.batch_label}</span>
                  </div>
                  <div style={{ fontFamily: 'Outfit, sans-serif', fontWeight: 700, fontSize: 22, color: 'var(--text)', lineHeight: 1 }}>{b.quantity}</div>
                  <div style={{ fontSize: 10, color: 'var(--muted)', marginBottom: 4 }}>{t('units')}</div>
                  <div style={{ fontSize: 11, fontWeight: 600, color: days != null && days <= 7 ? 'var(--red-text)' : days != null && days <= 30 ? 'var(--amber)' : 'var(--muted)' }}>
                    {b.expiry_date ? formatDate(b.expiry_date) : '—'}
                  </div>
                </div>
              )
            })}
            <div style={{ flexShrink: 0, width: 110, background: 'var(--surface)', borderRadius: 14, padding: 12, border: '2px dashed var(--border)', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', gap: 6 }}>
              <div style={{ width: 28, height: 28, borderRadius: 8, background: 'var(--green-light)', color: 'var(--green-text)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontFamily: 'Outfit, sans-serif', fontWeight: 800, fontSize: 15 }}>
                {nextBatchLabel((matchedProduct.product_batches ?? []).filter(b => b.is_active).map(b => b.batch_label))}
              </div>
              <div style={{ fontSize: 11, color: 'var(--muted)', textAlign: 'center' }}>{t('newBatch')}</div>
            </div>
          </div>

          <div style={{ background: 'var(--green-light)', borderRadius: 14, padding: 14, marginTop: 8 }}>
            <div style={{ display: 'flex', gap: 10 }}>
              <div style={{ flex: 1 }}>
                <label className="label">{t('quantity')}</label>
                <input className="input" type="number" value={batchQty} onChange={e => setBatchQty(e.target.value)} placeholder="0" />
              </div>
              <div style={{ flex: 1 }}>
                <label className="label">{t('expiryDate')}</label>
                <input className="input" type="date" value={batchExp} onChange={e => setBatchExp(e.target.value)} />
              </div>
            </div>
          </div>
          <button onClick={handleAddBatch} disabled={saving || !batchQty} className="btn-primary" style={{ marginTop: 10 }}>
            {saving ? t('saving') : `+ ${t('addBatch')}`}
          </button>
        </div>
      )}

      {/* NEW PRODUCT MODE */}
      {!matchedProduct && (
        <>
          <div className="card" style={{ marginBottom: 10 }}>
            <div className="section-title">{t('newProductTitle')}</div>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
              <div>
                <label className="label">{t('quantity')}</label>
                <input className="input" type="number" value={batchQty} onChange={e => setBatchQty(e.target.value)} placeholder="0" style={{ fontSize: 16 }} />
              </div>
              <div>
                <label className="label">{t('expiryDate')}</label>
                <input className="input" type="date" value={batchExp} onChange={e => setBatchExp(e.target.value)} />
              </div>
              <div>
                <label className="label">{t('category')}</label>
                <div style={{ display: 'flex', gap: 7, overflowX: 'auto', paddingBottom: 4 }}>
                  {CATEGORIES.map(c => (
                    <button
                      key={c.key}
                      onClick={() => setCategory(c.key)}
                      style={{
                        flexShrink: 0, padding: '7px 11px', borderRadius: 20,
                        border: `1.5px solid ${category === c.key ? 'var(--green)' : 'var(--border)'}`,
                        background: category === c.key ? 'var(--green-light)' : 'var(--surface)',
                        color: category === c.key ? 'var(--green-text)' : 'var(--text)',
                        cursor: 'pointer', fontSize: 12, display: 'flex', alignItems: 'center', gap: 4,
                      }}
                    >
                      {c.icon} {lang === 'ar' ? c.ar : c.key}
                    </button>
                  ))}
                </div>
              </div>
            </div>
          </div>

          <button onClick={() => setShowDetails(d => !d)} className="btn-link">
            {showDetails ? t('hideDetails') : t('moreDetails')}
          </button>

          {showDetails && (
            <div className="card" style={{ marginTop: 8, display: 'flex', flexDirection: 'column', gap: 10 }}>
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 10 }}>
                <div>
                  <label className="label">{t('costPrice')}</label>
                  <input className="input" type="number" step="0.01" value={buyPrice} onChange={e => setBuyPrice(e.target.value)} placeholder="0.00" />
                </div>
                <div>
                  <label className="label">{t('sellPrice')}</label>
                  <input className="input" type="number" step="0.01" value={sellPrice} onChange={e => setSellPrice(e.target.value)} placeholder="0.00" />
                </div>
              </div>
              {profit != null && profit > 0 && (
                <div style={{ background: 'var(--green-light)', borderRadius: 10, padding: '10px 14px', display: 'flex', alignItems: 'center', gap: 8 }}>
                  <TrendIcon size={16} color="var(--green)" />
                  <span style={{ fontSize: 13 }}>{t('profit')}: <strong style={{ color: 'var(--green-text)' }}>{store.currency} {profit.toFixed(2)}</strong> {t('perUnit')} ({margin}% {t('margin')})</span>
                </div>
              )}
              <div>
                <label className="label">{t('barcodeLabel')}</label>
                <div style={{ display: 'flex', gap: 8 }}>
                  <input className="input" value={barcode} onChange={e => setBarcode(e.target.value)} placeholder={t('typeBarcodeHere')} style={{ flex: 1 }} />
                  <button onClick={() => setShowScanner(true)} style={{ background: 'var(--green)', border: 'none', borderRadius: 10, padding: '10px 12px', cursor: 'pointer' }}>
                    <CameraIcon size={18} color="#fff" />
                  </button>
                </div>
              </div>
              <div>
                <label className="label">{t('notes')}</label>
                <input className="input" value={notes} onChange={e => setNotes(e.target.value)} placeholder={lang === 'ar' ? 'أي ملاحظات' : 'Any notes...'} />
              </div>
            </div>
          )}

          <button onClick={handleAddNewProduct} disabled={saving || !name.trim() || !batchQty} className="btn-primary" style={{ marginTop: 14 }}>
            {saving ? t('saving') : t('addNewProduct')}
          </button>
        </>
      )}

      {showScanner && (
        <BarcodeScanner lang={lang} onDetected={handleScanResult} onClose={() => setShowScanner(false)} />
      )}
    </div>
  )
}
