import test from 'node:test'
import assert from 'node:assert/strict'
import { createGrantBot } from '../src/bot.js'

test('bot registers user in backend and opens the mini app without an independent catalog', async () => {
  const requests = []
  const bot = createGrantBot({ token: 'test-only', username: 'test_bot', apiBase: 'http://127.0.0.1:4000', internalKey: 'test-key',
    fetchImpl: async (url, options) => { requests.push({ url: String(url), body: JSON.parse(options.body) }); return { ok: true } },
  })
  const replies = []
  const context = { update: { update_type: 'bot_started', user: { user_id: 123, first_name: 'Тест' } },
    has: filter => filter === 'bot_started',
    reply: async (...args) => replies.push(args),
  }
  await bot.middleware()(context, async () => {})
  assert.equal(requests.length, 1)
  assert.equal(requests[0].url, 'http://127.0.0.1:4000/api/internal/bot/start')
  assert.equal(requests[0].body.maxUserId, 123)
  assert.equal(replies.length, 1)
  const button = replies[0][1].attachments[0].payload.buttons[0][0]
  assert.equal(button.type, 'open_app')
  assert.equal(button.web_app, 'test_bot')
})
test('bot refuses empty credentials and remote plaintext backend URLs', () => {
  assert.throws(() => createGrantBot({}), /Configure/)
  assert.throws(() => createGrantBot({token:'test',username:'test_bot',internalKey:'test',apiBase:'http://untrusted.example'}), /HTTPS/)
})
