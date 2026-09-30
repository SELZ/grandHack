import { Router } from 'express'
import { randomInt } from 'node:crypto'
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

authRouter.post('/web', (req, res) => {
  const webId = typeof req.body?.id === 'string' ? req.body.id : ''
  if (!/^[0-9a-f]{8}-[0-9a-f]{4}-4[0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i.test(webId)) {
    res.status(400).json({ error: 'Invalid browser session id' })
    return
  }

  const createOrGetWebUser = db.transaction((id: string) => {
    const existing = db.prepare(`
      SELECT users.* FROM users JOIN web_users ON web_users.user_id = users.id WHERE web_users.web_id = ?
    `).get(id) as User | undefined
    if (existing) return existing

    let maxUserId = 0
    do { maxUserId = -randomInt(1, 2 ** 48) }
    while (db.prepare('SELECT 1 FROM users WHERE max_user_id = ?').get(maxUserId))

    const inserted = db.prepare("INSERT INTO users (max_user_id, first_name) VALUES (?, 'Веб-пользователь')").run(maxUserId)
    db.prepare('INSERT INTO web_users (web_id, user_id) VALUES (?, ?)').run(id, inserted.lastInsertRowid)
    return db.prepare('SELECT * FROM users WHERE id = ?').get(inserted.lastInsertRowid) as User
  })
  const user = createOrGetWebUser.immediate(webId)
  const token = signSessionToken({ userId: user.id, maxUserId: user.max_user_id })
  res.json({ token, user: { id: user.id, maxUserId: user.max_user_id, firstName: user.first_name } })
})

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
