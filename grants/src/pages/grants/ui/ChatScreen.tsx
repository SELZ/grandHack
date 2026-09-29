import { useState } from 'react'
import assistantAvatar from '@/shared/assets/chat/assistant-avatar.svg'

const draftKey = 'grants-assistant-draft-v1'
const prompts = ['Подбери мне гранты', 'Какие документы нужны?', 'Что такое софинансирование?']

function readDraft(): string {
  try {
    return localStorage.getItem(draftKey)?.slice(0, 1000) ?? ''
  } catch {
    return ''
  }
}

export function ChatScreen() {
  // Preserve existing drafts and conversation storage while the assistant is unavailable.
  const [draft] = useState(readDraft)

  return (
    <main className="grant-chat mx-auto flex h-[calc(100dvh-73px-env(safe-area-inset-bottom,0px))] min-h-0 w-full max-w-4xl shrink-0 flex-col overflow-hidden text-[#e2e4e5] lg:h-[calc(100dvh-64px)]" aria-labelledby="grant-chat-title">
      <header className="grant-chat__header flex shrink-0 items-center gap-3 px-4 py-4 sm:px-6 lg:py-5">
        <img src={assistantAvatar} alt="" className="grant-chat__avatar block shrink-0" />
        <div className="min-w-0">
          <h1 id="grant-chat-title" className="text-lg leading-6 font-semibold">Грант-ассистент</h1>
          <p className="mt-0.5 text-xs leading-4 text-[#e2e4e5]/65">Временно недоступен</p>
        </div>
      </header>

      <div className="grant-chat__conversation min-h-0 flex-1 overflow-y-auto overscroll-y-contain px-4 pt-2 pb-4 [scrollbar-color:#536879_transparent] [scrollbar-width:thin] sm:px-6" aria-label="Статус чата">
        <div id="grant-chat-status" role="status" className="w-fit max-w-[90%] rounded-2xl rounded-bl-none border border-white/15 bg-[#d9d9d9]/20 px-3 py-2.5 text-[15px] leading-relaxed [overflow-wrap:anywhere] sm:px-4 sm:py-3 lg:max-w-[75%] lg:text-base">
          <p>Помощник пока отключён. Сообщения не отправляются.</p>
          <p className="mt-3">Поиск грантов доступен в каталоге, а подбор под ваш бизнес — через профиль.</p>
        </div>
      </div>

      <div className="grant-chat__controls shrink-0 px-4 pt-2 pb-2 sm:px-6 lg:pb-4">
        <div className="grant-chat__prompts flex items-center gap-2 overflow-x-auto py-1 [scrollbar-width:none] [&::-webkit-scrollbar]:hidden" aria-label="Варианты вопросов">
          {prompts.map((prompt) => <button className="inline-flex min-h-9 shrink-0 items-center justify-center rounded-full border border-white/15 bg-[#536879]/50 px-3.5 text-xs whitespace-nowrap disabled:cursor-not-allowed disabled:opacity-40 sm:text-[13px]" type="button" key={prompt} disabled aria-describedby="grant-chat-status">{prompt}</button>)}
        </div>
        <form className="grant-chat__composer mt-2 flex min-h-12 items-center gap-3 rounded-3xl border border-white/20 bg-[#d9d9d9]/10 py-1.5 pr-1.5 pl-4" onSubmit={(event) => event.preventDefault()} aria-describedby="grant-chat-status">
          <input className="min-w-0 flex-1 border-0 bg-transparent p-0 text-base text-[#e2e4e5] ring-0 outline-none placeholder:text-sm placeholder:text-[#e2e4e5]/60 disabled:cursor-not-allowed disabled:opacity-50" aria-label="Сообщение ассистенту" aria-describedby="grant-chat-status" placeholder="Помощник временно отключён" value={draft} disabled />
          <button className="grid size-9 shrink-0 place-content-center rounded-full bg-[#536879] text-2xl leading-none text-[#e2e4e5] disabled:cursor-not-allowed disabled:opacity-40" type="submit" disabled aria-label="Отправить сообщение" aria-describedby="grant-chat-status">↑</button>
        </form>
      </div>
    </main>
  )
}
