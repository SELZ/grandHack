import fs from 'node:fs'
import path from 'node:path'
import { fileURLToPath } from 'node:url'
import { db, initSchema } from './db.js'
import type { Grant } from './types.js'

const __dirname = path.dirname(fileURLToPath(import.meta.url))

export function seedGrants(onlyIfEmpty = false) {
  initSchema()
  if (onlyIfEmpty && (db.prepare('SELECT COUNT(*) AS count FROM grants').get() as { count: number }).count > 0) return

  const seedPath = path.join(__dirname, '..', 'data', 'grants.seed.json')
  const grants: Grant[] = JSON.parse(fs.readFileSync(seedPath, 'utf-8'))

  const upsert = db.prepare(`
    INSERT INTO grants (
      id, title, org, amount, amountText, deadlineISO, deadlineText,
      industries, regions, stages, summary, requirements, notes, sphere, url, isNew
    ) VALUES (
      @id, @title, @org, @amount, @amountText, @deadlineISO, @deadlineText,
      @industries, @regions, @stages, @summary, @requirements, @notes, @sphere, @url, @isNew
    )
    ON CONFLICT(id) DO UPDATE SET
      title = excluded.title,
      org = excluded.org,
      amount = excluded.amount,
      amountText = excluded.amountText,
      deadlineISO = excluded.deadlineISO,
      deadlineText = excluded.deadlineText,
      industries = excluded.industries,
      regions = excluded.regions,
      stages = excluded.stages,
      summary = excluded.summary,
      requirements = excluded.requirements,
      notes = excluded.notes,
      sphere = excluded.sphere,
      url = excluded.url,
      isNew = excluded.isNew
  `)

  const insertMany = db.transaction((items: Grant[]) => {
    for (const g of items) {
      upsert.run({
        id: g.id,
        title: g.title,
        org: g.org,
        amount: g.amount,
        amountText: g.amountText,
        deadlineISO: g.deadlineISO,
        deadlineText: g.deadlineText,
        industries: JSON.stringify(g.industries),
        regions: JSON.stringify(g.regions),
        stages: JSON.stringify(g.stages),
        summary: g.summary,
        requirements: JSON.stringify(g.requirements),
        notes: JSON.stringify(g.notes),
        sphere: g.sphere,
        url: g.url,
        isNew: g.isNew ? 1 : 0,
      })
    }
  })

  insertMany(grants)
  console.log(`[seed] upserted ${grants.length} grants`)
}

// Allow running directly: npm run seed
const isMain = process.argv[1] && path.resolve(process.argv[1]) === fileURLToPath(import.meta.url)
if (isMain) {
  seedGrants()
}
