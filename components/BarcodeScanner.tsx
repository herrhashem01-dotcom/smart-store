'use client'

import { useState, useRef, useEffect } from 'react'
import { CameraIcon } from './Icons'
import { translations, type Lang } from '@/lib/i18n'

interface Props {
  lang: Lang
  onDetected: (code: string) => void
  onClose: () => void
}

export default function BarcodeScanner({ lang, onDetected, onClose }: Props) {
  const t = translations[lang]
  const [stage, setStage] = useState<'permission' | 'camera'>('permission')
  const [error, setError] = useState('')
  const [hasDetector, setHasDetector] = useState(false)
  const videoRef = useRef<HTMLVideoElement>(null)
  const intervalRef = useRef<ReturnType<typeof setInterval> | null>(null)

  useEffect(() => {
    setHasDetector(typeof window !== 'undefined' && 'BarcodeDetector' in window)
    checkExistingPermission()
    return () => stopCamera()
  }, [])

  const checkExistingPermission = async () => {
    try {
      // @ts-ignore - permissions.query for camera isn't in all TS lib versions
      const status = await navigator.permissions.query({ name: 'camera' as PermissionName })
      if (status.state === 'granted') {
        setStage('camera')
        setTimeout(startCamera, 100)
      } else if (status.state === 'denied') {
        setError(t.cameraDenied)
      }
    } catch {
      // Permissions API not supported for camera — fall through to the permission sheet
    }
  }

  const handlePermissionChoice = (choice: 'allow' | 'once' | 'deny') => {
    if (choice === 'deny') {
      onClose()
      return
    }
    setStage('camera')
    setTimeout(startCamera, 100)
  }

  const startCamera = async () => {
    setError('')
    try {
      const stream = await navigator.mediaDevices.getUserMedia({
        video: { facingMode: { ideal: 'environment' } },
      })
      if (!videoRef.current) return
      videoRef.current.srcObject = stream
      await videoRef.current.play()

      if (hasDetector) {
        // @ts-ignore - BarcodeDetector is a newer Web API
        const detector = new window.BarcodeDetector({
          formats: ['ean_13', 'ean_8', 'code_128', 'code_39', 'qr_code', 'upc_a', 'upc_e'],
        })
        intervalRef.current = setInterval(async () => {
          try {
            if (!videoRef.current || videoRef.current.paused) return
            const codes = await detector.detect(videoRef.current)
            if (codes.length > 0) {
              onDetected(codes[0].rawValue)
              stopCamera()
            }
          } catch {
            // detection frame failed — try again next tick
          }
        }, 400)
      }
    } catch (e: any) {
      setError(e?.name === 'NotAllowedError' ? t.cameraDenied : t.noCameraFound)
      setStage('permission')
    }
  }

  const stopCamera = () => {
    if (intervalRef.current) clearInterval(intervalRef.current)
    const stream = videoRef.current?.srcObject as MediaStream | null
    stream?.getTracks().forEach(track => track.stop())
    if (videoRef.current) videoRef.current.srcObject = null
  }

  const handleManualSubmit = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Enter' && e.currentTarget.value.trim()) {
      onDetected(e.currentTarget.value.trim())
      stopCamera()
    }
  }

  if (stage === 'permission') {
    return (
      <div className="overlay" style={{ display: 'flex', alignItems: 'flex-end', justifyContent: 'center', zIndex: 1000 }}>
        <div style={{ background: 'var(--surface)', borderRadius: '24px 24px 0 0', padding: 28, width: '100%', maxWidth: 430, paddingBottom: 'max(28px, env(safe-area-inset-bottom, 28px))' }}>
          <div style={{ display: 'flex', justifyContent: 'center', marginBottom: 16 }}>
            <div style={{ background: 'var(--green-light)', borderRadius: 20, padding: 16 }}>
              <CameraIcon size={32} color="var(--green)" />
            </div>
          </div>
          <div style={{ fontFamily: 'Outfit, sans-serif', fontWeight: 700, fontSize: 18, color: 'var(--text)', textAlign: 'center', marginBottom: 8 }}>
            {t.cameraAccess}
          </div>
          <div style={{ fontSize: 14, color: 'var(--muted)', textAlign: 'center', lineHeight: 1.5, marginBottom: 24 }}>
            {t.cameraDesc}
          </div>
          {error && (
            <div style={{ background: 'var(--red-bg)', color: 'var(--red-text)', borderRadius: 10, padding: '10px 14px', marginBottom: 16, fontSize: 13, textAlign: 'center' }}>
              {error}
            </div>
          )}
          <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
            <button onClick={() => handlePermissionChoice('allow')} className="btn-primary">{t.allowWhileUsing}</button>
            <button onClick={() => handlePermissionChoice('once')} className="btn-secondary">{t.allowOnce}</button>
            <button onClick={() => handlePermissionChoice('deny')} className="btn-outline">{t.dontAllowBtn}</button>
          </div>
        </div>
      </div>
    )
  }

  return (
    <div style={{ position: 'fixed', inset: 0, background: '#000', zIndex: 1000, display: 'flex', flexDirection: 'column' }}>
      <div style={{ flex: 1, position: 'relative', overflow: 'hidden' }}>
        <video ref={videoRef} autoPlay playsInline muted style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
        <div style={{ position: 'absolute', inset: 0, display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center' }}>
          <div style={{ position: 'absolute', inset: 0, background: 'rgba(0,0,0,0.45)' }} />
          <div style={{ position: 'relative', width: 260, height: 190, zIndex: 1 }}>
            <div style={{ position: 'absolute', top: 0, left: 0, width: 28, height: 28, borderTop: '3px solid var(--green)', borderLeft: '3px solid var(--green)', borderRadius: '4px 0 0 0' }} />
            <div style={{ position: 'absolute', top: 0, right: 0, width: 28, height: 28, borderTop: '3px solid var(--green)', borderRight: '3px solid var(--green)', borderRadius: '0 4px 0 0' }} />
            <div style={{ position: 'absolute', bottom: 0, left: 0, width: 28, height: 28, borderBottom: '3px solid var(--green)', borderLeft: '3px solid var(--green)', borderRadius: '0 0 0 4px' }} />
            <div style={{ position: 'absolute', bottom: 0, right: 0, width: 28, height: 28, borderBottom: '3px solid var(--green)', borderRight: '3px solid var(--green)', borderRadius: '0 0 4px 0' }} />
            <div style={{ position: 'absolute', left: 4, right: 4, height: 2, background: 'var(--green)', boxShadow: '0 0 10px var(--green)', animation: 'scanLine 2s linear infinite', opacity: 0.9 }} />
          </div>
          <div style={{ position: 'relative', zIndex: 1, marginTop: 20, textAlign: 'center', padding: '0 20px' }}>
            <div style={{ color: '#fff', fontSize: 14, fontWeight: 500 }}>{t.pointAtBarcode}</div>
            {!hasDetector && <div style={{ color: '#FBBF24', fontSize: 12, marginTop: 6 }}>{t.noDetector}</div>}
          </div>
        </div>
      </div>
      <div style={{ background: '#111', padding: '16px 20px', paddingBottom: 'max(16px, env(safe-area-inset-bottom, 16px))' }}>
        {!hasDetector && (
          <input
            placeholder={t.typeBarcodeHere}
            onKeyDown={handleManualSubmit}
            style={{ width: '100%', padding: '12px 14px', borderRadius: 10, border: '1px solid #555', background: '#222', color: '#fff', fontSize: 14, marginBottom: 12, outline: 'none' }}
          />
        )}
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <div style={{ color: 'rgba(255,255,255,0.7)', fontSize: 13 }}>{t.scanning}</div>
          <button
            onClick={() => { stopCamera(); onClose(); }}
            style={{ background: 'rgba(255,255,255,0.15)', border: 'none', borderRadius: 10, padding: '10px 20px', color: '#fff', fontSize: 14, fontWeight: 600, cursor: 'pointer' }}
          >
            {t.cancel}
          </button>
        </div>
      </div>
    </div>
  )
}
