'use client'

import { createContext, useContext, useState, useMemo } from 'react'
import { usePathname, useRouter } from 'next/navigation'
import { createClient } from '@/lib/supabase/client'
import { translations, type Lang, type TKey } from '@/lib/i18n'
import { getCategoryIcon } from '@/lib/constants'
import { formatDate } from '@/lib/utils'
import type { Store, ExpiryAlert, Product } from '@/types'
import {
  HomeIcon, BoxIcon, PlusIcon, ChatIcon, BellIcon, CloseIcon, LogoutIcon,
} from './Icons'

interface StoreCtxValue {
  store: Store
  lang: Lang
  dark: boolean
  t: (key: TKey) => string
  setLang: (l: Lang) => void
  setDark: (d: boolean) => void
}

const StoreCtx = createContext<StoreCtxValue | null>(null)

export function useStoreCtx() {
  const ctx = useContext(StoreCtx)
  if (!ctx) throw new Error('useStoreCtx must be used inside AppShell')
  return ctx
}

interface Props {
  store: Store
  expiryAlerts: ExpiryAlert[]
  lowStockProducts: Product[]
  children: React.ReactNode
}

export default function AppShell({ store, expiryAlerts, lowStockProducts, children }: Props) {
  const router = useRouter()
  const pathname = usePathname()
  const supabase = useMemo(() => createClient(), [])

  const [lang, setLangState] = useState<Lang>(store.language)
  const [dark, setDarkState] = useState<boolean>(store.dark_mode)
  const [showAlerts, setShowAlerts] = useState(false)

  const t = (key: TKey) => translations[lang][key]
  const rtl = lang === 'ar'

  const setLang = (l: Lang) => {
    setLangState(l)
    supabase.from('stores').update({ language: l }).eq('id', store.id)
  }
  const setDark = (d: boolean) => {
    setDarkState(d)
    supabase.from('stores').update({ dark_mode: d }).eq('id', store.id)
  }

  const urgentCount =
    expiryAlerts.filter(a => a.daysUntilExpiry <= 7).length +
    lowStockProducts.filter(p => p.total_quantity <= 3).length

  const handleLogout = async () => {
    await supabase.auth.signOut()
    router.push('/login')
    router.refresh()
  }

  const NAV = [
    { id: '/', icon: HomeIcon, label: t('home') },
    { id: '/products', icon: BoxIcon, label: t('products') },
    { id: '/add', icon: PlusIcon, special: true },
    { id: '/assistant', icon: ChatIcon, label: t('assistant') },
  ]

  const TITLES: Record<string, string> = {
    '/': t('appName'),
    '/products': t('products'),
    '/add': t('addProduct'),
    '/assistant': t('assistant'),
  }

  return (
    <StoreCtx.Provider value={{ store, lang, dark, t, setLang, setDark }}>
      <div dir={rtl ? 'rtl' : 'ltr'} data-theme={dark ? 'dark' : 'light'} className="app-shell">
        {/* HEADER */}
        <div className="header">
          <button
            onClick={() => setLang(lang === 'en' ? 'ar' : 'en')}
            style={{ background: 'var(--surface-2)', border: '1px solid var(--border)', borderRadius: 8, padding: '5px 10px', fontSize: 11, fontWeight: 700, color: 'var(--green)', cursor: 'pointer' }}
          >
            {lang === 'en' ? 'عربي' : 'EN'}
          </button>
          <span className="header-title">{TITLES[pathname] ?? t('appName')}</span>
          <button
            onClick={() => setShowAlerts(true)}
            style={{ background: 'none', border: 'none', cursor: 'pointer', padding: 6, position: 'relative', display: 'flex', alignItems: 'center' }}
          >
            <BellIcon size={22} color={urgentCount > 0 ? 'var(--red)' : 'var(--muted)'} />
            {urgentCount > 0 && (
              <div className="bell-badge" style={{ [rtl ? 'left' : 'right']: 2 }}>{urgentCount}</div>
            )}
          </button>
        </div>

        {/* CONTENT */}
        {children}

        {/* BOTTOM NAV */}
        <div className="bottom-nav">
          {NAV.map(item => {
            const active = pathname === item.id
            const Icon = item.icon
            return (
              <button
                key={item.id}
                onClick={() => router.push(item.id)}
                className={`nav-btn ${active ? 'active' : ''}`}
                style={{ padding: item.special ? '6px 0' : undefined }}
              >
                {item.special ? (
                  <div className="nav-btn-special"><Icon size={20} color="#fff" /></div>
                ) : (
                  <Icon size={22} color={active ? 'var(--green)' : 'var(--muted)'} />
                )}
                {!item.special && <span className="nav-btn-label">{item.label}</span>}
              </button>
            )
          })}
        </div>

        {/* ALERTS PANEL */}
        {showAlerts && (
          <>
            <div className="overlay" onClick={() => setShowAlerts(false)} />
            <div style={{
              position: 'fixed', top: 0, [rtl ? 'left' : 'right']: 0, width: '88%', maxWidth: 380,
              height: '100%', background: 'var(--surface)', zIndex: 901,
              boxShadow: rtl ? '4px 0 20px rgba(0,0,0,0.25)' : '-4px 0 20px rgba(0,0,0,0.25)',
              display: 'flex', flexDirection: 'column',
            }}>
              <div style={{ padding: '16px 20px', borderBottom: '1px solid var(--border)', display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexShrink: 0 }}>
                <span style={{ fontFamily: 'Outfit, sans-serif', fontWeight: 700, fontSize: 17 }}>🔔 {t('expiryAlerts')}</span>
                <button onClick={() => setShowAlerts(false)} style={{ background: 'none', border: 'none', cursor: 'pointer', padding: 4 }}>
                  <CloseIcon size={20} color="var(--muted)" />
                </button>
              </div>
              <div style={{ flex: 1, overflowY: 'auto', padding: 16 }}>
                {urgentCount === 0 && expiryAlerts.length === 0 && lowStockProducts.length === 0 && (
                  <div style={{ textAlign: 'center', padding: '40px 20px', color: 'var(--muted)', fontSize: 15 }}>{t('noAlerts')}</div>
                )}
                {expiryAlerts.length > 0 && (
                  <>
                    <div style={{ fontFamily: 'Outfit, sans-serif', fontWeight: 700, fontSize: 12, color: 'var(--muted)', marginBottom: 10, letterSpacing: '0.06em' }}>
                      ⏰ {t('expiryAlerts').toUpperCase()}
                    </div>
                    <div style={{ display: 'flex', flexDirection: 'column', gap: 6, marginBottom: 16 }}>
                      {expiryAlerts.map((a, i) => {
                        const level = a.daysUntilExpiry <= 3 ? 'red' : a.daysUntilExpiry <= 7 ? 'amber' : 'green'
                        return (
                          <div key={i} className="alert-row" style={{ borderLeft: rtl ? undefined : `3px solid var(--${level === 'red' ? 'red' : level === 'amber' ? 'amber' : 'green'})`, borderRight: rtl ? `3px solid var(--${level === 'red' ? 'red' : level === 'amber' ? 'amber' : 'green'})` : undefined }}>
                            <div className="alert-icon">{getCategoryIcon(a.category)}</div>
                            <div style={{ flex: 1, minWidth: 0 }}>
                              <div className="alert-name">{a.productName}</div>
                              <div className="alert-sub">{a.quantity} {t('units')} · {formatDate(a.expiryDate)}</div>
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
                {lowStockProducts.length > 0 && (
                  <>
                    <div style={{ fontFamily: 'Outfit, sans-serif', fontWeight: 700, fontSize: 12, color: 'var(--muted)', marginBottom: 10, letterSpacing: '0.06em' }}>
                      📦 {t('lowStock').toUpperCase()}
                    </div>
                    <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
                      {lowStockProducts.map(p => {
                        const critical = p.total_quantity <= 3
                        return (
                          <div key={p.id} className="alert-row" style={{ borderLeft: rtl ? undefined : `3px solid var(--${critical ? 'red' : 'amber'})`, borderRight: rtl ? `3px solid var(--${critical ? 'red' : 'amber'})` : undefined }}>
                            <div className="alert-icon">{getCategoryIcon(p.category)}</div>
                            <div style={{ flex: 1, minWidth: 0 }}>
                              <div className="alert-name">{p.name}</div>
                            </div>
                            <span className={`badge badge-${critical ? 'red' : 'amber'}`}>{p.total_quantity} {t('left')}</span>
                          </div>
                        )
                      })}
                    </div>
                  </>
                )}
              </div>
              <div style={{ padding: 16, borderTop: '1px solid var(--border)', flexShrink: 0 }}>
                <button onClick={handleLogout} className="btn-outline" style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 8 }}>
                  <LogoutIcon size={16} color="var(--muted)" /> {t('logout')}
                </button>
              </div>
            </div>
          </>
        )}
      </div>
    </StoreCtx.Provider>
  )
}
