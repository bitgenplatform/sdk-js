// `client.asset` smoke tests against the mock API (contract § 3).
import { test, before, after } from 'node:test'
import assert from 'node:assert/strict'
import { Asset } from '../../dist/esm/index.js'
import { startMockApi, clientFor, error, rejectsWith } from './mock-server.js'

const ASSET_UUID = '5b3f1c2e-0d4a-4c8b-9e7f-1a2b3c4d5e6f'
const TICKER = { price: 2500.5, marketcap: 300000000000, rank: 2, percentChange24h: -1.25 }
const HISTORY = { d: [[1700000000, 2500.5]], w: [], m: [], y: [], all: [] }
const ASSET = {
  uuid: ASSET_UUID, state: 'AVAILABLE', iso: 'ETH', label: 'Ethereum', contractAddress: '', baseUnit: 18, gasUnit: 9,
  logo: null, data: '{"decimals":18}',
  fees: { low: null, medium: null, high: null, computed: { gas: '21000', native: '0.000021' } },
  ticker: TICKER, history: HISTORY,
  network: { uuid: 'n', state: 'ENABLED', caip2: 'eip155:1', label: 'Ethereum', gasBase: 9, data: '{}', type: { uuid: 't', code: 'evm', label: 'EVM', data: '{}' } },
}

const ROUTES = {
  '/asset': [200, { count: 1, items: [ASSET] }],
  '/asset/eth': [200, ASSET],
  '/asset/ETH': [200, ASSET],
  [`/asset/${ASSET_UUID}`]: [200, ASSET],
  '/asset/nope': error(404, 'unknown_asset'),
  '/ticker': [200, { count: 1, items: [{ iso: 'ETH', ticker: TICKER }] }],
  '/ticker/eth': [200, { iso: 'ETH', ticker: TICKER, history: HISTORY }],
}

let api
let client

before(async () => {
  api = await startMockApi(ROUTES)
  client = clientFor(api.port).client
})

after(() => api.stop())

test('asset.list → GET /asset', async () => {
  assert.deepEqual(await client.asset.list(), { count: 1, items: [ASSET] })
  assert.equal(api.last().method, 'GET')
  assert.equal(api.last().url, '/asset')
})

test('asset.get → GET /asset/{uuid|iso}, value sent as is', async () => {
  assert.deepEqual(await client.asset.get(Asset.ETH), ASSET)
  assert.equal(api.last().url, '/asset/eth')
  assert.deepEqual(await client.asset.get('ETH'), ASSET)
  assert.equal(api.last().url, '/asset/ETH')
  assert.deepEqual(await client.asset.get(ASSET_UUID), ASSET)
  assert.equal(api.last().url, `/asset/${ASSET_UUID}`)
})

test('asset.get unknown → 404 unknown_asset', async () => {
  await rejectsWith(() => client.asset.get('nope'), 404, 'unknown_asset')
})

test('asset.get / asset.ticker validate and encode the path segment', async () => {
  await assert.rejects(() => client.asset.get('a/b?c'))
  assert.equal(api.last().url, '/asset/a%2Fb%3Fc')
  await assert.rejects(() => client.asset.get(''), { name: 'TypeError', message: 'asset must be a uuid or an ISO code, or a model with a non-empty uuid' })
  await assert.rejects(() => client.asset.ticker('  '), { name: 'TypeError', message: 'iso must be a non-empty string' })
  await assert.rejects(() => client.asset.get(undefined), TypeError)
  await assert.rejects(() => client.asset.get('..'), { name: 'TypeError', message: 'asset must not be "." or ".."' })
  await assert.rejects(() => client.asset.ticker('.'), { name: 'TypeError', message: /must not be/ })
  await assert.rejects(() => client.asset.get('a..b'))
  assert.equal(api.last().url, '/asset/a..b')
})

test('asset.tickers → GET /ticker', async () => {
  assert.deepEqual(await client.asset.tickers(), { count: 1, items: [{ iso: 'ETH', ticker: TICKER }] })
  assert.equal(api.last().url, '/ticker')
})

test('asset.ticker → GET /ticker/{iso}', async () => {
  assert.deepEqual(await client.asset.ticker(Asset.ETH), { iso: 'ETH', ticker: TICKER, history: HISTORY })
  assert.equal(api.last().url, '/ticker/eth')
})

test('asset.list / tickers → 403 forbidden_permission', async () => {
  // the key lacks the permission: the API answers 403 on any route (contract § 1)
  const forbidden = await startMockApi(new Proxy({}, { get: () => error(403, 'forbidden_permission') }))
  try {
    const { client: c } = clientFor(forbidden.port)
    await rejectsWith(() => c.asset.list(), 403, 'forbidden_permission')
    await rejectsWith(() => c.asset.tickers(), 403, 'forbidden_permission')
  } finally {
    forbidden.stop()
  }
})

test('asset.get accepts an Asset / AssetRef model: its uuid is sent, never its iso', async () => {
  assert.deepEqual(await client.asset.get(ASSET), ASSET)
  assert.equal(api.last().url, `/asset/${ASSET_UUID}`)
  await client.asset.get({ uuid: ASSET_UUID, iso: 'ETH', label: 'Ethereum' })
  assert.equal(api.last().url, `/asset/${ASSET_UUID}`)
  await assert.rejects(() => client.asset.get({ uuid: '', iso: 'ETH', label: 'Ethereum' }), { name: 'TypeError', message: /asset must be/ })
})
