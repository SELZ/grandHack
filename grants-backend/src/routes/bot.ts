import { Router } from 'express'
import { db } from '../db.js'
import { requireInternalKey } from '../middleware/auth.js'

export const botRouter = Router()
botRouter.use(requireInternalKey)
botRouter.post('/start', (req, res) => {
  const { maxUserId, firstName = '', username = '', started = true } = req.body ?? {}
  if (!Number.isSafeInteger(maxUserId) || maxUserId <= 0 || typeof started !== 'boolean' || typeof firstName !== 'string' || typeof username !== 'string') {
    res.status(400).json({ error: 'Invalid bot user' })
    return
  }
  db.prepare(`INSERT INTO users (max_user_id, first_name, username, bot_started)
    VALUES (?, ?, ?, ?) ON CONFLICT(max_user_id) DO UPDATE SET bot_started = excluded.bot_started`).run(maxUserId, firstName.slice(0, 200), username.slice(0, 200), started ? 1 : 0)
  res.json({ ok: true })
})
