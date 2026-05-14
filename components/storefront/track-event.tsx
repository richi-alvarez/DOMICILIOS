'use client'

import { useEffect, useRef } from 'react'

interface Props {
  catalogId: string
  type: 'page_view' | 'product_view'
  productId?: string
}

export function TrackEvent({ catalogId, type, productId }: Props) {
  const fired = useRef(false)

  useEffect(() => {
    if (fired.current) return
    fired.current = true

    let sessionId = ''
    try {
      sessionId = sessionStorage.getItem('sf_sid') ?? ''
      if (!sessionId) {
        sessionId = Math.random().toString(36).slice(2)
        sessionStorage.setItem('sf_sid', sessionId)
      }
    } catch {}

    fetch('/api/track', {
      method: 'POST',
      headers: { 'content-type': 'application/json' },
      body: JSON.stringify({ catalogId, type, productId, sessionId }),
      keepalive: true,
    }).catch(() => {})
  }, [catalogId, type, productId])

  return null
}
