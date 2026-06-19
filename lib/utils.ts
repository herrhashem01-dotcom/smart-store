import type { Product, ExpiryAlert } from '@/types'

// ─── Date helpers ─────────────────────────────────────────────────

export function daysUntilExpiry(expiryDate: string): number {
  const today = new Date()
  today.setHours(0, 0, 0, 0)
  const expiry = new Date(expiryDate + 'T00:00:00')
  return Math.ceil((expiry.getTime() - today.getTime()) / (1000 * 60 * 60 * 24))
}

export function daysSinceDate(dateStr: string): number {
  const date = new Date(dateStr)
  return Math.floor((Date.now() - date.getTime()) / (1000 * 60 * 60 * 24))
}

export function formatDate(dateStr: string): string {
  return new Date(dateStr + 'T00:00:00').toLocaleDateString('en-GB', {
    day: '2-digit', month: 'short', year: 'numeric',
  })
}

export function todayISO(): string {
  return new Date().toISOString().split('T')[0]
}

// ─── Business logic ───────────────────────────────────────────────

export function getProfitMargin(buyPrice: number, sellPrice: number): number {
  if (sellPrice === 0) return 0
  return Math.round(((sellPrice - buyPrice) / sellPrice) * 100)
}

export function formatCurrency(amount: number, currency = 'JOD'): string {
  return `${currency} ${amount.toFixed(2)}`
}

export type ExpiryLevel = 'expired' | 'critical' | 'warning' | 'caution' | 'ok'

export function getExpiryLevel(days: number): ExpiryLevel {
  if (days <= 0)  return 'expired'
  if (days <= 3)  return 'critical'
  if (days <= 7)  return 'warning'
  if (days <= 14) return 'caution'
  return 'ok'
}

export type StockLevel = 'out' | 'critical' | 'low' | 'ok'

export function getStockLevel(quantity: number, threshold: number): StockLevel {
  if (quantity <= 0)                         return 'out'
  if (quantity <= Math.ceil(threshold / 2))  return 'critical'
  if (quantity <= threshold)                 return 'low'
  return 'ok'
}

// ─── Alert computation ────────────────────────────────────────────

export function computeExpiryAlerts(products: Product[]): ExpiryAlert[] {
  return products
    .flatMap(p =>
      (p.product_batches ?? [])
        .filter(b => b.is_active && b.expiry_date)
        .map(b => ({
          productId:       p.id,
          productName:     p.name,
          category:        p.category,
          batchId:         b.id,
          batchLabel:      b.batch_label,
          quantity:        b.quantity,
          expiryDate:      b.expiry_date!,
          daysUntilExpiry: daysUntilExpiry(b.expiry_date!),
        }))
    )
    .filter(a => a.daysUntilExpiry <= 30)
    .sort((a, b) => a.daysUntilExpiry - b.daysUntilExpiry)
}

export function computeLowStock(products: Product[], storeThreshold: number): Product[] {
  return products
    .filter(p => {
      const threshold = p.low_stock_threshold ?? storeThreshold
      return p.total_quantity <= threshold
    })
    .sort((a, b) => a.total_quantity - b.total_quantity)
}

export function computeDeadStock(products: Product[]): Product[] {
  return products
    .filter(p => {
      if (!p.last_sold_at) return true // never sold
      return daysSinceDate(p.last_sold_at) >= 30
    })
    .sort((a, b) => {
      const dA = a.last_sold_at ? daysSinceDate(a.last_sold_at) : 9999
      const dB = b.last_sold_at ? daysSinceDate(b.last_sold_at) : 9999
      return dB - dA
    })
}

// ─── Misc ─────────────────────────────────────────────────────────

export function nextBatchLabel(existingLabels: string[]): string {
  const letters = 'ABCDEFGHIJ'
  for (let i = 0; i < letters.length; i++) {
    if (!existingLabels.includes(letters[i])) return letters[i]
  }
  return String(existingLabels.length + 1)
}

export function cn(...classes: (string | undefined | false | null)[]): string {
  return classes.filter(Boolean).join(' ')
}
