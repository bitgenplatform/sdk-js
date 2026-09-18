// `client.bank` smoke tests against the mock API (contract § 5), plus the `amount()` helper.
import { test, before, after } from 'node:test'
import assert from 'node:assert/strict'
import { amount } from '../../dist/esm/utils.js'
import { BankDirection } from '../../dist/esm/index.js'
import { startMockApi, clientFor, error, rejectsWith } from './mock-server.js'

const UUID = '0f8c3a1e-7b2d-4e5f-9a6b-1c2d3e4f5a6b'
const ACCOUNT = { uuid: 'b', message: 'BTGN-JV1', iban: null, bank: null, bic: null, balance: 120.5, history: {}, pending: { in: 0, out: 50 } }
const OPERATION = { txId: 't1', amount: 100, direction: 'DEPOSIT', date: 1700000000, info: null }

const ROUTES = {
  [`/bank/${UUID}`]: (req, res) => {
    const [status, payload] = req.method === 'PUT' ? [200, { transaction: 'tx-uuid' }] : [200, ACCOUNT]
    res.writeHead(status, { 'content-type': 'application/json' })
    res.end(JSON.stringify(payload))
  },
  [`/bank/${UUID}/operations`]: [200, { count: 1, items: [OPERATION] }],
  '/bank/john%40doe.com': [200, ACCOUNT],
  '/bank': [201, { uuid: 'credit-uuid' }],
  '/bank/nokyc': error(412, 'owner_identity_not_validated'),
  '/bank/nobody': error(404, 'unknown_bank'),
}

let api
let client

before(async () => {
  api = await startMockApi(ROUTES)
  client = clientFor(api.port).client
})

after(() => api.stop())

test('bank.get → GET /bank/{uuid|email}', async () => {
  assert.deepEqual(await client.bank.get('john@doe.com'), ACCOUNT)
  assert.equal(api.last().method, 'GET')
  assert.equal(api.last().url, '/bank/john%40doe.com')
  assert.deepEqual(await client.bank.get({ uuid: UUID }), ACCOUNT)
  assert.equal(api.last().url, `/bank/${UUID}`)
})

test('bank.operations → GET /bank/{user}/operations with the exact query', async () => {
  assert.deepEqual(await client.bank.operations(UUID), { count: 1, items: [OPERATION] })
  assert.equal(api.last().url, `/bank/${UUID}/operations`)
  await client.bank.operations(UUID, { direction: BankDirection.DEPOSIT, from: 1, to: 2, offset: 0, limit: 50 })
  assert.equal(api.last().url, `/bank/${UUID}/operations?direction=DEPOSIT&from=1&to=2&offset=0&limit=50`)
})

test('bank.withdraw → PUT /bank/{user}, amount always sent as a string', async () => {
  assert.deepEqual(await client.bank.withdraw(UUID, { amount: 50 }), { transaction: 'tx-uuid' })
  assert.equal(api.last().method, 'PUT')
  assert.equal(api.last().url, `/bank/${UUID}`)
  assert.deepEqual(api.lastBody(), { amount: '50' })
  await client.bank.withdraw({ uuid: UUID }, { amount: '12.34', iban: 'FR7630006000011234567890189', bic: 'X' })
  assert.deepEqual(api.lastBody(), { amount: '12.34', iban: 'FR7630006000011234567890189', bic: 'X' })
})

test('bank.credit → POST /bank, user resolved, 201 { uuid }', async () => {
  assert.deepEqual(await client.bank.credit({ amount: 10, user: { uuid: UUID }, reference: 'r' }), { uuid: 'credit-uuid' })
  assert.equal(api.last().method, 'POST')
  assert.equal(api.last().url, '/bank')
  assert.deepEqual(api.lastBody(), { amount: '10', user: UUID, reference: 'r' })
  await client.bank.credit({ amount: '25.00', message: 'BTGN-JV1', currency: 'EUR' })
  assert.deepEqual(api.lastBody(), { amount: '25.00', message: 'BTGN-JV1', currency: 'EUR' })
  await client.bank.credit({ amount: 1, message: 'BTGN-JV1', user: null })
  assert.deepEqual(api.lastBody(), { amount: '1', message: 'BTGN-JV1' })
  await assert.rejects(() => client.bank.credit({ amount: 1, user: '' }), TypeError)
})

test('amount(): strings as is (trimmed), finite numbers >= 0, TypeError otherwise', async () => {
  assert.equal(amount('12.34'), '12.34')
  assert.equal(amount(' 0.000000000000000001 '), '0.000000000000000001')
  assert.equal(amount(50), '50')
  assert.equal(amount(0), '0')
  assert.equal(amount(0.1), '0.1')
  assert.equal(amount(0.000001), '0.000001')
  assert.equal(amount('1e-8'), '1e-8')   // strings are never reinterpreted
  for (const exp of [1e-7, 1e-8, 1e21]) {
    assert.throws(() => amount(exp), { name: 'TypeError', message: /exponent notation: pass it as a decimal string/ })
  }
  for (const bad of [-1, NaN, Infinity, '', '   ', null, undefined, {}]) {
    assert.throws(() => amount(bad), { name: 'TypeError', message: /amount must be/ })
  }
  await assert.rejects(() => client.bank.withdraw(UUID, { amount: -1 }), TypeError)
  await assert.rejects(() => client.bank.credit({ amount: '' }), TypeError)
})

test('bank errors → BitgenError { status, code }', async () => {
  await rejectsWith(() => client.bank.get('nokyc'), 412, 'owner_identity_not_validated')
  await rejectsWith(() => client.bank.get('nobody'), 404, 'unknown_bank')
  const failing = await startMockApi({
    '/bank/a': error(416, 'requested_amount_error'),
    '/bank/b': error(423, 'account_frozen'),
    '/bank/c': error(403, 'user_actions_disabled'),
    '/bank/d': error(422, 'invalid_iban'),
  })
  try {
    const { client: c } = clientFor(failing.port)
    await rejectsWith(() => c.bank.withdraw('a', { amount: 1 }), 416, 'requested_amount_error')
    await rejectsWith(() => c.bank.withdraw('b', { amount: 1 }), 423, 'account_frozen')
    await rejectsWith(() => c.bank.withdraw('c', { amount: 1 }), 403, 'user_actions_disabled')
    await rejectsWith(() => c.bank.withdraw('d', { amount: 1, iban: 'bad' }), 422, 'invalid_iban')
  } finally {
    failing.stop()
  }
})

test('bank.operations → 403 forbidden_permission', async () => {
  // the key lacks the permission: the API answers 403 on any route (contract § 1)
  const forbidden = await startMockApi(new Proxy({}, { get: () => error(403, 'forbidden_permission') }))
  try {
    const { client: c } = clientFor(forbidden.port)
    await rejectsWith(() => c.bank.operations(UUID), 403, 'forbidden_permission')
  } finally {
    forbidden.stop()
  }
})
