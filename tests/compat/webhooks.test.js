// `client.webhooks` smoke tests against the mock API (contract § 10) — `verify` is in verify.test.js.
import { test, before, after } from 'node:test'
import assert from 'node:assert/strict'
import { SubscriberState, WebhookEventName } from '../../dist/esm/index.js'
import { startMockApi, clientFor, error, rejectsWith } from './mock-server.js'

const SCOPE = 'org-uuid'
const SUB = '6f708192-a3b4-4c5d-8e6f-708192a3b4c5'
const WEBHOOK = { uuid: 'w', state: 'ENABLED', name: 'custody.sent', label: '{"fr":"Envoi","en":"Sent"}', data: '{}' }
const SUBSCRIPTIONS = { secret: 'whsec_x', endpoint: 'https://example.com/hook', items: [{ uuid: SUB, state: 'ENABLED', updatedAt: 1700000000, webhook: WEBHOOK }] }
const LOG = { date: 1700000000, webhook: 'custody.sent', url: 'https://example.com/hook', status: 'delivered', http_code: 200, duration_ms: 120, attempts: 1, payload: { delivery_id: 'd' }, error: null }

const json = (res, status, payload) => { res.writeHead(status, { 'content-type': 'application/json' }); res.end(JSON.stringify(payload)) }
const ROUTES = {
  [`/webhook/security/${SCOPE}/activate`]: [201, []],
  [`/webhook/security/${SCOPE}`]: [200, []],
  [`/webhook/security/${SCOPE}/regenerate`]: [200, []],
  [`/webhooks/${SCOPE}`]: [200, SUBSCRIPTIONS],
  '/webhooks': [201, { uuid: SUB }],
  [`/webhooks/${SUB}`]: (req, res) => (req.method === 'DELETE' ? json(res, 200, []) : json(res, 201, [])),
  [`/webhooks/${SUB}/logs`]: [200, { count: 1, items: [LOG] }],
  '/webhook': [200, { count: 1, items: [WEBHOOK] }],
  '/webhook/w': [200, WEBHOOK],
  '/webhook/nope': error(404, 'unknown_webhook'),
}

let api
let client

before(async () => {
  api = await startMockApi(ROUTES)
  client = clientFor(api.port, { scope: SCOPE }).client
})

after(() => api.stop())

test('webhooks.activate / updateEndpoint / regenerate → /webhook/security/<scope>…', async () => {
  assert.equal(await client.webhooks.activate({ endpoint: 'https://x' }), undefined)
  assert.equal(api.last().method, 'POST')
  assert.equal(api.last().url, `/webhook/security/${SCOPE}/activate`)
  assert.deepEqual(api.lastBody(), { endpoint: 'https://x' })
  assert.equal(await client.webhooks.updateEndpoint({ endpoint: 'https://y' }), undefined)
  assert.equal(api.last().method, 'PATCH')
  assert.equal(api.last().url, `/webhook/security/${SCOPE}`)
  assert.deepEqual(api.lastBody(), { endpoint: 'https://y' })
  assert.equal(await client.webhooks.regenerate(), undefined)
  assert.equal(api.last().method, 'PATCH')
  assert.equal(api.last().url, `/webhook/security/${SCOPE}/regenerate`)
  assert.equal(api.last().body, '')
})

test('webhooks.list → GET /webhooks/<scope>?includeArchived', async () => {
  const subscriptions = await client.webhooks.list()
  assert.deepEqual(subscriptions, SUBSCRIPTIONS)
  assert.equal(subscriptions.items[0].state, SubscriberState.ENABLED)   // the state compares with the constant
  assert.equal(api.last().url, `/webhooks/${SCOPE}`)
  await client.webhooks.list({ includeArchived: true })
  assert.equal(api.last().url, `/webhooks/${SCOPE}?includeArchived=true`)
})

test('webhooks.subscribe / archive / reactivate', async () => {
  assert.deepEqual(await client.webhooks.subscribe(WebhookEventName.CUSTODY_SENT), { uuid: SUB })
  assert.equal(api.last().method, 'POST')
  assert.equal(api.last().url, '/webhooks')
  assert.deepEqual(api.lastBody(), { organization: SCOPE, event: 'custody.sent' })
  assert.equal(await client.webhooks.archive(SUB), undefined)
  assert.equal(api.last().method, 'DELETE')
  assert.equal(api.last().url, `/webhooks/${SUB}`)
  assert.equal(await client.webhooks.reactivate(SUB), undefined)
  assert.equal(api.last().method, 'POST')
  assert.equal(api.last().url, `/webhooks/${SUB}`)
  assert.equal(api.last().body, '')
  await assert.rejects(() => client.webhooks.archive(''), { name: 'TypeError', message: 'subscriber must be a non-empty string, or a model with a non-empty uuid' })
})

test('webhooks.logs → GET /webhooks/{subscriber}/logs with the page', async () => {
  assert.deepEqual(await client.webhooks.logs(SUB, { offset: 0, limit: 50 }), { count: 1, items: [LOG] })
  assert.equal(api.last().url, `/webhooks/${SUB}/logs?offset=0&limit=50`)
  await client.webhooks.logs(SUB)
  assert.equal(api.last().url, `/webhooks/${SUB}/logs`)
})

test('webhooks.catalog / catalogItem → GET /webhook, /webhook/{uuid}', async () => {
  assert.deepEqual(await client.webhooks.catalog(), { count: 1, items: [WEBHOOK] })
  assert.equal(api.last().url, '/webhook')
  assert.deepEqual(await client.webhooks.catalogItem('w'), WEBHOOK)
  assert.equal(api.last().url, '/webhook/w')
  await rejectsWith(() => client.webhooks.catalogItem('nope'), 404, 'unknown_webhook')
})

test('webhooks errors → BitgenError { status, code }', async () => {
  const cases = [
    ['activate', [429, 'webhook_security_already_enabled']], ['activate', [400, 'webhook_security_https_required']],
    ['updateEndpoint', [404, 'unknown_webhook_security']], ['activate', [412, 'organization_not_enabled']],
    ['subscribe', [409, 'webhook_subscription_already_exists']], ['subscribe', [404, 'unknown_webhook_security']],
    ['archive', [404, 'unknown_webhook_subscriber']], ['logs', [403, 'forbidden_permission']], ['list', [422, 'invalid_include_archived']],
  ]
  for (const [method, [status, code]] of cases) {
    const failing = await startMockApi({
      [`/webhook/security/${SCOPE}/activate`]: error(status, code), [`/webhook/security/${SCOPE}`]: error(status, code),
      '/webhooks': error(status, code), '/webhooks/s': error(status, code), '/webhooks/s/logs': error(status, code), [`/webhooks/${SCOPE}`]: error(status, code),
    })
    try {
      const { client: c } = clientFor(failing.port, { scope: SCOPE })
      const calls = {
        activate: () => c.webhooks.activate({ endpoint: 'https://x' }),
        updateEndpoint: () => c.webhooks.updateEndpoint({ endpoint: 'https://x' }),
        subscribe: () => c.webhooks.subscribe(WebhookEventName.CUSTODY_SENT),
        archive: () => c.webhooks.archive('s'),
        logs: () => c.webhooks.logs('s', { offset: 0, limit: 50 }),
        list: () => c.webhooks.list({ includeArchived: true }),
      }
      await rejectsWith(calls[method], status, code)
    } finally {
      failing.stop()
    }
  }
})

test('webhooks.regenerate / reactivate / catalog → 403 forbidden_permission', async () => {
  // the key lacks the permission: the API answers 403 on any route (contract § 1)
  const forbidden = await startMockApi(new Proxy({}, { get: () => error(403, 'forbidden_permission') }))
  try {
    const { client: c } = clientFor(forbidden.port, { scope: SCOPE })
    await rejectsWith(() => c.webhooks.regenerate(), 403, 'forbidden_permission')
    await rejectsWith(() => c.webhooks.reactivate('s'), 403, 'forbidden_permission')
    await rejectsWith(() => c.webhooks.catalog(), 403, 'forbidden_permission')
  } finally {
    forbidden.stop()
  }
})

test('webhooks: the Subscriber of list() and the WebhookType of the catalogue are accepted as models', async () => {
  const subscription = SUBSCRIPTIONS.items[0]
  await client.webhooks.archive(subscription)
  assert.equal(api.last().url, `/webhooks/${SUB}`)
  await client.webhooks.reactivate(subscription)
  assert.equal(api.last().url, `/webhooks/${SUB}`)
  await client.webhooks.logs(subscription, { limit: 10 })
  assert.equal(api.last().url, `/webhooks/${SUB}/logs?limit=10`)
  await client.webhooks.catalogItem(WEBHOOK)
  assert.equal(api.last().url, '/webhook/w')
  await client.webhooks.subscribe(WEBHOOK)   // an event of the catalogue, by model: its uuid is sent
  assert.deepEqual(api.lastBody(), { organization: SCOPE, event: 'w' })
  // a model without uuid is refused before any request — nothing is sent with `event` missing
  await assert.rejects(() => client.webhooks.subscribe({ uuid: '' }), { name: 'TypeError', message: 'event must be a non-empty string, or a model with a non-empty uuid' })
  await assert.rejects(() => client.webhooks.subscribe({}), TypeError)
  await assert.rejects(() => client.webhooks.subscribe(''), TypeError)
})
