import Database from 'better-sqlite3'
import fs from 'node:fs'
import path from 'node:path'
import { config } from './config.js'

const dbPath = config.dbPath
fs.mkdirSync(path.dirname(dbPath), { recursive: true })

export const db = new Database(dbPath)
db.pragma('journal_mode = WAL')
db.pragma('foreign_keys = ON')

export function initSchema() {
  db.exec(`
    CREATE TABLE IF NOT EXISTS grants (
      id TEXT PRIMARY KEY,
      title TEXT NOT NULL,
      org TEXT NOT NULL,
      amount INTEGER,
      amountText TEXT NOT NULL,
      deadlineISO TEXT,
      deadlineText TEXT NOT NULL,
      industries TEXT NOT NULL,
      regions TEXT NOT NULL,
      stages TEXT NOT NULL,
      summary TEXT NOT NULL,
      requirements TEXT NOT NULL,
      notes TEXT NOT NULL,
      sphere TEXT NOT NULL,
      url TEXT NOT NULL,
      isNew INTEGER NOT NULL DEFAULT 0
    );

    -- One row per person who opened the MAX Mini App at least once.
    CREATE TABLE IF NOT EXISTS users (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      max_user_id INTEGER NOT NULL UNIQUE,
      username TEXT,
      first_name TEXT,
      last_name TEXT,
      created_at TEXT NOT NULL DEFAULT (datetime('now'))
    );

    CREATE TABLE IF NOT EXISTS business_profiles (
      user_id INTEGER PRIMARY KEY REFERENCES users(id) ON DELETE CASCADE,
      name TEXT NOT NULL DEFAULT '',
      category_id TEXT NOT NULL DEFAULT '',
      stage TEXT NOT NULL DEFAULT '',
      employees TEXT NOT NULL DEFAULT '',
      annual_revenue TEXT NOT NULL DEFAULT '',
      legal_form TEXT NOT NULL DEFAULT '',
      updated_at TEXT NOT NULL DEFAULT (datetime('now'))
    );

    CREATE TABLE IF NOT EXISTS favorites (
      user_id INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
      grant_id TEXT NOT NULL REFERENCES grants(id) ON DELETE CASCADE,
      created_at TEXT NOT NULL DEFAULT (datetime('now')),
      PRIMARY KEY (user_id, grant_id)
    );

    -- Tracks which (user, grant) pairs already got a "deadline is close" ping,
    -- so the cron job never sends the same MAX message twice.
    CREATE TABLE IF NOT EXISTS notification_log (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      user_id INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
      grant_id TEXT NOT NULL REFERENCES grants(id) ON DELETE CASCADE,
      type TEXT NOT NULL,
      sent_at TEXT NOT NULL DEFAULT (datetime('now')),
      UNIQUE(user_id, grant_id, type)
    );
  `)
  const columns = db.prepare('PRAGMA table_info(users)').all() as { name: string }[]
  if (!columns.some(column => column.name === 'bot_started')) {
    db.exec('ALTER TABLE users ADD COLUMN bot_started INTEGER NOT NULL DEFAULT 0')
  }
}
