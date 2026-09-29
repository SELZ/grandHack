import assert from 'node:assert/strict'
import { before, after, test } from 'node:test'
import crypto from 'node:crypto'
import type { Server } from 'node:http'

Object.assign(process.env, {
  NODE_ENV: 'test', HOST: '127.0.0.1', DB_PATH: ':memory:', ALLOW_DEV_AUTH: 'true',
  MAX_BOT_TOKEN: 'integration-test-only-token', JWT_SECRET: 'test-jwt-secret-'.repeat(4),
  INTERNAL_API_KEY: 'test-internal-key-'.repeat(4), NOTIFICATIONS_ENABLED: 'false',
})
const { createApp } = await import('../src/app.js')
const { db } = await import('../src/db.js')
const { seedGrants } = await import('../src/seed.js')
const { validateMaxInitData } = await import('../src/max.js')
const { checkExpiringGrantsAndNotify } = await import('../src/services/notifications.js')
const { config, validateConfig } = await import('../src/config.js')
let server: Server
let base: string
before(async () => {
  server = createApp().listen(0, '127.0.0.1')
  await new Promise<void>(resolve => server.once('listening', resolve))
  base = `http://127.0.0.1:${(server.address() as { port: number }).port}/api`
})
after(async () => { await new Promise<void>((resolve, reject) => server.close(error => error ? reject(error) : resolve())); db.close() })

function signed(userId: number, date = Math.floor(Date.now() / 1000), extra: [string, string][] = []) {
  const fields: [string, string][] = [['auth_date', String(date)], ['user', JSON.stringify({ id: userId, first_name: 'Тест + = &' })], ...extra]
  const source = [...fields].sort(([a], [b]) => a.localeCompare(b)).map(([k,v]) => `${k}=${v}`).join('\n')
  const key = crypto.createHmac('sha256', 'WebAppData').update(process.env.MAX_BOT_TOKEN!).digest()
  const hash = crypto.createHmac('sha256', key).update(source).digest('hex')
  return [...fields.map(([k,v]) => `${k}=${encodeURIComponent(v)}`), `hash=${hash}`].join('&')
}
async function request(path: string, method = 'GET', body?: unknown, token?: string, internal?: string) {
  return fetch(base + path, { method, headers: {
    ...(body ? { 'Content-Type': 'application/json' } : {}),
    ...(token ? { Authorization: `Bearer ${token}` } : {}),
    ...(internal ? { 'x-internal-key': internal } : {}),
  }, body: body ? JSON.stringify(body) : undefined })
}
async function login(id: number) {
  const response = await request('/auth/max', 'POST', { initData: signed(id) })
  assert.equal(response.status, 200)
  return (await response.json() as { token: string }).token
}

test('MAX signature: tamper, duplicates, bad encoding, age and hash format are rejected', () => {
  const good = signed(100)
  assert.equal(validateMaxInitData(good), true)
  assert.equal(validateMaxInitData(good.replace('100', '200')), false)
  assert.equal(validateMaxInitData(good + '&hash=00'), false)
  assert.equal(validateMaxInitData(signed(100, Math.floor(Date.now()/1000), [['user', '{}']])), false)
  assert.equal(validateMaxInitData(good + '&user=%ZZ'), false)
  assert.equal(validateMaxInitData(good + 'zz'), false)
  assert.equal(validateMaxInitData(signed(100, Math.floor(Date.now()/1000) - 3601)), false)
  assert.equal(validateMaxInitData(signed(100, Math.floor(Date.now()/1000) + 100)), false)
})
test('catalog comes from DB; a normal startup never overwrites DB changes with seed', async () => {
  const response = await request('/grants')
  assert.equal(response.status, 200)
  const { grants } = await response.json() as { grants: { id: string; title: string }[] }
  assert.equal(grants.length, 34)
  const item = grants[0]
  db.prepare('UPDATE grants SET title = ? WHERE id = ?').run('DB is authoritative', item.id)
  seedGrants(true)
  const updated = await (await request(`/grants/${item.id}`)).json() as { grant: { title: string } }
  assert.equal(updated.grant.title, 'DB is authoritative')
})
test('private endpoints reject missing/forged JWT; MAX auth fails closed', async () => {
  assert.equal((await request('/favorites')).status, 401)
  assert.equal((await request('/profile','GET',undefined,'fake')).status, 401)
  assert.equal((await request('/auth/max','POST',{initData:'bad'})).status, 401)
  assert.equal((await request('/auth/max','POST',{initData:signed(-2)})).status, 400)
})
test('favorites are persistent, idempotent and isolated between MAX users', async () => {
  const a = await login(101), b = await login(102)
  const id = (db.prepare('SELECT id FROM grants LIMIT 1').get() as { id: string }).id
  assert.equal((await request(`/favorites/${id}`,'POST',undefined,a)).status, 201)
  assert.equal((await request(`/favorites/${id}`,'POST',undefined,a)).status, 201)
  assert.deepEqual(await (await request('/favorites','GET',undefined,await login(101))).json(), { grantIds: [id] })
  assert.deepEqual(await (await request('/favorites','GET',undefined,b)).json(), { grantIds: [] })
  assert.equal((await request('/favorites/missing','POST',undefined,a)).status, 404)
  await request(`/favorites/${id}`,'DELETE',undefined,a)
  assert.deepEqual(await (await request('/favorites','GET',undefined,a)).json(), { grantIds: [] })
})
test('profile camelCase API persists to DB; invalid requests cannot overwrite it', async () => {
  const token = await login(103)
  const profile = { name:'Бизнес', categoryId:'it', stage:'start', employees:'5', annualRevenue:'100.25', legalForm:'company' }
  assert.equal((await request('/profile','PUT',profile,token)).status, 200)
  assert.deepEqual(await (await request('/profile','GET',undefined,await login(103))).json(), { profile })
  assert.equal((await request('/profile','PUT',{ ...profile, employees:'-1' },token)).status, 400)
  assert.equal((await request('/profile','PUT',{ ...profile, categoryId:'fake' },token)).status, 400)
  assert.equal((await request('/profile','PUT',{name:'incomplete'},token)).status, 400)
  assert.deepEqual(await (await request('/profile','GET',undefined,token)).json(), { profile })
})
test('bot and mini app refer to the same user; internal endpoints are protected', async () => {
  const token = await login(104)
  assert.equal((await request('/internal/bot/start','POST',{maxUserId:104})).status, 401)
  assert.equal((await request('/internal/bot/start','POST',{maxUserId:104},undefined,process.env.INTERNAL_API_KEY)).status, 200)
  assert.equal((db.prepare('SELECT bot_started FROM users WHERE max_user_id=104').get() as {bot_started:number}).bot_started, 1)
  assert.equal((await request('/profile','GET',undefined,token)).status, 200)
  await request('/internal/bot/start','POST',{maxUserId:104,started:false},undefined,process.env.INTERNAL_API_KEY)
  assert.equal((db.prepare('SELECT bot_started FROM users WHERE max_user_id=104').get() as {bot_started:number}).bot_started, 0)
})
test('local mode uses server DB and cannot be enabled in production or on public bind', async () => {
  assert.equal((await request('/auth/dev','POST',{})).status, 200)
  config.production = true
  assert.throws(validateConfig, /Development auth/)
  assert.equal((await request('/auth/dev','POST',{})).status, 403)
  config.production = false
  const host = config.host
  config.host = '0.0.0.0'
  assert.throws(validateConfig, /loopback/)
  config.host = host
})
test('local tests cannot send notifications', async () => {
  assert.deepEqual(await checkExpiringGrantsAndNotify(), { checked:0, sent:0, failed:0 })
  assert.equal((await request('/internal/notify-check','POST',{},undefined,process.env.INTERNAL_API_KEY)).status, 403)
})
