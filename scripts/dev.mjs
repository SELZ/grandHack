import { spawn } from 'node:child_process'
import { fileURLToPath } from 'node:url'
import fs from 'node:fs'
import { parseEnv } from 'node:util'

const root = fileURLToPath(new URL('../', import.meta.url))
const fileEnv = fs.existsSync(root + '.env') ? parseEnv(fs.readFileSync(root + '.env', 'utf8')) : {}
const apiPort = process.env.PORT ?? fileEnv.PORT ?? '4000'
const apiProxy = process.env.API_PROXY_TARGET ?? `http://127.0.0.1:${apiPort}`
const children = [
  spawn(process.execPath, ['node_modules/tsx/dist/cli.mjs', 'watch', 'src/server.ts'], { cwd: root + 'grants-backend', stdio: 'inherit' }),
  spawn(process.execPath, ['node_modules/vite/bin/vite.js', '--host', '127.0.0.1', '--port', '5173', '--strictPort'], { cwd: root + 'grants', stdio: 'inherit', env: { ...process.env, API_PROXY_TARGET: apiProxy } }),
]
let stopping = false
function stop(code = 0) {
  if (stopping) return
  stopping = true
  for (const child of children) child.kill('SIGTERM')
  process.exitCode = code
}
for (const child of children) {
  child.on('error', () => stop(1))
  child.on('exit', code => { if (!stopping) stop(code ?? 1) })
}
process.once('SIGINT', () => stop())
process.once('SIGTERM', () => stop())
