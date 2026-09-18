// `client.apikeys` smoke tests against the mock API (contract § 11, read-only).
import { test, before, after } from 'node:test'
import assert from 'node:assert/strict'
import { ApikeyState } from '../../dist/esm/index.js'
import { startMockApi, clientFor, error, rejectsWith } from './mock-server.js'

const SCOPE = 'org-uuid'
const KEY = '7081a2b3-c4d5-4e6f-9081-a2b3c4d5e6f7'
const APIKEY = {
  uuid: KEY, state: 'ENABLED', name: 'backend', permissions: ['asset.read', 'customer.write'], expireAt: 1800000000, createdAt: 1700000000,
  organization: { uuid: SCOPE, state: 'ENABLED', name: 'BITGEN', hub: null, owner: { uuid: 'o', login: 'admin@bitgen.com', firstname: 'Ada', lastname: null } },
}
const LOG = { date: 1700000000, path: 'GET /custody/…', payload: '{"user":"***"}', status: 200, error: null }

const ROUTES = {
  [`/organization/${SCOPE}/apikeys`]: [200, { count: 1, items: [APIKEY] }],
  [`/organization/${SCOPE}/apikeys/${KEY}`]: [200, APIKEY],
  [`/organization/${SCOPE}/apikeys/${KEY}/logs`]: [200, { count: 1, items: [LOG] }],
  [`/organization/${SCOPE}/apikeys/nope`]: error(404, 'unknown_apikey'),
}

let api
let client

before(async () => {
  api = await startMockApi(ROUTES)
  client = clientFor(api.port, { scope: SCOPE }).client
})

after(() => api.stop())

test('apikeys.list → GET /organization/<scope>/apikeys with the query', async () => {
  assert.deepEqual(await client.apikeys.list(), { count: 1, items: [APIKEY] })
  assert.equal(api.last().method, 'GET')
  assert.equal(api.last().url, `/organization/${SCOPE}/apikeys`)
  await client.apikeys.list({ offset: 0, limit: 50, includeRevoked: true })
  assert.equal(api.last().url, `/organization/${SCOPE}/apikeys?offset=0&limit=50&includeRevoked=true`)
  await client.apikeys.list({ includeRevoked: false })
  assert.equal(api.last().url, `/organization/${SCOPE}/apikeys?includeRevoked=false`)
})

test('apikeys.get → GET /organization/<scope>/apikeys/{uuid}', async () => {
  const key = await client.apikeys.get(KEY)
  assert.deepEqual(key, APIKEY)
  assert.equal(key.state, ApikeyState.ENABLED)   // the state compares with the constant
  assert.equal(api.last().url, `/organization/${SCOPE}/apikeys/${KEY}`)
  await assert.rejects(() => client.apikeys.get(''), { name: 'TypeError', message: 'apikey must be a non-empty string, or a model with a non-empty uuid' })
  await rejectsWith(() => client.apikeys.get('nope'), 404, 'unknown_apikey')
})

test('apikeys.logs → GET …/apikeys/{uuid}/logs with the page', async () => {
  assert.deepEqual(await client.apikeys.logs(KEY, { offset: 0, limit: 50 }), { count: 1, items: [LOG] })
  assert.equal(api.last().url, `/organization/${SCOPE}/apikeys/${KEY}/logs?offset=0&limit=50`)
  await client.apikeys.logs(KEY)
  assert.equal(api.last().url, `/organization/${SCOPE}/apikeys/${KEY}/logs`)
})

test('apikeys errors → BitgenError { status, code }', async () => {
  const cases = [['list', [422, 'invalid_include_revoked']], ['list', [403, 'forbidden_permission']], ['logs', [403, 'forbidden_permission']]]
  for (const [method, [status, code]] of cases) {
    const failing = await startMockApi({ [`/organization/${SCOPE}/apikeys`]: error(status, code), [`/organization/${SCOPE}/apikeys/k/logs`]: error(status, code) })
    try {
      const { client: c } = clientFor(failing.port, { scope: SCOPE })
      await rejectsWith(method === 'list' ? () => c.apikeys.list({ includeRevoked: true }) : () => c.apikeys.logs('k', { offset: 0, limit: 50 }), status, code)
    } finally {
      failing.stop()
    }
  }
})

test('apikeys: the key is accepted as a model', async () => {
  assert.deepEqual(await client.apikeys.get(APIKEY), APIKEY)
  assert.equal(api.last().url, `/organization/${SCOPE}/apikeys/${KEY}`)
  await client.apikeys.logs(APIKEY, { limit: 10 })
  assert.equal(api.last().url, `/organization/${SCOPE}/apikeys/${KEY}/logs?limit=10`)
})
