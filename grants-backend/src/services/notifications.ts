import cron from 'node-cron'
import { db } from '../db.js'
import { sendMaxMessage } from '../max.js'
import { config } from '../config.js'

type ExpiringRow = {
  user_id: number
  max_user_id: number
  grant_id: string
  title: string
  org: string
  deadlineISO: string
  deadlineText: string
  url: string
}

const NOTIFICATION_TYPE = 'deadline_soon'

function warningDays(): number {
  const raw = Number(process.env.DEADLINE_WARNING_DAYS)
  return Number.isFinite(raw) && raw > 0 ? raw : 3
}

function buildMessage(row: ExpiringRow): string {
  const deadline = new Date(row.deadlineISO)
  const daysLeft = Math.max(0, Math.ceil((deadline.getTime() - Date.now()) / (1000 * 60 * 60 * 24)))
  const daysWord = daysLeft === 1 ? 'день' : daysLeft >= 2 && daysLeft <= 4 ? 'дня' : 'дней'

  return [
    `🔥 Грант из избранного скоро закроется`,
    ``,
    `**${row.title}**`,
    row.org,
    ``,
    `Дедлайн: ${row.deadlineText} (осталось ~${daysLeft} ${daysWord})`,
    row.url ? row.url : '',
  ]
    .filter(Boolean)
    .join('\n')
}

let running: Promise<{ checked: number; sent: number; failed: number }> | null = null
export function checkExpiringGrantsAndNotify() {
  if (!config.notifications) return Promise.resolve({ checked: 0, sent: 0, failed: 0 })
  if (!running) running = runCheck().finally(() => { running = null })
  return running
}

async function runCheck(): Promise<{
  checked: number
  sent: number
  failed: number
}> {
  const days = warningDays()

  const rows = db
    .prepare(
      `SELECT
         favorites.user_id AS user_id,
         users.max_user_id AS max_user_id,
         grants.id AS grant_id,
         grants.title AS title,
         grants.org AS org,
         grants.deadlineISO AS deadlineISO,
         grants.deadlineText AS deadlineText,
         grants.url AS url
       FROM favorites
       JOIN grants ON grants.id = favorites.grant_id
       JOIN users ON users.id = favorites.user_id
       WHERE grants.deadlineISO IS NOT NULL
         AND users.bot_started = 1 AND users.max_user_id > 0
         AND date(grants.deadlineISO) <= date('now', '+' || ? || ' days')
         AND date(grants.deadlineISO) >= date('now')
         AND NOT EXISTS (
           SELECT 1 FROM notification_log
           WHERE notification_log.user_id = favorites.user_id
             AND notification_log.grant_id = favorites.grant_id
             AND notification_log.type = (? || ':' || grants.deadlineISO)
         )`,
    )
    .all(days, NOTIFICATION_TYPE) as ExpiringRow[]

  let sent = 0
  let failed = 0

  for (const row of rows) {
    const result = await sendMaxMessage(row.max_user_id, buildMessage(row)).catch(() => ({ ok: false as const, status: 0, error: 'Network error' }))
    if (result.ok) {
      db.prepare(
        'INSERT OR IGNORE INTO notification_log (user_id, grant_id, type) VALUES (?, ?, ?)',
      ).run(row.user_id, row.grant_id, `${NOTIFICATION_TYPE}:${row.deadlineISO}`)
      sent += 1
    } else {
      failed += 1
      console.error(
        `[notify] Failed to message MAX user ${row.max_user_id} about grant ${row.grant_id}: ` +
          `${result.status}`,
      )
    }
  }

  return { checked: rows.length, sent, failed }
}

export function startNotificationCron() {
  const schedule = process.env.NOTIFY_CRON ?? '0 9 * * *'

  const task = cron.schedule(schedule, () => {
    checkExpiringGrantsAndNotify()
      .then(({ checked, sent, failed }) => {
        console.log(`[notify] cron run: checked=${checked} sent=${sent} failed=${failed}`)
      })
      .catch((err) => {
        console.error('[notify] cron run failed', err)
      })
  }, { timezone: process.env.NOTIFY_TIMEZONE ?? 'Europe/Moscow' })

  console.log(`[notify] cron scheduled: "${schedule}"`)
  return task
}
