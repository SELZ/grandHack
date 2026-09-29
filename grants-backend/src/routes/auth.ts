import { Router } from 'express'
import { db } from '../db.js'
import { parseMaxInitDataUser, validateMaxInitData } from '../max.js'
import { signSessionToken } from '../middleware/auth.js'
import type { User } from '../types.js'
import { config } from '../config.js'

export const authRouter = Router()

authRouter.post('/dev', (req, res) => {
  if (!config.devAuth || config.production || !['127.0.0.1', '::1', '::ffff:127.0.0.1'].includes(req.ip ?? '')) {
    res.status(403).json({ error: 'Local development auth is disabled' })
    return
  }
  db.prepare("INSERT OR IGNORE INTO users (max_user_id, first_name) VALUES (-1, 'Локальный тест')").run()
  const user = db.prepare('SELECT * FROM users WHERE max_user_id = -1').get() as User
  res.json({ token: signSessionToken({ userId: user.id, maxUserId: -1 }), user: { id: user.id, maxUserId: -1, firstName: user.first_name } })
})

/**
 * Body: { initData: string } — the raw value of `window.WebApp.initData` from the
 * MAX Mini App SDK. We validate its signature against MAX_BOT_TOKEN, upsert the
 * user, and hand back our own short-lived-ish session JWT for subsequent calls.
 */
authRouter.post('/max', (req, res) => {
  if (!process.env.MAX_BOT_TOKEN) {
    res.status(503).json({ error: 'MAX authentication is not configured' })
    return
  }
  const initData = typeof req.body?.initData === 'string' ? req.body.initData : ''

  if (!validateMaxInitData(initData)) {
    res.status(401).json({ error: 'Invalid MAX initData' })
    return
  }

  const maxUser = parseMaxInitDataUser(initData)
  if (!maxUser) {
    res.status(400).json({ error: 'initData did not contain a user' })
    return
  }

  const upsert = db.prepare(`
    INSERT INTO users (max_user_id, username, first_name, last_name)
    VALUES (@max_user_id, @username, @first_name, @last_name)
    ON CONFLICT(max_user_id) DO UPDATE SET
      username = excluded.username,
      first_name = excluded.first_name,
      last_name = excluded.last_name
  `)
  upsert.run({
    max_user_id: maxUser.id,
    username: maxUser.username ?? null,
    first_name: maxUser.first_name ?? null,
    last_name: maxUser.last_name ?? null,
  })

  const user = db
    .prepare('SELECT * FROM users WHERE max_user_id = ?')
    .get(maxUser.id) as User

  const token = signSessionToken({ userId: user.id, maxUserId: user.max_user_id })
  res.json({ token, user: { id: user.id, maxUserId: user.max_user_id, firstName: user.first_name, username: user.username } })
})
