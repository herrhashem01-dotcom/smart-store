'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { createClient } from '@/lib/supabase/client'
import { translations, type Lang } from '@/lib/i18n'

export default function LoginPage() {
  const router = useRouter()
  const [lang, setLang] = useState<Lang>('ar')
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const t = translations[lang]
  const rtl = lang === 'ar'

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setError('')
    setLoading(true)
    const supabase = createClient()
    const { error } = await supabase.auth.signInWithPassword({ email, password })
    setLoading(false)
    if (error) {
      setError(error.message)
      return
    }
    router.push('/')
    router.refresh()
  }

  return (
    <div dir={rtl ? 'rtl' : 'ltr'} style={{ maxWidth: 430, margin: '0 auto', minHeight: '100vh', display: 'flex', flexDirection: 'column', padding: 24, justifyContent: 'center' }}>
      <button
        onClick={() => setLang(l => (l === 'en' ? 'ar' : 'en'))}
        style={{ position: 'absolute', top: 20, [rtl ? 'left' : 'right']: 20, background: 'var(--surface-2)', border: '1px solid var(--border)', borderRadius: 8, padding: '5px 10px', fontSize: 11, fontWeight: 700, color: 'var(--green)', cursor: 'pointer' }}
      >
        {lang === 'en' ? 'عربي' : 'EN'}
      </button>

      <div style={{ textAlign: 'center', marginBottom: 32 }}>
        <div style={{ fontSize: 48, marginBottom: 12 }}>🏪</div>
        <div style={{ fontFamily: 'Outfit, sans-serif', fontWeight: 800, fontSize: 24, color: 'var(--text)' }}>{t.welcomeTitle}</div>
        <div style={{ fontSize: 14, color: 'var(--muted)', marginTop: 4 }}>{t.welcomeSub}</div>
      </div>

      <form onSubmit={handleSubmit} className="card" style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
        <div>
          <label className="label">{t.emailLabel}</label>
          <input className="input" type="email" required value={email} onChange={e => setEmail(e.target.value)} placeholder="you@example.com" />
        </div>
        <div>
          <label className="label">{t.passwordLabel}</label>
          <input className="input" type="password" required value={password} onChange={e => setPassword(e.target.value)} placeholder="••••••••" />
        </div>
        {error && <div style={{ color: 'var(--red-text)', fontSize: 13, background: 'var(--red-bg)', padding: '10px 12px', borderRadius: 10 }}>{error}</div>}
        <button type="submit" className="btn-primary" disabled={loading}>
          {loading ? t.loading : t.signIn}
        </button>
      </form>

      <div style={{ textAlign: 'center', marginTop: 20, fontSize: 14, color: 'var(--muted)' }}>
        {t.dontHaveAccount}{' '}
        <a href="/signup" style={{ color: 'var(--green)', fontWeight: 600, textDecoration: 'none' }}>{t.signUp}</a>
      </div>
    </div>
  )
}
