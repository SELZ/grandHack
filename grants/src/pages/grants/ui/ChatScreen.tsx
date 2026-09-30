import { useEffect, useRef, useState, type FormEvent } from 'react'
import type { Grant } from '@/entities/grant'
import assistantAvatar from '@/shared/assets/chat/assistant-avatar.svg'

type ChatMessage = {
  id: string
  role: 'user' | 'assistant'
  text: string
  grantIds?: string[]
}

type ChatScreenProps = {
  grants: Grant[]
  onSendMessage: (message: string) => Promise<{ text: string; grantIds: string[] }>
  onOpenGrant: (grant: Grant) => void
}

const conversationKey = 'grants-assistant-conversation-v1'
const draftKey = 'grants-assistant-draft-v1'
const prompts = ['Подбери мне гранты', 'Какие документы нужны?', 'Что такое софинансирование?']
const welcomeMessage: ChatMessage = {
  id: 'welcome',
  role: 'assistant',
  text: 'Привет! Подберу гранты по отрасли, каталогу и данным из профиля. Спроси про подходящие программы, документы или софинансирование.',
}

function readSaved<T>(key: string, fallback: T): T {
  try {
    const saved: unknown = JSON.parse(localStorage.getItem(key) ?? 'null')
    return saved === null ? fallback : saved as T
  } catch {
    return fallback
  }
}

export function ChatScreen({ grants, onSendMessage, onOpenGrant }: ChatScreenProps) {
  const [messages, setMessages] = useState<ChatMessage[]>(() => readSaved(conversationKey, [welcomeMessage]))
  const [draft, setDraft] = useState(() => {
    try { return localStorage.getItem(draftKey)?.slice(0, 1000) ?? '' } catch { return '' }
  })
  const [sending, setSending] = useState(false)
  const conversationRef = useRef<HTMLDivElement>(null)
  const inputRef = useRef<HTMLInputElement>(null)

  useEffect(() => {
    try { localStorage.setItem(conversationKey, JSON.stringify(messages.slice(-60))) } catch {}
    if (conversationRef.current) conversationRef.current.scrollTop = conversationRef.current.scrollHeight
  }, [messages])

  useEffect(() => {
    try { localStorage.setItem(draftKey, draft) } catch {}
  }, [draft])

  async function sendMessage(value: string) {
    const text = value.trim().slice(0, 1000)
    if (!text || sending) return
    const id = globalThis.crypto?.randomUUID?.() ?? `${Date.now()}-${messages.length}`
    setMessages(current => [...current, { id, role: 'user' as const, text }].slice(-60))
    setDraft('')
    setSending(true)
    try {
      const answer = await onSendMessage(text)
      setMessages(current => [...current, { id: `${id}-reply`, role: 'assistant' as const, ...answer }].slice(-60))
    } catch (error) {
      setMessages(current => [...current, {
        id: `${id}-error`, role: 'assistant' as const,
        text: error instanceof Error ? error.message : 'Не удалось получить ответ. Попробуйте ещё раз.',
      }].slice(-60))
    } finally {
      setSending(false)
      inputRef.current?.focus()
    }
  }

  function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault()
    void sendMessage(draft)
  }

  return (
    <main className="grant-chat mx-auto flex h-[calc(100dvh-73px-env(safe-area-inset-bottom,0px))] min-h-0 w-full max-w-4xl shrink-0 flex-col overflow-hidden text-[#e2e4e5] lg:h-[calc(100dvh-64px)]" aria-labelledby="grant-chat-title">
      <header className="grant-chat__header flex shrink-0 items-center gap-3 px-4 py-4 sm:px-6 lg:py-5">
        <img src={assistantAvatar} alt="" className="grant-chat__avatar block shrink-0" />
        <div className="min-w-0">
          <h1 id="grant-chat-title" className="text-lg leading-6 font-semibold">Грант-ассистент</h1>
          <p className="mt-0.5 text-xs leading-4 text-[#e2e4e5]/65">Подбор по каталогу и профилю бизнеса</p>
        </div>
      </header>

      <div ref={conversationRef} className="grant-chat__conversation min-h-0 flex-1 space-y-4 overflow-y-auto overscroll-y-contain px-4 pt-2 pb-4 [scrollbar-color:#536879_transparent] [scrollbar-width:thin] sm:px-6" role="log" aria-label="Переписка с грант-ассистентом" aria-live="polite">
        {messages.map(message => (
          <article key={message.id} className={`w-fit max-w-[90%] rounded-2xl border border-white/15 px-3 py-2.5 text-[15px] leading-relaxed [overflow-wrap:anywhere] sm:px-4 sm:py-3 lg:max-w-[75%] ${message.role === 'user' ? 'ml-auto rounded-br-none bg-[#536879]/70' : 'rounded-bl-none bg-[#d9d9d9]/20'}`}>
            <p className="whitespace-pre-wrap">{message.text}</p>
            {message.grantIds?.map(id => {
              const grant = grants.find(item => item.id === id)
              if (!grant) return null
              return <button key={id} type="button" className="my-3 flex w-full flex-col gap-1.5 rounded-xl border border-white/15 bg-black/15 p-3 text-left text-inherit transition-colors hover:bg-white/10" onClick={() => onOpenGrant(grant)}>
                <span>{grant.title}</span>
                <small className="text-xs leading-4 text-[#e2e4e5]/75">{grant.amountText}</small>
                <span className="text-xs leading-4 text-[#e2e4e5]/75 underline underline-offset-2">Посмотреть условия →</span>
              </button>
            })}
          </article>
        ))}
        {sending && <p className="text-sm text-[#e2e4e5]/65" role="status">Подбираю программы…</p>}
      </div>

      <div className="grant-chat__controls shrink-0 px-4 pt-2 pb-2 sm:px-6 lg:pb-4">
        <div className="grant-chat__prompts flex items-center gap-2 overflow-x-auto py-1 [scrollbar-width:none] [&::-webkit-scrollbar]:hidden" aria-label="Примеры вопросов">
          {prompts.map(prompt => <button key={prompt} type="button" disabled={sending} className="inline-flex min-h-9 shrink-0 items-center justify-center rounded-full border border-white/15 bg-[#536879]/50 px-3.5 text-xs whitespace-nowrap hover:bg-[#536879]/75 disabled:opacity-50 sm:text-[13px]" onClick={() => void sendMessage(prompt)}>{prompt}</button>)}
        </div>
        <form className="grant-chat__composer mt-2 flex min-h-12 items-center gap-3 rounded-3xl border border-white/20 bg-[#d9d9d9]/10 py-1.5 pr-1.5 pl-4 focus-within:border-white/40" onSubmit={submit}>
          <input ref={inputRef} className="min-w-0 flex-1 border-0 bg-transparent p-0 text-base text-[#e2e4e5] outline-none placeholder:text-sm placeholder:text-[#e2e4e5]/60" aria-label="Сообщение ассистенту" placeholder="Напишите сообщение…" value={draft} maxLength={1000} onChange={event => setDraft(event.target.value)} autoComplete="off" enterKeyHint="send" disabled={sending} />
          <button className="grid size-9 shrink-0 place-content-center rounded-full bg-[#536879] text-2xl leading-none text-[#e2e4e5] hover:bg-[#657f91] disabled:cursor-not-allowed disabled:opacity-40" type="submit" disabled={!draft.trim() || sending} aria-label="Отправить сообщение">↑</button>
        </form>
      </div>
    </main>
  )
}
