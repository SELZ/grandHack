import { Bot, Keyboard } from '@maxhub/max-bot-api'

export function createGrantBot({ token, username, apiBase, internalKey, fetchImpl = fetch }) {
  if (!token || !username || !internalKey) throw new Error('Configure MAX_BOT_TOKEN, MAX_BOT_USERNAME and INTERNAL_API_KEY')
  const backend = new URL(apiBase)
  if (backend.protocol !== 'https:' && !(backend.protocol === 'http:' && ['127.0.0.1', 'localhost', '[::1]'].includes(backend.hostname))) {
    throw new Error('The backend must use HTTPS, except on localhost')
  }
  const bot = new Bot(token, { clientOptions: { baseUrl: 'https://platform-api2.max.ru' } })
  const keyboard = Keyboard.inlineKeyboard([[Keyboard.button.openApp('Открыть ГрантХаб', username)]])
  const open = ctx => ctx.reply('Открывайте приложение: каталог грантов, профиль бизнеса и избранное.', { attachments: [keyboard] })

  async function register(ctx, started = true) {
    const user = ctx.update.user ?? ctx.update.message?.sender
    const maxUserId = user?.user_id
    if (!Number.isSafeInteger(maxUserId) || maxUserId <= 0) throw new Error('Missing MAX user')
    const response = await fetchImpl(new URL('/api/internal/bot/start', backend), {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', 'x-internal-key': internalKey },
      body: JSON.stringify({ maxUserId, firstName: user.first_name ?? '', username: user.username ?? '', started }),
      signal: AbortSignal.timeout(10000),
    })
    if (!response.ok) throw new Error('Backend registration failed')
  }

  const start = async ctx => { await register(ctx); return open(ctx) }
  bot.on('bot_started', start)
  bot.command('start', start)
  bot.command('app', start)
  bot.command('help', ctx => ctx.reply('/start — открыть приложение\n/app — каталог, профиль и избранное\nНапоминания используют избранное из приложения.', { attachments: [keyboard] }))
  bot.on('bot_stopped', ctx => register(ctx, false))
  bot.on('message_created', ctx => ctx.reply('Откройте приложение кнопкой ниже или напишите /help.', { attachments: [keyboard] }))
  bot.catch(async (_error, ctx) => {
    console.error('[bot] Request failed; check API availability and server configuration.')
    try { await ctx.reply('Сервис временно недоступен. Попробуйте ещё раз позже.') } catch { /* No secret-bearing SDK error output. */ }
  })
  return bot
}
