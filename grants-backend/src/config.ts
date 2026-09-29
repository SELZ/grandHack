import dotenv from 'dotenv'
import { fileURLToPath } from 'node:url'
import path from 'node:path'

// Same server-only environment for the API and bot, independent of the cwd.
dotenv.config({ path: fileURLToPath(new URL('../../.env', import.meta.url)) })
const backendRoot = fileURLToPath(new URL('../', import.meta.url))

export const config = {
  production: process.env.NODE_ENV === 'production',
  host: process.env.HOST ?? '127.0.0.1',
  port: Number(process.env.PORT ?? 4000),
  devAuth: process.env.ALLOW_DEV_AUTH === 'true',
  notifications: process.env.NOTIFICATIONS_ENABLED === 'true',
  dbPath: process.env.DB_PATH === ':memory:' ? ':memory:' : path.resolve(backendRoot, process.env.DB_PATH ?? 'data/grants.db'),
  frontendDist: path.resolve(backendRoot, process.env.FRONTEND_DIST ?? '../grants/dist'),
  botUsername: process.env.MAX_BOT_USERNAME ?? 't511_hakaton_max_bot',
  allowedOrigins: (process.env.ALLOWED_ORIGINS ?? 'http://localhost:5173,http://127.0.0.1:5173,http://localhost:4000,http://127.0.0.1:4000').split(',').map(s => s.trim()),
}

export function validateConfig() {
  for (const key of ['JWT_SECRET', 'INTERNAL_API_KEY']) {
    if ((process.env[key]?.length ?? 0) < 32) throw new Error(`${key} must contain at least 32 characters`)
  }
  if (!Number.isInteger(config.port) || config.port < 0 || config.port > 65535) throw new Error('Invalid PORT')
  if (config.devAuth && (config.production || !['127.0.0.1', '::1', 'localhost'].includes(config.host))) {
    throw new Error('Development auth is allowed only in non-production on a loopback HOST')
  }
  if ((config.production || config.notifications) && !process.env.MAX_BOT_TOKEN) throw new Error('MAX_BOT_TOKEN is required')
}
