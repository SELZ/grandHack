import crypto from 'node:crypto'
import type { MaxWebAppUser } from './types.js'
import './config.js'

const MAX_API_BASE = 'https://platform-api2.max.ru'

function getBotToken(): string {
  const token = process.env.MAX_BOT_TOKEN
  if (!token) throw new Error('MAX_BOT_TOKEN is not set')
  return token
}

export function validateMaxInitData(
  initData: string,
  botToken: string = getBotToken(),
  maxAgeSeconds = 60 * 60,
): boolean {
  if (!initData || initData.length > 16384) return false

  const pairs = initData.split('&').map((part) => {
    const eqIndex = part.indexOf('=')
    return eqIndex === -1 ? [part, ''] : [part.slice(0, eqIndex), part.slice(eqIndex + 1)]
  })

  const hashEntries = pairs.filter(([key]) => key === 'hash')
  if (new Set(pairs.map(([key]) => key)).size !== pairs.length) return false
  if (pairs.some(([key]) => !/^[a-zA-Z0-9_]+$/.test(key))) return false
  if (hashEntries.length !== 1) return false
  const originalHash = hashEntries[0][1]
  if (!/^[a-fA-F0-9]{64}$/.test(originalHash)) return false

  let decoded: string[][]
  try {
    decoded = pairs.map(([key, value]) => [key, decodeURIComponent(value)])
  } catch {
    return false
  }

  const launchParams = decoded
    .filter(([key]) => key !== 'hash')
    .sort((a, b) => a[0].localeCompare(b[0]))
    .map(([key, value]) => `${key}=${value}`)
    .join('\n')

  const secretKey = crypto.createHmac('sha256', 'WebAppData').update(botToken).digest()
  const computedHash = crypto.createHmac('sha256', secretKey).update(launchParams).digest('hex')

  const a = Buffer.from(computedHash, 'hex')
  const b = Buffer.from(originalHash, 'hex')
  if (a.length !== b.length || a.length === 0) return false
  if (!crypto.timingSafeEqual(a, b)) return false

  const authDateEntry = decoded.find(([key]) => key === 'auth_date')
  const authDate = authDateEntry ? Number(authDateEntry[1]) : NaN
  if (!Number.isSafeInteger(authDate)) return false
  const ageSeconds = Date.now() / 1000 - authDate
  if (ageSeconds < -30 || ageSeconds > maxAgeSeconds) return false

  return true
}

export function parseMaxInitDataUser(initData: string): MaxWebAppUser | null {
  const pairs = initData.split('&').map((part) => {
    const eqIndex = part.indexOf('=')
    return eqIndex === -1 ? [part, ''] : [part.slice(0, eqIndex), part.slice(eqIndex + 1)]
  })
  const userEntry = pairs.find(([key]) => key === 'user')
  if (!userEntry) return null

  try {
    const parsed: unknown = JSON.parse(decodeURIComponent(userEntry[1]))
    if (!parsed || typeof parsed !== 'object') return null
    const obj = parsed as Record<string, unknown>
    if (typeof obj.id !== 'number' || !Number.isSafeInteger(obj.id) || obj.id <= 0) return null
    return {
      id: obj.id,
      first_name: typeof obj.first_name === 'string' ? obj.first_name : '',
      last_name: typeof obj.last_name === 'string' ? obj.last_name : null,
      username: typeof obj.username === 'string' ? obj.username : null,
      language_code: typeof obj.language_code === 'string' ? obj.language_code : null,
      photo_url: typeof obj.photo_url === 'string' ? obj.photo_url : null,
    }
  } catch {
    return null
  }
}

export async function sendMaxMessage(
  maxUserId: number,
  text: string,
  options: { format?: 'markdown' | 'html'; notify?: boolean } = {},
): Promise<{ ok: true } | { ok: false; status: number; error: string }> {
  const token = getBotToken()
  const url = `${MAX_API_BASE}/messages?user_id=${encodeURIComponent(String(maxUserId))}`

  const response = await fetch(url, {
    signal: AbortSignal.timeout(15000),
    method: 'POST',
    headers: {
      Authorization: token,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      text: text.slice(0, 4000),
      format: options.format ?? 'markdown',
      notify: options.notify ?? true,
    }),
  })

  if (!response.ok) {
    const errorText = await response.text().catch(() => response.statusText)
    return { ok: false, status: response.status, error: errorText }
  }

  return { ok: true }
}
