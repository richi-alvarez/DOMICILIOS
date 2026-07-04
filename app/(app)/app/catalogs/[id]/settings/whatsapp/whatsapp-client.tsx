'use client'

import { useEffect, useRef, useState, useTransition } from 'react'
import { Bot, User, Send, MessageCircle, RefreshCw, Trash2, Store } from 'lucide-react'
import { Switch } from '@/components/ui/switch'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import {
  getMessagesAction,
  setModeAction,
  sendManualReplyAction,
  listConversationsAction,
  deleteConversationAction,
  setStoreReplyAction,
} from '@/lib/actions/whatsapp'
import { useI18n } from '@/lib/i18n/context'

interface Conversation {
  id: string
  customerPhone: string
  customerName: string | null
  mode: 'ai' | 'human'
  storeReplyEnabled: boolean
  lastMessageText: string | null
  lastMessageAt: string | null
}

interface Message {
  id: string
  direction: 'inbound' | 'outbound'
  sender: 'customer' | 'bot' | 'agent' | 'system'
  body: string
  status: string | null
  createdAt: string | Date
}

interface Props {
  catalogId: string
  storeReplyFeatureEnabled: boolean
  initialConversations: Conversation[]
}

function timeLabel(d: string | Date | null | undefined, dtLocale: string) {
  if (!d) return ''
  const date = new Date(d)
  if (isNaN(date.getTime())) return ''
  return date.toLocaleTimeString(dtLocale, { hour: '2-digit', minute: '2-digit' })
}

export function WhatsappClient({ catalogId, storeReplyFeatureEnabled, initialConversations }: Props) {
  const { t, locale } = useI18n()
  const dtLocale = locale === 'en' ? 'en-US' : 'es-CO'
  const [conversations, setConversations] = useState<Conversation[]>(initialConversations)
  const [activeId, setActiveId] = useState<string | null>(initialConversations[0]?.id ?? null)
  const [messages, setMessages] = useState<Message[]>([])
  const [draft, setDraft] = useState('')
  const [isPending, startTransition] = useTransition()
  const [error, setError] = useState<string | null>(null)
  const scrollRef = useRef<HTMLDivElement>(null)

  const active = conversations.find((c) => c.id === activeId) ?? null

  async function loadMessages(convId: string) {
    try {
      const msgs = (await getMessagesAction(convId)) as unknown as Message[]
      setMessages(msgs)
    } catch {
      /* noop */
    }
  }

  async function refreshConversations() {
    try {
      const convs = (await listConversationsAction(catalogId)) as any[]
      setConversations(
        convs.map((c) => ({
          id: c.id,
          customerPhone: c.customerPhone,
          customerName: c.customerName,
          mode: c.mode,
          storeReplyEnabled: c.storeReplyEnabled,
          lastMessageText: c.lastMessageText,
          lastMessageAt: c.lastMessageAt ? new Date(c.lastMessageAt).toISOString() : null,
        })),
      )
    } catch {
      /* noop */
    }
  }

  // Cargar mensajes al cambiar de conversación
  useEffect(() => {
    if (activeId) loadMessages(activeId)
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [activeId])

  // Polling cada 5s: refresca mensajes de la conversación activa + lista
  useEffect(() => {
    const t = setInterval(() => {
      if (activeId) loadMessages(activeId)
      refreshConversations()
    }, 5000)
    return () => clearInterval(t)
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [activeId, catalogId])

  useEffect(() => {
    scrollRef.current?.scrollTo({ top: scrollRef.current.scrollHeight })
  }, [messages])

  function toggleMode(checked: boolean) {
    if (!active) return
    const mode = checked ? 'ai' : 'human'
    setConversations((prev) => prev.map((c) => (c.id === active.id ? { ...c, mode } : c)))
    startTransition(async () => {
      await setModeAction(active.id, mode).catch(() => {})
    })
  }

  function toggleStoreReply(checked: boolean) {
    if (!active) return
    setConversations((prev) => prev.map((c) => (c.id === active.id ? { ...c, storeReplyEnabled: checked } : c)))
    startTransition(async () => {
      await setStoreReplyAction(active.id, checked).catch(() => {})
    })
  }

  function deleteConversation() {
    if (!active) return
    if (!confirm(`${t('settings.whatsappClient.confirmDeletePre')}${active.customerName || active.customerPhone}${t('settings.whatsappClient.confirmDeletePost')}`)) {
      return
    }
    const convId = active.id
    startTransition(async () => {
      const res = await deleteConversationAction(convId).catch(() => ({ error: t('settings.whatsappClient.deleteFailed') }))
      if ((res as any)?.error) {
        setError((res as any).error)
        return
      }
      setConversations((prev) => {
        const next = prev.filter((c) => c.id !== convId)
        setActiveId(next[0]?.id ?? null)
        return next
      })
      setMessages([])
    })
  }

  function send() {
    if (!active || !draft.trim()) return
    const body = draft.trim()
    setDraft('')
    setError(null)
    startTransition(async () => {
      const res = await sendManualReplyAction(active.id, body)
      if (res?.error) setError(res.error)
      await loadMessages(active.id)
    })
  }

  if (conversations.length === 0) {
    return (
      <div className="flex flex-col items-center gap-3 rounded-2xl border border-warm-200 bg-white py-20 text-center">
        <MessageCircle className="h-12 w-12 text-warm-300" />
        <p className="text-night-500">{t('settings.whatsappClient.emptyTitle')}</p>
        <p className="text-xs text-warm-400">{t('settings.whatsappClient.emptyDesc')}</p>
      </div>
    )
  }

  return (
    <div className="grid h-[70vh] grid-cols-1 gap-4 sm:grid-cols-[300px_1fr]">
      {/* Lista de conversaciones */}
      <div className="overflow-y-auto rounded-2xl border border-warm-200 bg-white">
        {conversations.map((c) => (
          <button
            key={c.id}
            onClick={() => setActiveId(c.id)}
            className={`flex w-full flex-col gap-0.5 border-b border-warm-100 px-4 py-3 text-left transition hover:bg-warm-50 ${
              c.id === activeId ? 'bg-primary-50' : ''
            }`}
          >
            <div className="flex items-center justify-between">
              <span className="truncate font-semibold text-night-800">
                {c.customerName || c.customerPhone}
              </span>
              <span
                className={`shrink-0 rounded-full px-2 py-0.5 text-[10px] font-bold ${
                  c.mode === 'ai' ? 'bg-lime-100 text-lime-700' : 'bg-blue-100 text-blue-700'
                }`}
              >
                {c.mode === 'ai' ? t('settings.whatsappClient.modeAi') : t('settings.whatsappClient.modeHuman')}
              </span>
            </div>
            <span className="truncate text-xs text-warm-500">{c.lastMessageText || '—'}</span>
          </button>
        ))}
      </div>

      {/* Panel de chat */}
      <div className="flex flex-col overflow-hidden rounded-2xl border border-warm-200 bg-white">
        {active ? (
          <>
            <div className="flex items-center justify-between border-b border-warm-100 px-4 py-3">
              <div className="min-w-0">
                <p className="truncate font-semibold text-night-800">
                  {active.customerName || active.customerPhone}
                </p>
                <p className="text-xs text-warm-400">+{active.customerPhone}</p>
              </div>
              <div className="flex items-center gap-4">
                <label className="flex items-center gap-2 text-xs font-medium text-night-600">
                  <User className="h-4 w-4" /> {t('settings.whatsappClient.modeHuman')}
                  <Switch checked={active.mode === 'ai'} onCheckedChange={toggleMode} />
                  {t('settings.whatsappClient.modeAi')} <Bot className="h-4 w-4" />
                </label>
                <button
                  type="button"
                  onClick={deleteConversation}
                  disabled={isPending}
                  title={t('settings.whatsappClient.deleteTitle')}
                  className="rounded-lg p-2 text-warm-400 transition hover:bg-red-50 hover:text-red-600 disabled:opacity-50"
                >
                  <Trash2 className="h-4 w-4" />
                </button>
              </div>
            </div>

            {/* Opción (solo si WHATSAPP_STORE_REPLY global está activo y el chat está en Humano):
                permitir que la tienda responda desde su propio WhatsApp para esta conversación. */}
            {storeReplyFeatureEnabled && active.mode === 'human' && (
              <div className="flex items-center justify-between border-b border-warm-100 bg-warm-50/60 px-4 py-2">
                <span className="flex items-center gap-2 text-xs text-night-600">
                  <Store className="h-4 w-4 text-night-400" />
                  {t('settings.whatsappClient.storeReply')}
                </span>
                <Switch checked={active.storeReplyEnabled} onCheckedChange={toggleStoreReply} />
              </div>
            )}

            <div ref={scrollRef} className="flex-1 space-y-2 overflow-y-auto bg-warm-50 p-4">
              {messages.map((m) => {
                const mine = m.direction === 'outbound'
                return (
                  <div key={m.id} className={`flex ${mine ? 'justify-end' : 'justify-start'}`}>
                    <div
                      className={`max-w-[75%] whitespace-pre-wrap rounded-2xl px-3 py-2 text-sm ${
                        mine
                          ? m.sender === 'bot'
                            ? 'bg-lime-100 text-night-800'
                            : 'bg-primary-500 text-white'
                          : 'bg-white text-night-800 shadow-sm'
                      }`}
                    >
                      {m.sender === 'bot' && <span className="mb-0.5 block text-[10px] font-bold opacity-70">{t('settings.whatsappClient.bot')}</span>}
                      {m.sender === 'system' && <span className="mb-0.5 block text-[10px] font-bold opacity-70">{t('settings.whatsappClient.system')}</span>}
                      {m.body}
                      <span className="ml-2 inline-block text-[10px] opacity-60">{timeLabel(m.createdAt, dtLocale)}</span>
                    </div>
                  </div>
                )
              })}
              {messages.length === 0 && (
                <p className="py-8 text-center text-sm text-warm-400">{t('settings.whatsappClient.noMessages')}</p>
              )}
            </div>

            {error && <p className="px-4 py-2 text-xs text-red-600">{error}</p>}

            <div className="flex items-center gap-2 border-t border-warm-100 p-3">
              <Input
                value={draft}
                onChange={(e) => setDraft(e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === 'Enter' && !e.shiftKey) {
                    e.preventDefault()
                    send()
                  }
                }}
                placeholder={active.mode === 'ai' ? t('settings.whatsappClient.placeholderAi') : t('settings.whatsappClient.placeholderHuman')}
                disabled={isPending}
              />
              <Button onClick={send} disabled={isPending || !draft.trim()} size="md">
                {isPending ? <RefreshCw className="h-4 w-4 animate-spin" /> : <Send className="h-4 w-4" />}
              </Button>
            </div>
          </>
        ) : (
          <div className="flex flex-1 items-center justify-center text-sm text-warm-400">
            {t('settings.whatsappClient.selectConversation')}
          </div>
        )}
      </div>
    </div>
  )
}
