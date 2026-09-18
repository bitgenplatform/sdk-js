// `client.transaction` smoke tests against the mock API (contract § 8).
import { test, before, after } from 'node:test'
import assert from 'node:assert/strict'
import { Asset, TransactionDirection, TransactionSource, TransactionState } from '../../dist/esm/index.js'
import { startMockApi, clientFor, error, rejectsWith } from './mock-server.js'

const UUID = '0f8c3a1e-7b2d-4e5f-9a6b-1c2d3e4f5a6b'
const TX_UUID = '2b3c4d5e-6f70-4a8b-9c0d-1e2f3a4b5c6d'
const TX = {
  uuid: TX_UUID, state: 'PENDING', source: 'CUSTODY', direction: 'IN', asset: 'ETH', amount: 0.5, eurValue: 1250, reference: 'BTGN-REF',
  credited: false, silent: false, data: {}, createdAt: 1700000000, updatedAt: 1700000001,
  owner: { uuid: UUID, state: 'ENABLED', login: 'jean@valjean.fr', account: { firstname: 'Jean', lastname: 'Valjean', fin: null } },
  assignee: null, organization: { uuid: 'org-uuid', state: 'ENABLED', name: 'BITGEN', hub: null }, alert: null,
}

const ROUTES = {
  '/transaction': [200, { count: 1, items: [TX] }],
  [`/transaction/${TX_UUID}`]: [200, TX],
  '/transaction/BTGN-REF': [200, TX],
  '/transaction/nope': error(404, 'unknown_transaction'),
}

let api
let client

before(async () => {
  api = await startMockApi(ROUTES)
  client = clientFor(api.port).client
})

after(() => api.stop())

test('transaction.list → GET /transaction, exact query, user resolved', async () => {
  assert.deepEqual(await client.transaction.list(), { count: 1, items: [TX] })
  assert.equal(api.last().method, 'GET')
  assert.equal(api.last().url, '/transaction')
  await client.transaction.list({ user: { uuid: UUID }, status: TransactionState.PENDING, source: TransactionSource.CUSTODY, direction: TransactionDirection.IN, asset: Asset.ETH, offset: 0, limit: 100 })
  assert.equal(api.last().url, `/transaction?user=${UUID}&status=PENDING&source=CUSTODY&direction=IN&asset=eth&offset=0&limit=100`)
  await client.transaction.list({ user: null, source: TransactionSource.BANK })
  assert.equal(api.last().url, '/transaction?source=BANK')
  await client.transaction.list({ asset: null, source: TransactionSource.BANK })   // null = no filter, like `user`
  assert.equal(api.last().url, '/transaction?source=BANK')
  await assert.rejects(() => client.transaction.list({ asset: { uuid: '' } }), { name: 'TypeError', message: /asset must be/ })
})

test('transaction.get → GET /transaction/{uuid|reference}', async () => {
  assert.deepEqual(await client.transaction.get(TX_UUID), TX)
  assert.equal(api.last().url, `/transaction/${TX_UUID}`)
  assert.deepEqual(await client.transaction.get('BTGN-REF'), TX)
  assert.equal(api.last().url, '/transaction/BTGN-REF')
  await assert.rejects(() => client.transaction.get(''), { name: 'TypeError', message: 'transaction must be a non-empty string, or a model with a non-empty uuid' })
  await rejectsWith(() => client.transaction.get('nope'), 404, 'unknown_transaction')
})

test('transaction errors → BitgenError { status, code }', async () => {
  for (const [status, code] of [[400, 'invalid_transaction_state'], [404, 'unknown_user']]) {
    const failing = await startMockApi({ '/transaction': error(status, code) })
    try {
      await rejectsWith(() => clientFor(failing.port).client.transaction.list({ status: 'NOPE' }), status, code)
    } finally {
      failing.stop()
    }
  }
})

test('transaction: the transaction, its owner and an AssetRef are accepted as models', async () => {
  assert.deepEqual(await client.transaction.get(TX), TX)
  assert.equal(api.last().url, `/transaction/${TX_UUID}`)
  await client.transaction.list({ user: TX.owner, asset: { uuid: 'asset-eth', iso: 'ETH', label: 'Ethereum' } })
  assert.equal(api.last().url, `/transaction?user=${UUID}&asset=asset-eth`)
})
