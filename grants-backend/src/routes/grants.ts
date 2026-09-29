import { Router } from 'express'
import { db } from '../db.js'
import type { Grant, GrantRow } from '../types.js'

export const grantsRouter = Router()

function rowToGrant(row: GrantRow): Grant {
  return {
    id: row.id,
    title: row.title,
    org: row.org,
    amount: row.amount,
    amountText: row.amountText,
    deadlineISO: row.deadlineISO,
    deadlineText: row.deadlineText,
    industries: JSON.parse(row.industries),
    regions: JSON.parse(row.regions),
    stages: JSON.parse(row.stages),
    summary: row.summary,
    requirements: JSON.parse(row.requirements),
    notes: JSON.parse(row.notes),
    sphere: row.sphere,
    url: row.url,
    isNew: row.isNew === 1,
  }
}

/**
 * GET /api/grants?industry=&region=&stage=&q=
 * All filters are optional and combine with AND; `q` does a simple substring
 * search over title/org/summary. No auth required — this mirrors the public
 * catalog the React app already renders from a static JSON file.
 */
grantsRouter.get('/', (req, res) => {
  const { industry, region, stage, q } = req.query

  let rows = db.prepare('SELECT * FROM grants').all() as GrantRow[]
  let grants = rows.map(rowToGrant)

  if (typeof industry === 'string' && industry) {
    grants = grants.filter((g) => g.industries.includes(industry) || g.industries.includes('any'))
  }
  if (typeof region === 'string' && region) {
    grants = grants.filter((g) => g.regions.includes(region) || g.regions.includes('all'))
  }
  if (typeof stage === 'string' && stage) {
    grants = grants.filter((g) => g.stages.includes(stage))
  }
  if (typeof q === 'string' && q.trim()) {
    const needle = q.trim().toLowerCase()
    grants = grants.filter(
      (g) =>
        g.title.toLowerCase().includes(needle) ||
        g.org.toLowerCase().includes(needle) ||
        g.summary.toLowerCase().includes(needle),
    )
  }

  res.json({ grants })
})

grantsRouter.get('/:id', (req, res) => {
  const row = db.prepare('SELECT * FROM grants WHERE id = ?').get(req.params.id) as GrantRow | undefined
  if (!row) {
    res.status(404).json({ error: 'Grant not found' })
    return
  }
  res.json({ grant: rowToGrant(row) })
})
