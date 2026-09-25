import { useEffect, useLayoutEffect, useRef, useState, type FormEvent } from 'react'
import { gsap } from 'gsap'
import { categories, grants, type Grant } from '@/entities/grant'
import { filterGrants } from '@/features/filter-grants'
import assistantAvatar from '@/shared/assets/chat/assistant-avatar.svg'

type ChatMessage = {
  id: string
  role: 'user' | 'assistant'
  text: string
  createdAt: string
  grantIds?: string[]
}

type ChatScreenProps = {
  categoryId?: string
  stage?: string
  onOpenGrant?: (grant: Grant) => void
}

const conversationKey = 'grants-assistant-conversation-v1'
const draftKey = 'grants-assistant-draft-v1'
const prompts = ['Подбери мне гранты', 'Какие документы нужны?', 'Что такое софинансирование?']
const welcomeText = 'Здравствуйте! Я грант-ассистент 🤖\n\nСейчас доступен деморежим: помогу найти программы в каталоге и посмотреть сохранённые условия участия.\n\nЗаполните сферу и стадию бизнеса в профиле — учту их при поиске. Актуальные требования уточняйте у организатора.'
const timeFormatter = new Intl.DateTimeFormat('ru-RU', { hour: '2-digit', minute: '2-digit' })
const messageClassName = 'w-fit max-w-[90%] rounded-2xl border border-white/15 px-3 py-2.5 text-[15px] leading-relaxed [overflow-wrap:anywhere] sm:px-4 sm:py-3 lg:max-w-[75%] lg:text-base'
const dateClassName = 'mb-4 text-center text-xs leading-4 text-[#e2e4e5]/65'
const timeClassName = 'mt-2 block text-right text-xs leading-4 text-[#e2e4e5]/65'
const grantClassName = 'my-3 flex w-full cursor-pointer flex-col gap-1.5 rounded-xl border border-white/15 bg-black/15 p-3 text-left text-inherit no-underline transition-colors hover:bg-white/10 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-white/20 motion-reduce:transition-none'

function readDraft(): string {
  try {
    return localStorage.getItem(draftKey)?.slice(0, 1000) ?? ''
  } catch {
    return ''
  }
}

function readConversation(): ChatMessage[] {
  try {
    const saved: unknown = JSON.parse(localStorage.getItem(conversationKey) ?? '[]')
    if (!Array.isArray(saved)) return []
    return saved.filter((message): message is ChatMessage => (
      message !== null && typeof message === 'object'
      && typeof message.id === 'string'
      && (message.role === 'user' || message.role === 'assistant')
      && typeof message.text === 'string'
      && typeof message.createdAt === 'string'
      && Number.isFinite(Date.parse(message.createdAt))
      && (message.grantIds === undefined || (
        Array.isArray(message.grantIds) && message.grantIds.every((id: unknown) => typeof id === 'string')
      ))
    )).slice(-60)
  } catch {
    return []
  }
}

function normalize(value: string): string {
  return value.toLocaleLowerCase('ru-RU').replaceAll('ё', 'е')
}

function findCategory(query: string): string | undefined {
  const aliases: [string, RegExp][] = [
    ['it', /(?:^|[^\p{L}\p{N}])(?:it|ит)(?=$|[^\p{L}\p{N}])|технолог|программир|цифров|инновац/u],
    ['trade', /торгов|экспорт|магазин/],
    ['production', /производ|завод/],
    ['agriculture', /сельск|ферм|агро/],
    ['food', /общепит|ресторан|кафе|пекарн/],
    ['services', /услуг|туризм|турист/],
    ['education', /образован|обучен|школ/],
    ['medicine', /медицин|клиник|здоров/],
    ['construction', /строител/],
    ['creative', /креатив|культур|искусств|дизайн/],
  ]
  return aliases.find(([, pattern]) => pattern.test(query))?.[0]
}

function getReply(text: string, categoryId: string, stage: string): Pick<ChatMessage, 'text' | 'grantIds'> {
  const query = normalize(text)
  const category = findCategory(query) ?? categoryId
  const available = filterGrants(grants, { query: '', categoryId: category, stage })
  const selectedCategory = categories.find((item) => item.id === category)
  const ranked = [...available].sort((first, second) => {
    const matches = (grant: Grant) => selectedCategory?.industries.some((industry) => grant.industries.includes(industry)) ? 1 : 0
    return matches(second) - matches(first)
  })

  if (query.includes('софинанс')) {
    const examples = ranked.filter((grant) => grant.requirements.some((requirement) => /софинанс/i.test(requirement))).slice(0, 2)
    return {
      text: examples.length
        ? `В локальном каталоге есть такие условия софинансирования:\n\n${examples.map((grant) => `${grant.title}\n${grant.requirements.find((requirement) => /софинанс/i.test(requirement))}`).join('\n\n')}\n\nПолные условия и актуальность программы проверьте на сайте организатора.`
        : 'В программах по вашему профилю нет отдельного описания софинансирования. Откройте интересующую программу и уточните условия на сайте организатора.',
      grantIds: examples.map((grant) => grant.id),
    }
  }

  if (/документ|требован|услови/.test(query)) {
    return {
      text: 'Перечень документов зависит от программы. В локальном каталоге сохранены требования к участникам; полный список документов нужно проверить у организатора. Выберите грант ниже, чтобы посмотреть его условия и официальный сайт.',
      grantIds: ranked.slice(0, 3).map((grant) => grant.id),
    }
  }

  if (/^(?:привет|здравствуй|добрый день|спасибо)/.test(query)) {
    return { text: 'Помогу найти программы в локальном каталоге. Напишите отрасль, например «IT», «производство» или «сельское хозяйство», либо выберите вопрос ниже. Это деморежим: ответы формируются по данным каталога, без подключения к ИИ.' }
  }

  const isSelection = /подбер|подбор|подобра|покаж|найди|найти|грант|программ/.test(query)
  const requestedCategory = findCategory(query)
  const stopWords = new Set(['подбери', 'подберите', 'подобрать', 'покажи', 'покажите', 'найди', 'найти', 'есть', 'какие', 'какой', 'хочу', 'нужен', 'нужны', 'мне', 'меня', 'для', 'грант', 'гранты', 'грантов', 'программа', 'программы', 'программ', 'бизнес', 'бизнеса', 'пожалуйста'])
  const searchWords = (query.match(/[\p{L}\p{N}]+/gu) ?? []).filter((word) => word.length > 2 && !stopWords.has(word))
  const searchQuery = searchWords.map((word) => word.replace(/(?:ами|ями|ого|ему|ыми|ими|ия|ие|ий|ая|ое|ые|ов|ах|ях|ам|ям|ом|ем|а|я|ы|и|у|ю|е|о)$/, '')).join(' ')
  const matches = requestedCategory || (isSelection && searchWords.length === 0)
    ? ranked
    : filterGrants(ranked, { query: searchQuery, categoryId: category, stage })

  if (!matches.length || (!isSelection && !requestedCategory && !searchQuery)) {
    return { text: 'В локальном каталоге совпадений не нашлось. Попробуйте указать отрасль или название программы. Например: «IT», «туризм», «оборудование». Можно также обновить сферу и стадию бизнеса в профиле.' }
  }

  return {
    text: `${selectedCategory && category !== 'all' ? `Нашёл программы по направлению «${selectedCategory.label}»` : 'Вот несколько программ из локального каталога'}. Откройте карточку, чтобы проверить требования к участникам. Актуальные сроки и условия уточняйте у организатора.`,
    grantIds: matches.slice(0, 3).map((grant) => grant.id),
  }
}

export function ChatScreen({ categoryId = 'all', stage = '', onOpenGrant }: ChatScreenProps) {
  const [messages, setMessages] = useState<ChatMessage[]>(readConversation)
  const [draft, setDraft] = useState(readDraft)
  const [welcomeDate] = useState(() => new Date(messages[0]?.createdAt ?? Date.now()))
  const conversationRef = useRef<HTMLDivElement>(null)
  const inputRef = useRef<HTMLInputElement>(null)
  const animatedMessageIds = useRef(new Set(messages.map((message) => message.id)))

  useLayoutEffect(() => {
    const conversation = conversationRef.current
    if (!conversation) return
    const incomingMessages = Array.from(conversation.querySelectorAll<HTMLElement>('[data-chat-message-id]'))
      .filter((element) => !animatedMessageIds.current.has(element.dataset.chatMessageId ?? ''))
    animatedMessageIds.current = new Set(messages.map((message) => message.id))
    if (!incomingMessages.length || window.matchMedia('(prefers-reduced-motion: reduce)').matches) return

    const context = gsap.context(() => {
      gsap.fromTo(incomingMessages, { opacity: 0, y: 8 }, {
        opacity: 1,
        y: 0,
        duration: 0.25,
        ease: 'power2.out',
        clearProps: 'opacity,transform',
      })
    }, conversation)
    return () => context.revert()
  }, [messages])

  useEffect(() => {
    try {
      localStorage.setItem(conversationKey, JSON.stringify(messages))
    } catch {
      // The conversation remains usable if storage is unavailable.
    }
    const conversation = conversationRef.current
    if (conversation) conversation.scrollTop = conversation.scrollHeight
  }, [messages])

  useEffect(() => {
    try {
      localStorage.setItem(draftKey, draft)
    } catch {
      // Drafts remain available in memory when browser storage is unavailable.
    }
  }, [draft])

  function sendMessage(value: string) {
    const text = value.trim().slice(0, 1000)
    if (!text) return
    const createdAt = new Date().toISOString()
    const id = globalThis.crypto?.randomUUID?.() ?? `${createdAt}-${messages.length}`
    const reply = getReply(text, categoryId, stage)
    setMessages((current) => [...current, { id, role: 'user' as const, text, createdAt }, {
      id: `${id}-reply`, role: 'assistant' as const, createdAt, ...reply,
    }].slice(-60))
  }

  function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault()
    sendMessage(draft)
    setDraft('')
    inputRef.current?.focus()
  }

  return (
    <main className="grant-chat mx-auto flex h-[calc(100dvh-73px-env(safe-area-inset-bottom,0px))] min-h-0 w-full max-w-4xl shrink-0 flex-col overflow-hidden text-[#e2e4e5] lg:h-[calc(100dvh-64px)]" aria-labelledby="grant-chat-title">
      <header className="grant-chat__header flex shrink-0 items-center gap-3 px-4 py-4 sm:px-6 lg:py-5">
        <img src={assistantAvatar} alt="" className="grant-chat__avatar block shrink-0" />
        <div className="min-w-0">
          <h1 id="grant-chat-title" className="text-lg leading-6 font-semibold">Грант-ассистент</h1>
          <p className="mt-0.5 text-xs leading-4 text-[#e2e4e5]/65">Демо · поиск по каталогу</p>
        </div>
      </header>

      <div className="grant-chat__conversation min-h-0 flex-1 overflow-y-auto overscroll-y-contain px-4 pt-2 pb-4 [scrollbar-color:#536879_transparent] [scrollbar-width:thin] sm:px-6" ref={conversationRef} role="log" aria-label="Переписка с грант-ассистентом" aria-live="polite" aria-relevant="additions">
        <p className={`grant-chat__date ${dateClassName}`}>{welcomeDate.toDateString() === new Date().toDateString() ? 'Сегодня' : welcomeDate.toLocaleDateString('ru-RU', { day: 'numeric', month: 'long' })}</p>
        <article className={`grant-chat__message grant-chat__message--welcome ${messageClassName} rounded-bl-none bg-[#d9d9d9]/20`} aria-label="Приветствие ассистента">
          <p className="whitespace-pre-wrap">{welcomeText}</p>
          <span className={`grant-chat__time ${timeClassName}`}>{timeFormatter.format(welcomeDate)}</span>
        </article>
        {messages.map((message, index) => {
          const messageDate = new Date(message.createdAt)
          const previousDate = index > 0 ? new Date(messages[index - 1].createdAt) : null
          const showDate = previousDate && previousDate.toDateString() !== messageDate.toDateString()
          const isToday = messageDate.toDateString() === new Date().toDateString()
          return (
            <div key={message.id} className="grant-chat__entry mt-4">
              {showDate && <p className={`grant-chat__date ${dateClassName}`}>{isToday ? 'Сегодня' : messageDate.toLocaleDateString('ru-RU', { day: 'numeric', month: 'long' })}</p>}
              <article data-chat-message-id={message.id} className={`grant-chat__message grant-chat__message--${message.role} ${messageClassName} ${message.role === 'user' ? 'ml-auto rounded-br-none bg-[#536879]/70' : 'rounded-bl-none bg-[#d9d9d9]/20'}`} aria-label={message.role === 'user' ? 'Ваше сообщение' : 'Ответ ассистента'}>
                <p className="whitespace-pre-wrap">{message.text}</p>
                {message.grantIds?.map((id) => {
                  const grant = grants.find((item) => item.id === id)
                  if (!grant) return null
                  return onOpenGrant ? (
                    <button className={`grant-chat__grant ${grantClassName}`} key={id} type="button" onClick={() => onOpenGrant(grant)}>
                      <span>{grant.title}</span>
                      <small className="text-xs leading-4 text-[#e2e4e5]/75">{grant.amountText}</small>
                      <span className="grant-chat__grant-action text-xs leading-4 text-[#e2e4e5]/75 underline underline-offset-2">Посмотреть условия →</span>
                    </button>
                  ) : (
                    <a className={`grant-chat__grant ${grantClassName}`} key={id} href={grant.url} target="_blank" rel="noreferrer">
                      <span>{grant.title}</span>
                      <small className="text-xs leading-4 text-[#e2e4e5]/75">{grant.amountText}</small>
                      <span className="grant-chat__grant-action text-xs leading-4 text-[#e2e4e5]/75 underline underline-offset-2">Сайт организатора ↗</span>
                    </a>
                  )
                })}
                <time className={`grant-chat__time ${timeClassName}`} dateTime={message.createdAt}>{timeFormatter.format(messageDate)}</time>
              </article>
            </div>
          )
        })}
      </div>

      <div className="grant-chat__controls shrink-0 px-4 pt-2 pb-2 sm:px-6 lg:pb-4">
        <div className="grant-chat__prompts flex items-center gap-2 overflow-x-auto py-1 [scrollbar-width:none] [&::-webkit-scrollbar]:hidden" aria-label="Варианты вопросов">
          {prompts.map((prompt) => <button className="inline-flex min-h-9 shrink-0 cursor-pointer items-center justify-center rounded-full border border-white/15 bg-[#536879]/50 px-3.5 text-xs whitespace-nowrap transition-colors hover:border-white/25 hover:bg-[#536879]/75 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-white/20 motion-reduce:transition-none sm:text-[13px]" data-ui-motion type="button" key={prompt} onClick={() => sendMessage(prompt)}>{prompt}</button>)}
        </div>
        <form className="grant-chat__composer mt-2 flex min-h-12 items-center gap-3 rounded-3xl border border-white/20 bg-[#d9d9d9]/10 py-1.5 pr-1.5 pl-4 transition-colors focus-within:border-white/40 focus-within:ring-2 focus-within:ring-white/10 focus-within:ring-offset-0 motion-reduce:transition-none" onSubmit={submit}>
          <input className="min-w-0 flex-1 border-0 bg-transparent p-0 text-base text-[#e2e4e5] ring-0 outline-none placeholder:text-sm placeholder:text-[#e2e4e5]/60 focus:ring-0 focus:outline-none focus-visible:ring-0 focus-visible:outline-none" ref={inputRef} aria-label="Сообщение ассистенту" placeholder="Напишите сообщение…" value={draft} maxLength={1000} onChange={(event) => setDraft(event.target.value)} autoComplete="off" enterKeyHint="send" />
          <button className="grid size-9 shrink-0 cursor-pointer place-content-center rounded-full bg-[#536879] text-2xl leading-none text-[#e2e4e5] transition-colors hover:bg-[#657f91] focus-visible:bg-[#70899b] focus-visible:outline-none disabled:cursor-default disabled:opacity-40 motion-reduce:transition-none" data-ui-motion type="submit" disabled={!draft.trim()} aria-label="Отправить сообщение">↑</button>
        </form>
      </div>
    </main>
  )
}
