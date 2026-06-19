// ─── Color Palette ────────────────────────────────────────────────
export const COLORS = {
  GREEN:        '#166534',
  GREEN_DARK:   '#14532D',
  GREEN_LIGHT:  '#DCFCE7',
  GREEN_TEXT:   '#166534',
  RED:          '#FF1744',
  RED_BG:       '#FFF0F0',
  RED_TEXT:     '#C62828',
  AMBER:        '#92400E',
  AMBER_BG:     '#FEF3C7',
  BG:           '#F5F4EF',
  SURFACE:      '#FFFFFF',
  SURFACE_2:    '#F0EFE9',
  TEXT:         '#111827',
  MUTED:        '#6B7280',
  BORDER:       '#E5E7EB',
} as const

// ─── Batch System ─────────────────────────────────────────────────
export const BATCH_COLORS = [
  '#166534',  // A — green  (currently selling)
  '#1D4ED8',  // B — blue   (next)
  '#7C3AED',  // C — purple
  '#B45309',  // D — amber
  '#BE185D',  // E — pink
  '#0F766E',  // F — teal
] as const

export const BATCH_LETTERS = 'ABCDEFGHIJ'

export function getBatchColor(index: number): string {
  return BATCH_COLORS[index % BATCH_COLORS.length]
}

export function getBatchLabel(index: number): string {
  return BATCH_LETTERS[index] ?? String(index + 1)
}

// ─── Categories ───────────────────────────────────────────────────
export const CATEGORIES = [
  { key: 'Beverages',  ar: 'مشروبات',        icon: '🥤' },
  { key: 'Snacks',     ar: 'وجبات خفيفة',    icon: '🍟' },
  { key: 'Bakery',     ar: 'مخبوزات',         icon: '🍞' },
  { key: 'Dairy',      ar: 'ألبان',           icon: '🥛' },
  { key: 'Food',       ar: 'طعام',            icon: '🍜' },
  { key: 'Hygiene',    ar: 'نظافة',           icon: '🧼' },
  { key: 'Cleaning',   ar: 'تنظيف',          icon: '🧹' },
  { key: 'Fruits',     ar: 'فواكه',           icon: '🍎' },
  { key: 'Vegetables', ar: 'خضروات',          icon: '🥦' },
  { key: 'Meat',       ar: 'لحوم',            icon: '🥩' },
  { key: 'General',    ar: 'عام',             icon: '📦' },
] as const

export type CategoryKey = typeof CATEGORIES[number]['key']

const CAT_MAP = Object.fromEntries(CATEGORIES.map(c => [c.key, c.icon]))

export function getCategoryIcon(category: string): string {
  return CAT_MAP[category] ?? '📦'
}
