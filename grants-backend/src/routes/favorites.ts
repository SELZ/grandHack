import { Router } from 'express'
import { db } from '../db.js'
import { requireAuth } from '../middleware/auth.js'
import type { GrantRow } from '../types.js'

export const favoritesRouter = Router()
favoritesRouter.use(requireAuth)

favoritesRouter.get('/', (req, res) => {
  const rows = db
    .prepare(
      `SELECT grants.* FROM favorites
       JOIN grants ON grants.id = favorites.grant_id
       WHERE favorites.user_id = ?
       ORDER BY favorites.created_at DESC`,
    )
    .all(req.user!.userId) as GrantRow[]

  res.json({ grantIds: rows.map((r) => r.id) })
})

favoritesRouter.post('/:grantId', (req, res) => {
  const grant = db.prepare('SELECT id FROM grants WHERE id = ?').get(req.params.grantId)
  if (!grant) {
    res.status(404).json({ error: 'Grant not found' })
    return
  }

  db.prepare(
    'INSERT OR IGNORE INTO favorites (user_id, grant_id) VALUES (?, ?)',
  ).run(req.user!.userId, req.params.grantId)

  res.status(201).json({ ok: true })
})

favoritesRouter.delete('/:grantId', (req, res) => {
  db.prepare('DELETE FROM favorites WHERE user_id = ? AND grant_id = ?').run(
    req.user!.userId,
    req.params.grantId,
  )
  res.json({ ok: true })
})
