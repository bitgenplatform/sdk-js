// `client.custody` smoke tests against the mock API (contract § 6).
import { test, before, after } from 'node:test'
import assert from 'node:assert/strict'
import { Asset } from '../../dist/esm/index.js'
import { startMockApi, clientFor, error, rejectsWith } from './mock-server.js'

const UUID = '0f8c3a1e-7b2d-4e5f-9a6b-1c2d3e4f5a6b'
const PENDING_UUID = '1a2b3c4d-0000-4000-8000-000000000002'
const HISTORY = { d: [[1700000000, 2500.5]], w: [], m: [], y: [], all: [] }
const WALLET = {
  uuid: 'w', state: 'CREATED', type: 'USER', address: '0xabc', addressLegacy: null, tag: null,
  balance: '0.000000000000000001', asset: { uuid: 'a', iso: 'ETH', label: 'Ethereum' },
}
const WALLET_WITH_HISTORY = { ...WALLET, history: HISTORY }
const PORTFOLIO = { uuid: 'p', type: 'USER', history: HISTORY }
const EIGHTEEN_DECIMALS = '0.000000000000000001'

const ROUTES = {
  [`/custody/${UUID}`]: (req, res) => {
    const payload = req.method === 'PUT' ? { transaction: 'tx-uuid' } : [WALLET]
    res.writeHead(200, { 'content-type': 'application/json' })
    res.end(JSON.stringify(payload))
  },
  [`/custody/${PENDING_UUID}`]: [200, { transaction: null }],
  [`/custody/${UUID}/eth`]: [200, WALLET_WITH_HISTORY],
  [`/custody/${UUID}/${WALLET.asset.uuid}`]: [200, WALLET_WITH_HISTORY],
  [`/custody/${UUID}/ETH`]: [200, WALLET_WITH_HISTORY],
  [`/custody/${UUID}/nope`]: error(404, 'unknown_asset'),
  '/custody/john%40doe.com/portfolio': [200, PORTFOLIO],
  [`/custody/${UUID}/portfolio`]: [200, { history: HISTORY }],
}

let api
let client

before(async () => {
  api = await startMockApi(ROUTES)
  client = clientFor(api.port).client
})

after(() => api.stop())

test('custody.wallets → GET /custody/{user}, array returned as is', async () => {
  assert.deepEqual(await client.custody.wallets(UUID), [WALLET])
  assert.equal(api.last().method, 'GET')
  assert.equal(api.last().url, `/custody/${UUID}`)
  assert.deepEqual(await client.custody.wallets({ uuid: UUID }), [WALLET])
})

test('custody.wallet → GET /custody/{user}/{asset}, asset sent as is', async () => {
  assert.deepEqual(await client.custody.wallet(UUID, Asset.ETH), WALLET_WITH_HISTORY)
  assert.equal(api.last().url, `/custody/${UUID}/eth`)
  assert.deepEqual(await client.custody.wallet(UUID, 'ETH'), WALLET_WITH_HISTORY)
  assert.equal(api.last().url, `/custody/${UUID}/ETH`)
  await assert.rejects(() => client.custody.wallet(UUID, ''), { name: 'TypeError', message: 'asset must be a uuid or an ISO code, or a model with a non-empty uuid' })
  await rejectsWith(() => client.custody.wallet(UUID, 'nope'), 404, 'unknown_asset')
})

test('custody.portfolio → GET /custody/{user}/portfolio, both shapes', async () => {
  assert.deepEqual(await client.custody.portfolio('john@doe.com'), PORTFOLIO)
  assert.equal(api.last().url, '/custody/john%40doe.com/portfolio')
  assert.deepEqual(await client.custody.portfolio(UUID), { history: HISTORY })
})

test('custody.withdraw → PUT /custody/{user}, exact body, 18-decimal string untouched', async () => {
  assert.deepEqual(await client.custody.withdraw(UUID, { asset: Asset.ETH, amount: EIGHTEEN_DECIMALS, targetAddress: '0xabc' }), { transaction: 'tx-uuid' })
  assert.equal(api.last().method, 'PUT')
  assert.equal(api.last().url, `/custody/${UUID}`)
  assert.deepEqual(api.lastBody(), { asset: Asset.ETH, amount: EIGHTEEN_DECIMALS, targetAddress: '0xabc' })
  assert.ok(api.last().body.includes(`"amount":"${EIGHTEEN_DECIMALS}"`))
  await client.custody.withdraw(UUID, { asset: Asset.XRP, amount: '12.5', targetAddress: 'rAbc', targetTag: '1234', travelRule: { platform: 'x' } })
  assert.deepEqual(api.lastBody(), { asset: Asset.XRP, amount: '12.5', targetAddress: 'rAbc', targetTag: '1234', travelRule: { platform: 'x' } })
  await client.custody.withdraw({ uuid: UUID }, { asset: Asset.ETH, amount: 0.5, targetAddress: '0xabc', idempotencyKey: 'k-1', travelRule: { firstname: 'Jean', lastname: 'Valjean' } })
  assert.deepEqual(api.lastBody(), { asset: 'eth', amount: '0.5', targetAddress: '0xabc', idempotencyKey: 'k-1', travelRule: { firstname: 'Jean', lastname: 'Valjean' } })
  await assert.rejects(() => client.custody.withdraw(UUID, { asset: Asset.ETH, amount: 1e-8, targetAddress: '0xabc' }), { name: 'TypeError', message: /exponent notation/ })
  await assert.rejects(() => client.custody.withdraw(UUID, { asset: ' ', amount: '1', targetAddress: '0xabc' }), { name: 'TypeError', message: /asset must be/ })
})

test('custody.withdraw → { transaction: null } when the line is not created yet', async () => {
  assert.deepEqual(await client.custody.withdraw(PENDING_UUID, { asset: Asset.ETH, amount: '1', targetAddress: '0xabc' }), { transaction: null })
})

test('custody errors → BitgenError { status, code }', async () => {
  const failing = await startMockApi({
    '/custody/a': error(416, 'requested_amount_error'),
    '/custody/b': error(416, 'amount_precision_exceeded'),
    '/custody/c': error(403, 'wallet_frozen'),
    '/custody/d': error(403, 'org_forbidden'),
    '/custody/e': error(423, 'blocked_by_alert'),
    '/custody/f': error(409, 'duplicate_withdraw'),
    '/custody/g': error(422, 'withdraw_target_invalid'),
  })
  try {
    const { client: c } = clientFor(failing.port)
    const params = { asset: Asset.ETH, amount: '1', targetAddress: '0xabc' }
    await rejectsWith(() => c.custody.withdraw('a', params), 416, 'requested_amount_error')
    await rejectsWith(() => c.custody.withdraw('b', params), 416, 'amount_precision_exceeded')
    await rejectsWith(() => c.custody.withdraw('c', params), 403, 'wallet_frozen')
    await rejectsWith(() => c.custody.wallets('d'), 403, 'org_forbidden')
    await rejectsWith(() => c.custody.withdraw('e', params), 423, 'blocked_by_alert')
    await rejectsWith(() => c.custody.withdraw('f', params), 409, 'duplicate_withdraw')
    await rejectsWith(() => c.custody.withdraw('g', params), 422, 'withdraw_target_invalid')
  } finally {
    failing.stop()
  }
})

test('custody.portfolio → 403 forbidden_permission', async () => {
  // the key lacks the permission: the API answers 403 on any route (contract § 1)
  const forbidden = await startMockApi(new Proxy({}, { get: () => error(403, 'forbidden_permission') }))
  try {
    const { client: c } = clientFor(forbidden.port)
    await rejectsWith(() => c.custody.portfolio(UUID), 403, 'forbidden_permission')
  } finally {
    forbidden.stop()
  }
})

test('custody: the asset of a wallet (an AssetRef) is accepted, its uuid is sent', async () => {
  await client.custody.wallet(UUID, WALLET.asset)
  assert.equal(api.last().url, `/custody/${UUID}/${WALLET.asset.uuid}`)
  await client.custody.withdraw({ uuid: UUID }, { asset: WALLET.asset, amount: '0.05', targetAddress: '0xabc' })
  assert.deepEqual(api.lastBody(), { asset: WALLET.asset.uuid, amount: '0.05', targetAddress: '0xabc' })
})
