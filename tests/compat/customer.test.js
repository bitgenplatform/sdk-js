// `client.customer` smoke tests against the mock API (contract § 4).
import { test, before, after } from 'node:test'
import assert from 'node:assert/strict'
import { Locale, OrganizationCategory } from '../../dist/esm/index.js'
import { startMockApi, clientFor, error, rejectsWith } from './mock-server.js'

const UUID = '0f8c3a1e-7b2d-4e5f-9a6b-1c2d3e4f5a6b'
const IDENTITY = {
  uuid: 'i', state: 'VALIDATED', mode: 'KYC',
  form: { european_residency: true, ppe: false, ppp: false, source_income: 'salary', net_income: '3000', experience: 'some', submittedAt: 1700000000, score: 10 },
  data: { steps: { info: { status: 'VALIDATED', submittedAt: 1700000000 } }, notifications: true, verificationUrl: null },
  validatedAt: 1700000000, expiresAt: 1800000000, renewalNotifiedAt: null,
}
const SETUP = { theme: 'light', currency: 'EUR', locale: 'FR', choosenOrganization: 'CUSTOMER', needActivation: true, notify: true }
const ACCOUNT_FIELDS = { email: 'jean@valjean.fr', firstname: 'Jean', lastname: 'Valjean', fin: null, birthdate: null, phoneNumber: null, phoneZone: null, referralCode: 'JV1' }
const CUSTOMER = {
  uuid: UUID, state: 'CREATED', isAvailable: true, createdAt: 1700000000, login: 'jean@valjean.fr', canLogin: false,
  account: { ...ACCOUNT_FIELDS, address: { uuid: 'a', state: 'ENABLED', address: '1 rue de Paris' } },
  client: { roles: ['ROLE_USER'], hasTfa: false, hasPhishing: false, isValid: true },
  action: { setup: SETUP },
  identity: IDENTITY, business: [],
  collaborations: { collaborator: [{ uuid: 'c', state: 'WAIT', roles: ['ROLE_USER'], organization: 'BITGEN', organizationUuid: 'org-uuid', manager: 'm' }], manager: [] },
  alert: [],
}
const ACCOUNT = {
  uuid: UUID, identity: IDENTITY, business: [],
  account: { ...ACCOUNT_FIELDS, address: { uuid: 'a', address: '1 rue de Paris' } },
  notifications: { login: true, newsletter: false },
  setup: SETUP,
}

const ROUTES = {
  '/customer': (req, res) => {
    const [status, payload] = req.method === 'POST' ? [201, { uuid: UUID }] : [200, { count: 1, items: [CUSTOMER] }]
    res.writeHead(status, { 'content-type': 'application/json' })
    res.end(JSON.stringify(payload))
  },
  [`/account/${UUID}`]: (req, res) => {
    const [status, payload] = req.method === 'PUT' ? [200, []] : [200, ACCOUNT]
    res.writeHead(status, { 'content-type': 'application/json' })
    res.end(JSON.stringify(payload))
  },
  '/account/john%2Btest%40doe.com': [200, ACCOUNT],
  '/account/nobody': error(404, 'unknown_user'),
}

let api
let client

before(async () => {
  api = await startMockApi(ROUTES)
  client = clientFor(api.port).client
})

after(() => api.stop())

test('customer.create → POST /customer, exact body, organization defaults to the scope', async () => {
  const params = { account: { email: 'jean@valjean.fr', firstname: 'Jean' }, group: { manager: 'manager-uuid' }, locale: Locale.FR }
  assert.deepEqual(await client.customer.create(params), { uuid: UUID })
  assert.equal(api.last().method, 'POST')
  assert.equal(api.last().url, '/customer')
  assert.deepEqual(api.lastBody(), { account: { email: 'jean@valjean.fr', firstname: 'Jean' }, group: { manager: 'manager-uuid', organization: 'org-uuid' }, locale: 'FR' })
  // a JS caller cannot pick another organization nor a role: only `manager` is taken, the scope is always sent, `role` never is
  await client.customer.create({ account: { email: 'a@b.c' }, group: { organization: 'other-org', manager: 'm', role: 'ROLE_OWNER' }, organization: OrganizationCategory.B2B })
  assert.deepEqual(api.lastBody(), { account: { email: 'a@b.c' }, group: { manager: 'm', organization: 'org-uuid' }, organization: 'B2B' })
  assert.ok(!('role' in api.lastBody().group))
  assert.deepEqual(params.group, { manager: 'manager-uuid' })
  // JS caller without group: the API's own error is returned, not a local TypeError
  await client.customer.create({ account: { email: 'a@b.c' } })
  assert.deepEqual(api.lastBody(), { account: { email: 'a@b.c' }, group: { organization: 'org-uuid' } })
  // needActivation / notify travel in `account` as given (false is sent, not dropped)
  await client.customer.create({ account: { email: 'a@b.c', needActivation: false, notify: false }, group: { manager: 'm' } })
  assert.deepEqual(api.lastBody(), { account: { email: 'a@b.c', needActivation: false, notify: false }, group: { manager: 'm', organization: 'org-uuid' } })
})

test('customer.list → GET /customer with the query', async () => {
  assert.deepEqual(await client.customer.list(), { count: 1, items: [CUSTOMER] })
  assert.equal(api.last().url, '/customer')
  await client.customer.list({ offset: 20, limit: 50, includeClosed: true, manager: 'x' })
  assert.equal(api.last().url, '/customer?offset=20&limit=50&includeClosed=true&manager=x')
})

test('customer.get → GET /account/{uuid|email}, email encoded', async () => {
  assert.deepEqual(await client.customer.get('john+test@doe.com'), ACCOUNT)
  assert.equal(api.last().url, '/account/john%2Btest%40doe.com')
  assert.deepEqual(await client.customer.get({ uuid: UUID }), ACCOUNT)
  assert.equal(api.last().url, `/account/${UUID}`)
  assert.deepEqual(await client.customer.get(UUID), ACCOUNT)
  await assert.rejects(() => client.customer.get({ uuid: '' }), { name: 'TypeError', message: /user must be a non-empty/ })
  await assert.rejects(() => client.customer.get(''), TypeError)
})

test('customer.update → PUT /account/{uuid}, exact body, resolves to undefined', async () => {
  assert.equal(await client.customer.update(UUID, { theme: 'dark', locale: Locale.EN, notifications: { newsletter: false } }), undefined)
  assert.equal(api.last().method, 'PUT')
  assert.equal(api.last().url, `/account/${UUID}`)
  assert.deepEqual(api.lastBody(), { action: { theme: 'dark', locale: 'EN' }, notifications: { newsletter: false } })
  await client.customer.update({ uuid: UUID }, { locale: Locale.FR })
  assert.deepEqual(api.lastBody(), { action: { locale: 'FR' } })
})

test('customer errors → BitgenError { status, code }', async () => {
  await rejectsWith(() => client.customer.get('nobody'), 404, 'unknown_user')
  const failing = await startMockApi({
    '/customer': error(412, 'user_not_attachable'),
    '/account/x': error(403, 'missing_group_organization_or_manager'),
    '/account/y': error(409, 'user_already_assigned'),
  })
  try {
    const { client: c } = clientFor(failing.port)
    await rejectsWith(() => c.customer.create({ account: { email: 'a@b.c' }, group: { manager: 'm' } }), 412, 'user_not_attachable')
    await rejectsWith(() => c.customer.get('x'), 403, 'missing_group_organization_or_manager')
    await rejectsWith(() => c.customer.get('y'), 409, 'user_already_assigned')
  } finally {
    failing.stop()
  }
})

test('customer.list → query boolean rejected by the API → 422 invalid_include_closed / invalid_strict', async () => {
  for (const code of ['invalid_include_closed', 'invalid_strict']) {
    const failing = await startMockApi({ '/customer': error(422, code) })
    try {
      await rejectsWith(() => clientFor(failing.port).client.customer.list({ includeClosed: true }), 422, code)
    } finally {
      failing.stop()
    }
  }
})

test('customer.update → 403 forbidden_permission', async () => {
  // the key lacks the permission: the API answers 403 on any route (contract § 1)
  const forbidden = await startMockApi(new Proxy({}, { get: () => error(403, 'forbidden_permission') }))
  try {
    const { client: c } = clientFor(forbidden.port)
    await rejectsWith(() => c.customer.update(UUID, { theme: 'dark' }), 403, 'forbidden_permission')
  } finally {
    forbidden.stop()
  }
})
