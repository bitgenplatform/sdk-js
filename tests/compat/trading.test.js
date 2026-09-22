// `client.trading` smoke tests against the mock API (contract § 7).
import { test, before, after } from 'node:test'
import assert from 'node:assert/strict'
import { Asset, TradingDirection } from '../../dist/esm/index.js'
import { startMockApi, clientFor, error, rejectsWith } from './mock-server.js'

const UUID = '0f8c3a1e-7b2d-4e5f-9a6b-1c2d3e4f5a6b'
const TUNNEL = '9d8c7b6a-5f4e-4d3c-8b2a-1f0e9d8c7b6a'
const ORDER = {
  uuid: TUNNEL, state: 'DONE', side: 'BUY', amount: '25.00', reference: 'r1', received: 0.01, executedPrice: 2500, fee: 0.25,
  completedAt: 1700000100, createdAt: 1700000000,
  user: { uuid: UUID, login: 'jean@valjean.fr' }, organization: { uuid: 'org-uuid', name: 'BITGEN' }, asset: { uuid: 'a', iso: 'ETH', label: 'Ethereum' },
}

const ROUTES = {
  '/trading': [201, { tunnel: TUNNEL, state: 'REGISTERED' }],
  [`/trading/${TUNNEL}`]: [200, ORDER],
  '/trading/orders': [200, { count: 1, items: [ORDER] }],
  '/trading/nope': error(404, 'unknown_order'),
}

let api
let client

before(async () => {
  api = await startMockApi(ROUTES)
  client = clientFor(api.port).client
})

after(() => api.stop())

test('trading.buy → POST /trading, mode BUY, exact body, 201 { tunnel, state }', async () => {
  assert.deepEqual(await client.trading.buy(UUID, { asset: Asset.ETH, amount: 25 }), { tunnel: TUNNEL, state: 'REGISTERED' })
  assert.equal(api.last().method, 'POST')
  assert.equal(api.last().url, '/trading')
  assert.deepEqual(api.lastBody(), { user: UUID, asset: 'eth', amount: '25', mode: 'BUY' })
  await client.trading.buy({ uuid: UUID }, { asset: 'BTC', amount: '25.50', reference: 'r1' })
  assert.deepEqual(api.lastBody(), { user: UUID, asset: 'BTC', amount: '25.50', mode: 'BUY', reference: 'r1' })
})

test('trading.sell → POST /trading, mode SELL, crypto string untouched', async () => {
  await client.trading.sell(UUID, { asset: Asset.ETH, amount: '0.000000000000000001' })
  assert.deepEqual(api.lastBody(), { user: UUID, asset: 'eth', amount: '0.000000000000000001', mode: 'SELL' })
  assert.ok(api.last().body.includes('"amount":"0.000000000000000001"'))
  await assert.rejects(() => client.trading.sell(UUID, { asset: Asset.ETH, amount: 1e-8 }), { name: 'TypeError', message: /exponent notation/ })
  await assert.rejects(() => client.trading.buy('', { asset: Asset.ETH, amount: 25 }), { name: 'TypeError', message: /user must be/ })
  await assert.rejects(() => client.trading.buy(UUID, { asset: '', amount: 25 }), { name: 'TypeError', message: /asset must be/ })
  await assert.rejects(() => client.trading.buy(UUID, { asset: { uuid: ' ' }, amount: 25 }), { name: 'TypeError', message: /asset must be/ })
})

test('trading.get → GET /trading/{order}', async () => {
  assert.deepEqual(await client.trading.get(TUNNEL), ORDER)
  assert.equal(api.last().method, 'GET')
  assert.equal(api.last().url, `/trading/${TUNNEL}`)
  await assert.rejects(() => client.trading.get(''), { name: 'TypeError', message: 'order must be a non-empty string, or a model with a non-empty uuid' })
  await rejectsWith(() => client.trading.get('nope'), 404, 'unknown_order')
})

test('trading.list → GET /trading/orders, user resolved in the query', async () => {
  assert.deepEqual(await client.trading.list(), { count: 1, items: [ORDER] })
  assert.equal(api.last().url, '/trading/orders')
  await client.trading.list({ user: { uuid: UUID }, direction: TradingDirection.SELL, asset: Asset.ETH, offset: 10, limit: 50 })
  assert.equal(api.last().url, `/trading/orders?user=${UUID}&direction=sell&asset=eth&offset=10&limit=50`)
  await client.trading.list({ user: UUID })
  assert.equal(api.last().url, `/trading/orders?user=${UUID}`)
  await client.trading.list({ user: null, direction: TradingDirection.BUY })
  assert.equal(api.last().url, '/trading/orders?direction=buy')
  await client.trading.list({ asset: null, direction: TradingDirection.BUY })   // null = no filter, like `user`
  assert.equal(api.last().url, '/trading/orders?direction=buy')
  await assert.rejects(() => client.trading.list({ asset: '' }), { name: 'TypeError', message: /asset must be/ })
})

test('trading errors → BitgenError { status, code }', async () => {
  const cases = [
    [422, 'invalid_asset'], [416, 'invalid_amount'], [416, 'amount_below_commission'], [412, 'price_unavailable'],
    [412, 'trading_not_enabled'], [403, 'user_not_in_scope'], [423, 'insufficient_funds'], [423, 'blocked_by_alert'], [404, 'unknown_bank'],
    [429, 'daily_buy_limit_exceeded'],   // sandbox only: daily purchase cap per customer
  ]
  for (const [status, code] of cases) {
    const failing = await startMockApi({ '/trading': error(status, code) })
    try {
      await rejectsWith(() => clientFor(failing.port).client.trading.buy(UUID, { asset: Asset.ETH, amount: 25 }), status, code)
    } finally {
      failing.stop()
    }
  }
})

test('trading.list → 403 forbidden_permission', async () => {
  // the key lacks the permission: the API answers 403 on any route (contract § 1)
  const forbidden = await startMockApi(new Proxy({}, { get: () => error(403, 'forbidden_permission') }))
  try {
    const { client: c } = clientFor(forbidden.port)
    await rejectsWith(() => c.trading.list(), 403, 'forbidden_permission')
  } finally {
    forbidden.stop()
  }
})

test('trading: the order, its user and its asset are accepted as models — uuids are sent', async () => {
  assert.deepEqual(await client.trading.get(ORDER), ORDER)
  assert.equal(api.last().url, `/trading/${TUNNEL}`)
  await client.trading.buy(ORDER.user, { asset: ORDER.asset, amount: '25.00' })
  assert.deepEqual(api.lastBody(), { user: UUID, asset: ORDER.asset.uuid, amount: '25.00', mode: 'BUY' })
  await client.trading.sell(ORDER.user, { asset: ORDER.asset, amount: '0.01' })
  assert.deepEqual(api.lastBody(), { user: UUID, asset: ORDER.asset.uuid, amount: '0.01', mode: 'SELL' })
  await client.trading.list({ user: ORDER.user, asset: ORDER.asset, direction: TradingDirection.BUY })
  assert.equal(api.last().url, `/trading/orders?user=${UUID}&asset=${ORDER.asset.uuid}&direction=buy`)
  await assert.rejects(() => client.trading.get({ uuid: '' }), { name: 'TypeError', message: /order must be/ })
})
