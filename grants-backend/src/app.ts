import express from 'express'
import cors from 'cors'
import fs from 'node:fs'
import path from 'node:path'
import { config, validateConfig } from './config.js'
import { db } from './db.js'
import { seedGrants } from './seed.js'
import { authRouter } from './routes/auth.js'
import { favoritesRouter } from './routes/favorites.js'
import { grantsRouter } from './routes/grants.js'
import { profileRouter } from './routes/profile.js'
import { botRouter } from './routes/bot.js'
import { requireAuth, requireInternalKey } from './middleware/auth.js'
import { checkExpiringGrantsAndNotify } from './services/notifications.js'
import { answerGrantQuestion } from './services/assistant.js'

export function createApp() {
  validateConfig()
  seedGrants(true)
  const app = express()
  app.disable('x-powered-by')
  app.use((req, res, next) => {
    if (config.devAuth && !['127.0.0.1', 'localhost', '[::1]', '::1'].includes(req.hostname)) {
      res.status(403).json({ error: 'Development server requires a localhost Host header' })
      return
    }
    next()
  })
  app.use(cors({ origin: (origin, callback) => callback(null, !origin || config.allowedOrigins.includes(origin)) }))
  app.use(express.json({ limit: '32kb' }))
  app.use('/api', (_req, res, next) => { res.setHeader('Cache-Control', 'no-store'); next() })
  const attempts = new Map<string, { count: number; until: number }>()
  app.use('/api/auth', (req, res, next) => {
    const now = Date.now()
    for (const [key, value] of attempts) if (value.until < now) attempts.delete(key)
    const key = req.ip ?? 'unknown'
    const entry = attempts.get(key) ?? { count: 0, until: now + 60000 }
    entry.count++
    attempts.set(key, entry)
    if (entry.count > 60) { res.status(429).json({ error: 'Too many authentication attempts' }); return }
    next()
  })
  app.get('/api/health', (_req, res) => {
    db.prepare('SELECT 1').get()
    res.json({ ok: true })
  })
  app.get('/api/config', (_req, res) => res.json({ devAuthEnabled: config.devAuth && !config.production, botUsername: config.botUsername }))
  app.use('/api/auth', authRouter)
  app.use('/api/grants', grantsRouter)
  app.use('/api/favorites', favoritesRouter)
  app.use('/api/profile', profileRouter)
  app.post('/api/assistant', requireAuth, (req, res) => {
    const message = typeof req.body?.message === 'string' ? req.body.message.trim() : ''
    if (!message || message.length > 1000) {
      res.status(400).json({ error: 'Message must contain between 1 and 1000 characters' })
      return
    }
    res.json(answerGrantQuestion(message, req.user!.userId))
  })
  app.use('/api/internal/bot', botRouter)
  app.post('/api/internal/notify-check', requireInternalKey, async (_req, res, next) => {
    if (!config.notifications) { res.status(403).json({ error: 'Notifications disabled' }); return }
    try { res.json(await checkExpiringGrantsAndNotify()) } catch (error) { next(error) }
  })
  app.use('/api', (_req, res) => res.status(404).json({ error: 'API endpoint not found' }))
  if (fs.existsSync(path.join(config.frontendDist, 'index.html'))) {
    app.use(express.static(config.frontendDist))
    app.get('*', (_req, res) => res.sendFile(path.join(config.frontendDist, 'index.html')))
  }
  app.use((error: { status?: number }, _req: express.Request, res: express.Response, _next: express.NextFunction) => {
    const status = error.status && error.status >= 400 && error.status < 500 ? error.status : 500
    res.status(status).json({ error: status === 500 ? 'Internal server error' : 'Invalid request' })
  })
  return app
}
