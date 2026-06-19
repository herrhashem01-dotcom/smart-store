'use client'

import { useState, useRef, useEffect } from 'react'
import { useStoreCtx } from '@/components/AppShell'
import { SendIcon } from '@/components/Icons'
import type { ChatMessage } from '@/types'

export default function AssistantPage() {
  const { lang, t } = useStoreCtx()
  const [messages, setMessages] = useState<ChatMessage[]>([
    { role: 'assistant', content: lang === 'ar' ? '👋 أنا مساعدك الذكي. اسألني عن أي شيء يخص متجرك.' : "👋 I'm your store assistant. Ask me anything about your business." },
  ])
  const [input, setInput] = useState('')
  const [busy, setBusy] = useState(false)
  const endRef = useRef<HTMLDivElement>(null)

  useEffect(() => { endRef.current?.scrollIntoView({ behavior: 'smooth' }) }, [messages])

  const send = async () => {
    const text = input.trim()
    if (!text || busy) return
    setInput('')
    const newMessages = [...messages, { role: 'user' as const, content: text }]
    setMessages(newMessages)
    setBusy(true)
    try {
      const res = await fetch('/api/ai', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ messages: newMessages, lang }),
      })
      const data = await res.json()
      setMessages(prev => [...prev, { role: 'assistant', content: data.reply ?? t('errorGeneric') }])
    } catch {
      setMessages(prev => [...prev, { role: 'assistant', content: t('errorGeneric') }])
    }
    setBusy(false)
  }

  const rtl = lang === 'ar'
  const suggestions = [t('q1'), t('q2'), t('q3'), t('q4')]

  return (
    <div style={{ height: 'calc(100vh - 56px - 64px)', display: 'flex', flexDirection: 'column' }}>
      <div style={{ flex: 1, overflowY: 'auto', padding: '12px 16px', display: 'flex', flexDirection: 'column', gap: 10 }}>
        {messages.length === 1 && (
          <div style={{ marginBottom: 6 }}>
            <div style={{ fontSize: 12, color: 'var(--muted)', marginBottom: 8 }}>{t('tryAsking')}</div>
            <div style={{ display: 'flex', flexWrap: 'wrap', gap: 6 }}>
              {suggestions.map(q => (
                <button
                  key={q}
                  onClick={() => setInput(q)}
                  style={{ background: 'var(--surface)', border: '1px solid var(--border)', borderRadius: 20, padding: '6px 12px', fontSize: 12, color: 'var(--text)', cursor: 'pointer' }}
                >
                  {q}
                </button>
              ))}
            </div>
          </div>
        )}
        {messages.map((m, i) => (
          <div key={i} style={{ display: 'flex', justifyContent: m.role === 'user' ? 'flex-end' : 'flex-start' }}>
            <div style={{
              maxWidth: '85%', padding: '10px 14px',
              borderRadius: m.role === 'user' ? (rtl ? '18px 18px 18px 4px' : '18px 18px 4px 18px') : (rtl ? '18px 18px 4px 18px' : '18px 18px 18px 4px'),
              background: m.role === 'user' ? 'var(--green)' : 'var(--surface)',
              color: m.role === 'user' ? '#fff' : 'var(--text)',
              fontSize: 14, lineHeight: 1.6, boxShadow: '0 1px 3px rgba(0,0,0,0.1)', whiteSpace: 'pre-wrap',
            }}>
              {m.content}
            </div>
          </div>
        ))}
        {busy && (
          <div style={{ display: 'flex' }}>
            <div style={{ background: 'var(--surface)', borderRadius: '18px 18px 18px 4px', padding: '14px 16px', boxShadow: '0 1px 3px rgba(0,0,0,0.1)', display: 'flex', gap: 5 }}>
              {[0, 1, 2].map(i => (
                <div key={i} style={{ width: 7, height: 7, borderRadius: '50%', background: 'var(--muted)', animation: `rdot 1.2s ${i * 0.15}s infinite ease-in-out` }} />
              ))}
            </div>
          </div>
        )}
        <div ref={endRef} />
      </div>
      <div style={{ flexShrink: 0, padding: '10px 12px', background: 'var(--header-bg)', borderTop: '1px solid var(--border)', display: 'flex', gap: 8, alignItems: 'center' }}>
        <input
          className="input"
          value={input}
          onChange={e => setInput(e.target.value)}
          onKeyDown={e => e.key === 'Enter' && send()}
          placeholder={t('askYourAssistant')}
          style={{ flex: 1 }}
        />
        <button
          onClick={send}
          disabled={busy}
          style={{ background: busy ? 'var(--muted)' : 'var(--green)', border: 'none', borderRadius: 12, padding: 12, cursor: 'pointer', display: 'flex', flexShrink: 0 }}
        >
          <SendIcon size={18} color="#fff" />
        </button>
      </div>
    </div>
  )
}
