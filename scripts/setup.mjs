import fs from 'node:fs'
import crypto from 'node:crypto'
const target = new URL('../.env', import.meta.url)
if (fs.existsSync(target)) {
  console.log('.env already exists; kept unchanged.')
} else {
  const example = fs.readFileSync(new URL('../.env.example', import.meta.url), 'utf8')
  const content = example.replace(/^JWT_SECRET=$/m, `JWT_SECRET=${crypto.randomBytes(32).toString('hex')}`)
    .replace(/^INTERNAL_API_KEY=$/m, `INTERNAL_API_KEY=${crypto.randomBytes(32).toString('hex')}`)
  fs.writeFileSync(target, content, { flag: 'wx', mode: 0o600 })
  console.log('Created .env for local mode. Add a fresh MAX_BOT_TOKEN only when connecting the bot.')
}
