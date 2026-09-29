import { Router } from 'express'
import { db } from '../db.js'
import { requireAuth } from '../middleware/auth.js'
import type { BusinessProfile } from '../types.js'

export const profileRouter = Router()
profileRouter.use(requireAuth)
const empty = { name: '', categoryId: '', stage: '', employees: '', annualRevenue: '', legalForm: '' }
const categories = ['', 'all', 'it', 'trade', 'production', 'agriculture', 'food', 'services', 'education', 'medicine', 'construction', 'creative']
const stages = ['', 'idea', 'start', 'growth', 'scale']
const legalForms = ['', 'not-registered', 'self-employed', 'individual', 'company', 'nonprofit', 'other']

function profileFor(userId: number) {
  const row = db.prepare('SELECT * FROM business_profiles WHERE user_id = ?').get(userId) as BusinessProfile | undefined
  return row ? { name: row.name, categoryId: row.category_id, stage: row.stage, employees: row.employees, annualRevenue: row.annual_revenue, legalForm: row.legal_form } : { ...empty }
}

profileRouter.get('/', (req, res) => res.json({ profile: profileFor(req.user!.userId) }))
profileRouter.put('/', (req, res) => {
  const body = req.body
  const numeric = (value: string, integer = false) => value === '' || (/^\d+(?:\.\d{1,2})?$/.test(value) && Number.isFinite(Number(value)) && Number(value) <= Number.MAX_SAFE_INTEGER && (!integer || Number.isInteger(Number(value))))
  if (!body || Array.isArray(body) || Object.keys(empty).some(key => typeof body[key] !== 'string') ||
      body.name.length > 120 || !categories.includes(body.categoryId) || !stages.includes(body.stage) ||
      !legalForms.includes(body.legalForm) || !numeric(body.employees, true) || !numeric(body.annualRevenue)) {
    res.status(400).json({ error: 'Некорректные поля профиля' })
    return
  }
  db.prepare(`INSERT INTO business_profiles (user_id, name, category_id, stage, employees, annual_revenue, legal_form, updated_at)
    VALUES (?, ?, ?, ?, ?, ?, ?, datetime('now'))
    ON CONFLICT(user_id) DO UPDATE SET name=excluded.name, category_id=excluded.category_id, stage=excluded.stage,
    employees=excluded.employees, annual_revenue=excluded.annual_revenue, legal_form=excluded.legal_form, updated_at=excluded.updated_at`)
    .run(req.user!.userId, body.name.trim(), body.categoryId, body.stage, body.employees, body.annualRevenue, body.legalForm)
  res.json({ profile: profileFor(req.user!.userId) })
})
