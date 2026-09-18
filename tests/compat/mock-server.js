// Shared helpers for the smoke tests: a mock BITGEN API that answers by path and records every
// request, a client probe reaching the protected transport, and a BitgenError assertion.
// Not a test file: only `*.test.js` files are run by `node --test`.
import assert from 'node:assert/strict'
import { createServer } from 'node:http'
import { BitgenClient, BitgenError } from '../../dist/esm/index.js'

/** `[status, payload]` route answering a v4 error body */
export const error = (status, code) => [status, { error: true, message: code, code: status }]

/**
 * Starts a mock API on 127.0.0.1. `routes` maps a pathname to `[status, jsonPayload]` or to a
 * handler `(req, res, rawBody) => void` for anything else (204, text, redirect, hanging…).
 * Unknown paths answer `404 unknown_route`.
 */
export async function startMockApi(routes) {
  const seen = []
  const server = createServer((req, res) => {
    let raw = ''
    req.on('data', (chunk) => (raw += chunk))
    req.on('end', () => {
      seen.push({ method: req.method, url: req.url, headers: req.headers, body: raw })
      const route = routes[new URL(req.url, 'http://mock').pathname] ?? error(404, 'unknown_route')
      if (typeof route === 'function') {
        route(req, res, raw)
        return
      }
      const [status, payload] = route
      res.writeHead(status, { 'content-type': 'application/json' })
      res.end(JSON.stringify(payload))
    })
  })
  await new Promise((resolve) => server.listen(0, '127.0.0.1', resolve))

  return {
    port: server.address().port,
    /** Requests received, in order */
    seen,
    /** The most recent request */
    last: () => seen[seen.length - 1],
    /** Body of the most recent request, parsed */
    lastBody: () => JSON.parse(seen[seen.length - 1].body),
    stop: () => {
      // Drop idle keep-alive sockets so the process exits right away
      server.closeAllConnections()
      server.close()
    },
  }
}

/** Reaches the protected transport (TypeScript-only visibility) */
export class Probe extends BitgenClient {
  get transport() { return this.http }
}

/** Client on a mock API, plus its transport */
export function clientFor(port, config = {}) {
  const client = new Probe({ scope: 'org-uuid', apiKey: 'secret', host: '127.0.0.1', port, isSsl: false, ...config })
  return { client, http: client.transport }
}

/** Asserts that `fn` rejects with a BitgenError carrying `status` and `code` */
export const rejectsWith = (fn, status, code) => assert.rejects(fn, (err) => {
  assert.ok(err instanceof BitgenError, 'BitgenError expected')
  assert.equal(err.name, 'BitgenError')
  assert.equal(err.status, status)
  assert.equal(err.code, code)
  assert.equal(err.message, `[${status}] ${code}`)
  return true
})
