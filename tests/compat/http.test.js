// Transport smoke tests against a mock API: config validation, headers, query, bodies, errors,
// timeout, network failures, redirects. Runs on the built ESM output — built by `pretest`.
import { test, before, after } from 'node:test'
import assert from 'node:assert/strict'
import { readFileSync } from 'node:fs'
import { createRequire } from 'node:module'
import { BitgenClient, BitgenError, Env } from '../../dist/esm/index.js'
import { startMockApi, clientFor, Probe, error, rejectsWith } from './mock-server.js'

/** The CommonJS build, loaded next to the ESM one (dual-package situation) */
const cjs = createRequire(import.meta.url)('../../dist/cjs/index.js')
const { version } = JSON.parse(readFileSync(new URL('../../package.json', import.meta.url), 'utf8'))

const hanging = []
const ROUTES = {
  '/ok': [200, { count: 1, items: [{ iso: 'BTC' }] }],
  '/created': [201, { uuid: 'abc' }],
  '/empty-array': [200, []],
  '/err-json': error(416, 'requested_amount_error'),
  '/err-long': [400, { error: true, message: 'x'.repeat(500), code: 400 }],
  '/nocontent': (req, res) => { res.writeHead(204); res.end() },
  '/emptybody': (req, res) => { res.writeHead(200); res.end('') },
  '/err-text': (req, res) => { res.writeHead(500, { 'content-type': 'text/html' }); res.end(`<html>${'x'.repeat(500)}</html>`) },
  '/html-ok': (req, res) => { res.writeHead(200, { 'content-type': 'text/html' }); res.end(`<html>${'y'.repeat(500)}</html>`) },
  '/err-empty': (req, res) => { res.writeHead(502); res.end() },
  '/redirect': (req, res) => { res.writeHead(302, { location: 'http://127.0.0.1:1/steal' }); res.end('moved') },
  '/hang': (req, res) => { hanging.push(res) },
  '/hang-body': (req, res) => { res.writeHead(200, { 'content-type': 'application/json' }); res.write('{"count":'); hanging.push(res) },
  '/reset': (req, res) => { res.writeHead(200, { 'content-type': 'application/json' }); res.write('{"count":'); res.destroy() },
}

let api
let http

before(async () => {
  api = await startMockApi(ROUTES)
  http = clientFor(api.port).http
})

after(() => {
  for (const res of hanging) res.destroy()
  api.stop()
})

// ─── Construction ─────────────────────────────────────────────────────────────

test('config validation fails fast, without echoing the values', () => {
  assert.throws(() => new BitgenClient({ scope: '', apiKey: 'k' }), { name: 'TypeError', message: 'BitgenConfig.scope must be a non-empty string' })
  assert.throws(() => new BitgenClient({ scope: 's', apiKey: '  ' }), { name: 'TypeError', message: 'BitgenConfig.apiKey must be a non-empty string' })
  assert.throws(() => new BitgenClient({ scope: 's' }), TypeError)
  assert.throws(() => new BitgenClient({ scope: 's', apiKey: 'SECRET-KEY', env: 'not-an-env' }), (err) => {
    assert.ok(err instanceof TypeError)
    assert.match(err.message, /env must be one of production, sandbox, staging, localhost/)
    assert.ok(!err.message.includes('SECRET-KEY'))
    assert.ok(!err.message.includes('not-an-env'), 'the value given is not echoed')
    return true
  })
  // userinfo (`me@attacker` would send the key elsewhere), query, fragment, bracketed IPv6 and stray characters are refused too
  for (const host of ['https://my-host', 'my-host:8080', 'my-host/api', '', 'me@attacker', 'my-host?x', 'my-host#x', '[::1]', 'a|b', 'my host']) {
    assert.throws(() => new BitgenClient({ scope: 's', apiKey: 'k', host }), { name: 'TypeError', message: /bare hostname/ })
  }
  for (const host of ['my-host', 'api_internal.corp.local', '10.0.0.7']) {
    assert.doesNotThrow(() => new BitgenClient({ scope: 's', apiKey: 'k', host }))
  }
  for (const apiKey of ['SECRET\nInjected: yes', 'SECRET\r', 'clé', 'k\x7f']) {
    assert.throws(() => new BitgenClient({ scope: 's', apiKey }), (err) => {
      assert.ok(err instanceof TypeError)
      assert.match(err.message, /apiKey contains invalid characters/)
      assert.ok(!err.message.includes('SECRET'))
      return true
    })
  }
  assert.throws(() => new BitgenClient({ scope: 'org\n', apiKey: 'k' }), { name: 'TypeError', message: /scope contains invalid characters/ })
  for (const port of [0, 70000, 8.5, '8080', NaN]) {
    assert.throws(() => new BitgenClient({ scope: 's', apiKey: 'k', env: Env.LOCALHOST, port }), { name: 'TypeError', message: /port must be an integer/ })
  }
  for (const timeout of [-1, '30', NaN, Infinity, 2_147_484, 2 ** 31]) {
    assert.throws(() => new BitgenClient({ scope: 's', apiKey: 'k', timeout }), { name: 'TypeError', message: /timeout must be a number of seconds between 0 \(no timeout\) and 2147483/ })
  }
})

test('missing global fetch (Node < 20) gives a clear error', () => {
  const saved = globalThis.fetch
  globalThis.fetch = undefined
  try {
    assert.throws(() => new BitgenClient({ scope: 's', apiKey: 'k' }), { message: /global fetch.*Node\.js 20/ })
  } finally {
    globalThis.fetch = saved
  }
})

test('two clients do not share state', () => {
  const a = new Probe({ scope: 'org-a', apiKey: 'key-a', env: Env.SANDBOX })
  const b = new Probe({ scope: 'org-b', apiKey: 'key-b', env: Env.STAGING })
  assert.notEqual(a.transport, b.transport)
  assert.equal(a.transport.headers['BITGEN-Scope'], 'org-a')
  assert.equal(b.transport.headers['BITGEN-Scope'], 'org-b')
  assert.notEqual(a.transport.baseUrl, b.transport.baseUrl)
})

test('base URL per environment and custom host', () => {
  const base = (config) => new Probe({ scope: 's', apiKey: 'k', ...config }).transport.baseUrl
  assert.equal(base({ env: Env.PRODUCTION }), 'https://api.bitgen.com')
  assert.equal(base({ env: Env.SANDBOX }), 'https://api.sandbox.bitgen.com')
  assert.equal(base({ env: Env.STAGING }), 'https://api.staging.btgn.dev')
  assert.equal(base({ env: Env.LOCALHOST }), 'http://localhost:3002')
  assert.equal(base({ env: Env.LOCALHOST, port: 4000 }), 'http://localhost:4000')
  assert.equal(base({}), 'https://api.bitgen.com')
  assert.equal(base({ host: 'my-container', port: 8080, isSsl: false }), 'http://my-container:8080')
  assert.equal(base({ host: 'my-container', port: 8443 }), 'https://my-container:8443')
})

// ─── Requests ─────────────────────────────────────────────────────────────────

test('GET sends the auth headers, the User-Agent, and skips undefined / null query entries', async () => {
  const result = await http.get('/ok', { offset: 0, limit: 10, user: undefined, none: null, flag: true })
  assert.deepEqual(result, { count: 1, items: [{ iso: 'BTC' }] })
  const { url, headers } = api.last()
  assert.equal(url, '/ok?offset=0&limit=10&flag=true')
  assert.equal(headers['bitgen-scope'], 'org-uuid')
  assert.equal(headers['api-key'], 'secret')
  assert.equal(headers['content-type'], 'application/json')
  assert.equal(headers['user-agent'], `bitgen-sdk-nodejs/${version}`)
})

test('POST sends the body as JSON and returns the 201 payload', async () => {
  const result = await http.post('/created', { amount: '0.5', asset: 'btc' })
  assert.deepEqual(result, { uuid: 'abc' })
  assert.equal(api.last().method, 'POST')
  assert.equal(api.last().body, '{"amount":"0.5","asset":"btc"}')
})

test('PUT / PATCH / DELETE without body', async () => {
  assert.deepEqual(await http.put('/empty-array'), [])
  assert.equal(api.last().method, 'PUT')
  assert.equal(api.last().body, '')
  await http.patch('/empty-array')
  assert.equal(api.last().method, 'PATCH')
  await http.delete('/empty-array')
  assert.equal(api.last().method, 'DELETE')
})

test('204 and empty body resolve to undefined', async () => {
  assert.equal(await http.get('/nocontent'), undefined)
  assert.equal(await http.get('/emptybody'), undefined)
})

// ─── Errors ───────────────────────────────────────────────────────────────────

test('JSON error body becomes a BitgenError with status and stable code', async () => {
  await rejectsWith(() => http.get('/err-json'), 416, 'requested_amount_error')
  await rejectsWith(() => http.get('/nope'), 404, 'unknown_route')
})

test('non-JSON error body: code is the raw text truncated to 200 characters', async () => {
  await assert.rejects(() => http.get('/err-text'), (err) => {
    assert.ok(err instanceof BitgenError)
    assert.equal(err.status, 500)
    assert.equal(err.code.length, 200)
    assert.ok(err.code.startsWith('<html>'))
    return true
  })
})

test('empty error body: code falls back to the HTTP status text', async () => {
  await rejectsWith(() => http.get('/err-empty'), 502, 'Bad Gateway')
})

test('redirects are not followed: a 3xx is a BitgenError and the key is not replayed', async () => {
  const before = api.seen.length
  await rejectsWith(() => http.get('/redirect'), 302, 'moved')
  assert.equal(api.seen.length, before + 1)
  assert.equal(api.last().url, '/redirect')
})

test('2xx body that is not JSON is a BitgenError too, never a raw SyntaxError', async () => {
  await assert.rejects(() => http.get('/html-ok'), (err) => {
    assert.ok(err instanceof BitgenError)
    assert.equal(err.status, 200)
    assert.equal(err.code.length, 200)
    assert.ok(err.code.startsWith('<html>'))
    return true
  })
})

test('code is capped at 200 characters even in a JSON error body', async () => {
  await assert.rejects(() => http.get('/err-long'), (err) => {
    assert.ok(err instanceof BitgenError)
    assert.equal(err.code.length, 200)
    assert.equal(err.message.length, '[400] '.length + 200)
    return true
  })
})

test('timeout: a server that never answers → request_timeout, status 0, native cause', async () => {
  const { http: quick } = clientFor(api.port, { timeout: 0.1 })   // seconds
  await assert.rejects(() => quick.get('/hang'), (err) => {
    assert.ok(err instanceof BitgenError)
    assert.equal(err.status, 0)
    assert.equal(err.code, 'request_timeout')
    assert.equal(err.message, '[0] request_timeout')
    assert.ok(err.cause instanceof Error)
    return true
  })
})

test('timeout while reading the body → request_timeout too', async () => {
  const { http: quick } = clientFor(api.port, { timeout: 0.1 })
  await assert.rejects(() => quick.get('/hang-body'), (err) => {
    assert.ok(err instanceof BitgenError)
    assert.equal(err.status, 0)
    assert.equal(err.code, 'request_timeout')
    return true
  })
})

test('connection dropped while reading the body → network_error', async () => {
  await assert.rejects(() => http.get('/reset'), (err) => {
    assert.ok(err instanceof BitgenError)
    assert.equal(err.status, 0)
    assert.equal(err.code, 'network_error')
    assert.ok(err.cause instanceof Error)
    return true
  })
})

test('timeout: seconds in, integer milliseconds inside — 0 disables it, the default is 30 s', () => {
  assert.equal(clientFor(api.port).http.timeout, 30_000)
  assert.equal(clientFor(api.port, { timeout: 0 }).http.timeout, 0)
  assert.equal(clientFor(api.port, { timeout: 0.1 }).http.timeout, 100)
  assert.equal(clientFor(api.port, { timeout: 0.3 }).http.timeout, 300)       // not 300.00000000000006: AbortSignal.timeout wants an integer
  assert.equal(clientFor(api.port, { timeout: 0.0004 }).http.timeout, 1)      // a positive timeout never rounds down to "none"
  assert.equal(clientFor(api.port, { timeout: 2_147_483 }).http.timeout, 2_147_483_000)
})

test('network failure (closed port) → network_error, status 0, native cause', async () => {
  const { http: dead } = clientFor(1)
  await assert.rejects(() => dead.get('/ok'), (err) => {
    assert.ok(err instanceof BitgenError)
    assert.equal(err.status, 0)
    assert.equal(err.code, 'network_error')
    assert.ok(err.cause instanceof Error)
    assert.ok(!JSON.stringify(err).includes('cause'))
    return true
  })
})

test('the API key never appears in an error', async () => {
  await assert.rejects(() => http.get('/err-json'), (err) => {
    const dump = `${err.message} ${err.stack} ${JSON.stringify(err)}`
    assert.ok(!dump.includes('secret'))
    return true
  })
})

test('BitgenError serializes with JSON.stringify', () => {
  const err = new BitgenError(416, { error: true, message: 'requested_amount_error', code: 416 })
  assert.deepEqual(JSON.parse(JSON.stringify(err)), { name: 'BitgenError', message: '[416] requested_amount_error', status: 416, code: 'requested_amount_error' })
})

test('instanceof works across the ESM and CommonJS builds', () => {
  assert.notEqual(cjs.BitgenError, BitgenError)
  const fromCjs = new cjs.BitgenError(400, { error: true, message: 'invalid_amount', code: 400 })
  const fromEsm = new BitgenError(400, { error: true, message: 'invalid_amount', code: 400 })
  assert.ok(fromEsm instanceof BitgenError)
  assert.ok(fromEsm instanceof Error)
  assert.ok(fromCjs instanceof BitgenError)
  assert.ok(fromEsm instanceof cjs.BitgenError)
  assert.ok(!(new Error('x') instanceof BitgenError))
  assert.ok(!({ name: 'BitgenError', status: 400, code: 'x' } instanceof BitgenError))
})
