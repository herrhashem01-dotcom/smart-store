// ─── Database Models ─────────────────────────────────────────────

export interface Store {
  id: string
  owner_id: string
  name: string
  language: 'ar' | 'en'
  currency: string
  dark_mode: boolean
  low_stock_threshold: number
  created_at: string
  updated_at: string
}

export interface Supplier {
  id: string
  store_id: string
  name: string
  phone?: string
  notes?: string
  balance_owed: number
  created_at: string
}

export interface Product {
  id: string
  store_id: string
  supplier_id?: string
  name: string
  category: string
  barcode?: string
  description?: string
  notes?: string
  buy_price: number
  sell_price: number
  total_quantity: number
  unit_type: string
  image_url?: string
  low_stock_threshold?: number
  is_active: boolean
  last_sold_at?: string
  created_at: string
  updated_at: string
  // Joined
  product_batches?: ProductBatch[]
  suppliers?: Supplier
}

export interface ProductBatch {
  id: string
  product_id: string
  store_id: string
  batch_label: string   // 'A' | 'B' | 'C' ...
  quantity: number
  buy_price?: number
  expiry_date?: string  // ISO date string 'YYYY-MM-DD'
  notes?: string
  is_active: boolean
  received_at: string
  created_at: string
}

export interface DailySales {
  id: string
  store_id: string
  sale_date: string
  total_revenue: number
  total_cost: number
  total_profit: number
  items_sold: number
  created_at: string
  updated_at: string
}

// ─── Computed / UI Types ──────────────────────────────────────────

export interface ExpiryAlert {
  productId: string
  productName: string
  category: string
  batchId: string
  batchLabel: string
  quantity: number
  expiryDate: string
  daysUntilExpiry: number
}

export interface DashboardMetrics {
  todayRevenue: number
  todayProfit: number
  todayMargin: number
  weekRevenue: number
  weekProfit: number
  inventoryValue: number
  supplierDebt: number
}

export interface DashboardAlerts {
  expiryAlerts: ExpiryAlert[]   // expiring within 30 days
  lowStockProducts: Product[]   // below threshold
  deadStockProducts: Product[]  // no sale in 30+ days
}

// ─── Form Types ───────────────────────────────────────────────────

export interface AddProductForm {
  name: string
  category: string
  barcode: string
  buy_price: string
  sell_price: string
  supplier_id: string
  notes: string
  // First batch
  batch_quantity: string
  batch_expiry: string
}

export interface AddBatchForm {
  quantity: string
  expiry_date: string
  buy_price: string
  notes: string
}

// ─── Chat Types ───────────────────────────────────────────────────

export interface ChatMessage {
  role: 'user' | 'assistant'
  content: string
}
