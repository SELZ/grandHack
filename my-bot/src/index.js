import fs from 'node:fs'
import { fileURLToPath } from 'node:url'
import { createGrantBot } from './bot.js'

const envPath = new URL('../../.env', import.meta.url)
if (fs.existsSync(envPath)) process.loadEnvFile(fileURLToPath(envPath))

const apiBase = process.env.API_BASE_URL ?? 'http://127.0.0.1:4000'
const bot = createGrantBot({
  token: process.env.MAX_BOT_TOKEN, username: process.env.MAX_BOT_USERNAME,
  apiBase, internalKey: process.env.INTERNAL_API_KEY,
})
const health = await fetch(new URL('/api/health', apiBase), { signal: AbortSignal.timeout(10000) })
if (!health.ok) throw new Error('Start the backend before the bot')
process.once('SIGINT', () => bot.stopPolling())
process.once('SIGTERM', () => bot.stopPolling())
await bot.start().catch(() => {
  console.error('[bot] MAX connection failed. Check token, network, and trusted certificates.')
  process.exitCode = 1
})
