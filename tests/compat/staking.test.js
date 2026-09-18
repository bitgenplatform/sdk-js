// `client.staking` smoke tests against the mock API (contract § 9, providers via § 9 bis).
import { test, before, after } from 'node:test'
import assert from 'node:assert/strict'
import { Asset, StakingMovementKind } from '../../dist/esm/index.js'
import { startMockApi, clientFor, error, rejectsWith } from './mock-server.js'

const UUID = '0f8c3a1e-7b2d-4e5f-9a6b-1c2d3e4f5a6b'
const MOVEMENT = '4d5e6f70-8192-4c0d-9e1f-2a3b4c5d6e7f'
const POSITION = '5e6f7081-92a3-4d1e-8f20-3b4c5d6e7f80'
const HISTORY = { d: [[1700000000, 100]], w: [], m: [], y: [], all: [] }
const CORE = { uuid: 'c', state: 'ENABLED', name: 'bitgen_eth', label: 'BITGEN staking ETH', type: 'STAKING', asset: { uuid: 'a', iso: 'ETH', label: 'Ethereum' }, config: [] }
const MOVEMENT_ITEM = {
  uuid: MOVEMENT, state: 'PENDING', kind: 'STAKE', provider: 'bitgen_eth', amount: '2', createdAt: 1700000000, updatedAt: 1700000001,
  staking: { uuid: POSITION, state: 'CREATED', amount: '2', error: null, data: {}, createdAt: 1700000000, updatedAt: 1700000001, core: { uuid: 'c', name: 'bitgen_eth', label: 'BITGEN staking ETH' } },
  owner: { uuid: UUID, state: 'ENABLED', login: 'jean@valjean.fr', account: { firstname: 'Jean', lastname: 'Valjean', fin: null } },
  asset: { uuid: 'a', iso: 'ETH', label: 'Ethereum' }, organization: null,
}
const OPERATION = { txId: 't1', movement: MOVEMENT, asset: 'ETH', kind: 'STAKE', amount: '2', price: 2500, value: 5000, event: 'created', provider: 'bitgen_eth', date: 1700000000 }
const PORTFOLIO = { uuid: 'p', balances: { capital: 5000, revenues: 12.5 }, histories: { capital: HISTORY, revenues: HISTORY } }

const json = (res, status, payload) => { res.writeHead(status, { 'content-type': 'application/json' }); res.end(JSON.stringify(payload)) }
const ROUTES = {
  '/applications/core': [200, { count: 1, items: [CORE] }],
  '/staking': (req, res) => (req.method === 'POST' ? json(res, 201, { uuid: MOVEMENT }) : json(res, 200, { count: 1, items: [MOVEMENT_ITEM] })),
  '/staking/movements': [200, { count: 1, items: [MOVEMENT_ITEM] }],
  [`/staking/${MOVEMENT}`]: [200, MOVEMENT_ITEM],
  [`/staking/${POSITION}/rewards`]: [200, []],
  [`/staking/${POSITION}/unstake`]: [200, []],
  '/staking/john%40doe.com/operations': [200, { count: 1, items: [OPERATION] }],
  [`/staking/${UUID}/portfolio`]: [200, PORTFOLIO],
  '/staking/nope': error(404, 'unknown_staking_movement'),
}

let api
let client

before(async () => {
  api = await startMockApi(ROUTES)
  client = clientFor(api.port).client
})

after(() => api.stop())

test('staking.providers → core.list({ type: STAKING, asset? })', async () => {
  assert.deepEqual(await client.staking.providers(), { count: 1, items: [CORE] })
  assert.equal(api.last().url, '/applications/core?type=STAKING')
  await client.staking.providers(Asset.ETH)
  assert.equal(api.last().url, '/applications/core?type=STAKING&asset=eth')
})

test('staking.stake → POST /staking, exact body, 201 { uuid }', async () => {
  assert.deepEqual(await client.staking.stake(UUID, { asset: Asset.ETH, amount: '2', provider: 'bitgen_eth' }), { uuid: MOVEMENT })
  assert.equal(api.last().method, 'POST')
  assert.equal(api.last().url, '/staking')
  assert.deepEqual(api.lastBody(), { user: UUID, asset: 'eth', amount: '2', provider: 'bitgen_eth' })
  await client.staking.stake({ uuid: UUID }, { asset: Asset.ETH, amount: 2, provider: 'c' })
  assert.deepEqual(api.lastBody(), { user: UUID, asset: 'eth', amount: '2', provider: 'c' })
  await assert.rejects(() => client.staking.stake(UUID, { asset: Asset.ETH, amount: 1e-8, provider: 'c' }), { name: 'TypeError', message: /exponent notation/ })
  await assert.rejects(() => client.staking.stake(UUID, { asset: '', amount: '1', provider: 'c' }), { name: 'TypeError', message: /asset must be/ })
})

test('staking.list / movements → GET /staking, /staking/movements with the query', async () => {
  assert.deepEqual(await client.staking.list(), { count: 1, items: [MOVEMENT_ITEM] })
  assert.equal(api.last().url, '/staking')
  await client.staking.list({ user: { uuid: UUID }, direction: StakingMovementKind.STAKE, offset: 0, limit: 50 })
  assert.equal(api.last().url, `/staking?user=${UUID}&direction=STAKE&offset=0&limit=50`)
  assert.deepEqual(await client.staking.movements(), { count: 1, items: [MOVEMENT_ITEM] })
  assert.equal(api.last().url, '/staking/movements')
  await client.staking.movements({ user: null, direction: StakingMovementKind.REWARD })
  assert.equal(api.last().url, '/staking/movements?direction=REWARD')
})

test('staking.get → GET /staking/{movement}', async () => {
  assert.deepEqual(await client.staking.get(MOVEMENT), MOVEMENT_ITEM)
  assert.equal(api.last().url, `/staking/${MOVEMENT}`)
  await assert.rejects(() => client.staking.get(''), { name: 'TypeError', message: 'movement must be a non-empty string, or a model with a non-empty uuid' })
  await rejectsWith(() => client.staking.get('nope'), 404, 'unknown_staking_movement')
})

test('staking.rewards / unstake → PUT /staking/{position}/…, {} or { amount }, [] → undefined', async () => {
  assert.equal(await client.staking.rewards(POSITION), undefined)
  assert.equal(api.last().method, 'PUT')
  assert.equal(api.last().url, `/staking/${POSITION}/rewards`)
  assert.equal(api.last().body, '{}')
  await client.staking.rewards(POSITION, { amount: '0.5' })
  assert.deepEqual(api.lastBody(), { amount: '0.5' })
  assert.equal(await client.staking.unstake(POSITION, { amount: 1 }), undefined)
  assert.equal(api.last().url, `/staking/${POSITION}/unstake`)
  assert.deepEqual(api.lastBody(), { amount: '1' })
  await client.staking.unstake(POSITION)
  assert.equal(api.last().body, '{}')
  await assert.rejects(() => client.staking.unstake('', { amount: 1 }), { name: 'TypeError', message: 'position must be a non-empty string, or a model with a non-empty uuid' })
})

test('staking.operations / portfolio → GET /staking/{user}/…', async () => {
  assert.deepEqual(await client.staking.operations('john@doe.com', { offset: 10, limit: 50 }), { count: 1, items: [OPERATION] })
  assert.equal(api.last().url, '/staking/john%40doe.com/operations?offset=10&limit=50')
  assert.deepEqual(await client.staking.portfolio(UUID), PORTFOLIO)
  assert.equal(api.last().url, `/staking/${UUID}/portfolio`)
})

test('staking errors → BitgenError { status, code }', async () => {
  const cases = [
    ['stake', [404, 'unknown_core']], ['stake', [412, 'staking_not_enabled']], ['stake', [412, 'staking_connector_missing']],
    ['stake', [412, 'staking_deposit_address_missing']], ['stake', [422, 'amount_below_minimum']], ['stake', [403, 'org_forbidden']], ['stake', [423, 'blocked_by_alert']],
    ['rewards', [404, 'unknown_staking']], ['rewards', [422, 'amount_below_minimum']], ['rewards', [422, 'staking_not_active']], ['rewards', [425, 'no_rewards']],
    ['unstake', [425, 'deposit_locked_period_not_elapsed']], ['unstake', [416, 'insufficient_balance']],
  ]
  for (const [method, [status, code]] of cases) {
    const failing = await startMockApi({ '/staking': error(status, code), '/staking/p/rewards': error(status, code), '/staking/p/unstake': error(status, code) })
    try {
      const { client: c } = clientFor(failing.port)
      const call = method === 'stake' ? () => c.staking.stake(UUID, { asset: Asset.ETH, amount: '1', provider: 'c' }) : () => c.staking[method]('p', { amount: '1' })
      await rejectsWith(call, status, code)
    } finally {
      failing.stop()
    }
  }
})

test('staking.providers / movements / operations / portfolio → 403 forbidden_permission', async () => {
  // the key lacks the permission: the API answers 403 on any route (contract § 1)
  const forbidden = await startMockApi(new Proxy({}, { get: () => error(403, 'forbidden_permission') }))
  try {
    const { client: c } = clientFor(forbidden.port)
    await rejectsWith(() => c.staking.providers(Asset.ETH), 403, 'forbidden_permission')
    await rejectsWith(() => c.staking.movements(), 403, 'forbidden_permission')
    await rejectsWith(() => c.staking.operations(UUID), 403, 'forbidden_permission')
    await rejectsWith(() => c.staking.portfolio(UUID), 403, 'forbidden_permission')
  } finally {
    forbidden.stop()
  }
})

test('staking: movement, position (movement.staking), owner and asset are accepted as models', async () => {
  assert.deepEqual(await client.staking.get(MOVEMENT_ITEM), MOVEMENT_ITEM)
  assert.equal(api.last().url, `/staking/${MOVEMENT}`)
  await client.staking.rewards(MOVEMENT_ITEM.staking)
  assert.equal(api.last().url, `/staking/${POSITION}/rewards`)
  await client.staking.unstake(MOVEMENT_ITEM.staking, { amount: '1' })
  assert.equal(api.last().url, `/staking/${POSITION}/unstake`)
  assert.deepEqual(api.lastBody(), { amount: '1' })
  await client.staking.stake(MOVEMENT_ITEM.owner, { asset: MOVEMENT_ITEM.asset, amount: '2', provider: MOVEMENT_ITEM.staking.core.name })
  assert.deepEqual(api.lastBody(), { user: UUID, asset: MOVEMENT_ITEM.asset.uuid, amount: '2', provider: 'bitgen_eth' })
  await client.staking.providers(MOVEMENT_ITEM.asset)
  assert.equal(api.last().url, `/applications/core?type=STAKING&asset=${MOVEMENT_ITEM.asset.uuid}`)
  await client.staking.list({ user: MOVEMENT_ITEM.owner, direction: StakingMovementKind.STAKE })
  assert.equal(api.last().url, `/staking?user=${UUID}&direction=STAKE`)
})
