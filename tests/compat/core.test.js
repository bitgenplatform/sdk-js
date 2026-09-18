// `client.core` smoke tests against the mock API (contract § 9 bis).
import { test, before, after } from 'node:test'
import assert from 'node:assert/strict'
import { Asset, CoreState, CoreType } from '../../dist/esm/index.js'
import { startMockApi, clientFor, error, rejectsWith } from './mock-server.js'

const CORE_UUID = '3c4d5e6f-7081-4b9c-8d1e-2f3a4b5c6d7e'
const CORE = {
  uuid: CORE_UUID, state: 'ENABLED', name: 'bitgen_eth', label: 'BITGEN staking ETH', type: 'STAKING',
  asset: { uuid: 'a', iso: 'ETH', label: 'Ethereum' },
  config: [{ name: 'apr', label: { fr: 'Taux', en: 'Rate' }, data: { type: 'number', value: 4.2 } }],
}
const BANK_CORE = { ...CORE, uuid: 'b', name: 'treezor', label: 'Treezor', type: 'RAMP', asset: null, config: [] }

const ROUTES = {
  '/applications/core': [200, { count: 2, items: [CORE, BANK_CORE] }],
  [`/applications/core/${CORE_UUID}`]: [200, CORE],
  '/applications/core/nope': error(404, 'unknown_core'),
}

let api
let client

before(async () => {
  api = await startMockApi(ROUTES)
  client = clientFor(api.port).client
})

after(() => api.stop())

test('core.list → GET /applications/core with the combinable filters', async () => {
  assert.deepEqual(await client.core.list(), { count: 2, items: [CORE, BANK_CORE] })
  assert.equal(api.last().method, 'GET')
  assert.equal(api.last().url, '/applications/core')
  await client.core.list({ type: CoreType.STAKING, asset: Asset.ETH })
  assert.equal(api.last().url, '/applications/core?type=STAKING&asset=eth')
  await client.core.list({ type: CoreType.RAMP, state: CoreState.ENABLED })
  assert.equal(api.last().url, '/applications/core?type=RAMP&state=ENABLED')
  await client.core.list({ type: CoreType.STAKING, asset: null })   // null = no filter
  assert.equal(api.last().url, '/applications/core?type=STAKING')
  await assert.rejects(() => client.core.list({ asset: '' }), { name: 'TypeError', message: /asset must be/ })
})

test('core.get → GET /applications/core/{uuid}', async () => {
  assert.deepEqual(await client.core.get(CORE_UUID), CORE)
  assert.equal(api.last().url, `/applications/core/${CORE_UUID}`)
  await assert.rejects(() => client.core.get(''), { name: 'TypeError', message: 'core must be a non-empty string, or a model with a non-empty uuid' })
  await rejectsWith(() => client.core.get('nope'), 404, 'unknown_core')
})

test('core errors → BitgenError { status, code }', async () => {
  for (const [status, code] of [[424, 'unknown_core_type'], [400, 'invalid_core_status'], [404, 'unknown_asset']]) {
    const failing = await startMockApi({ '/applications/core': error(status, code) })
    try {
      // 'BANK' is not a CoreType: the SDK sends it as is, the API answers
      await rejectsWith(() => clientFor(failing.port).client.core.list({ type: 'BANK' }), status, code)
    } finally {
      failing.stop()
    }
  }
})

test('core: the connector and its asset are accepted as models', async () => {
  assert.deepEqual(await client.core.get(CORE), CORE)
  assert.equal(api.last().url, `/applications/core/${CORE_UUID}`)
  await client.core.list({ type: CoreType.STAKING, asset: CORE.asset })
  assert.equal(api.last().url, `/applications/core?type=STAKING&asset=${CORE.asset.uuid}`)
})
