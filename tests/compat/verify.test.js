// `client.webhooks.verify`: signature recomputed with node:crypto on a reference payload (contract § 10).
import { test } from 'node:test'
import assert from 'node:assert/strict'
import { createHmac } from 'node:crypto'
import { BitgenClient, BitgenError, WebhookEventName } from '../../dist/esm/index.js'

const SECRET = 'whsec_topsecret_0123456789'
const client = new BitgenClient({ scope: 'org-uuid', apiKey: 'k' })
const envelope = { delivery_id: 'd-1', timestamp: 1700000000, event: WebhookEventName.CUSTODY_SENT, data: { amount: '0.5' } }
const rawBody = JSON.stringify(envelope)

/** Headers as BITGEN sends them, for `rawBody` at `timestamp` */
function sign(body, timestamp, secret = SECRET) {
  const hex = createHmac('sha256', secret).update(`${timestamp}.`).update(typeof body === 'string' ? Buffer.from(body) : body).digest('hex')
  return { 'X-BITGEN-Timestamp': String(timestamp), 'X-BITGEN-Signature': `sha256=${hex}` }
}
const now = () => Math.floor(Date.now() / 1000)
const rejectsCode = (fn, code) => assert.rejects(fn, (err) => {
  assert.ok(err instanceof BitgenError)
  assert.equal(err.status, 0)
  assert.equal(err.code, code)
  assert.ok(!err.message.includes(SECRET))
  return true
})

test('valid signature → parsed envelope, string or Uint8Array body, any header case', async () => {
  const headers = sign(rawBody, now())
  assert.deepEqual(await client.webhooks.verify({ rawBody, headers, secret: SECRET }), envelope)
  assert.deepEqual(await client.webhooks.verify({ rawBody: new TextEncoder().encode(rawBody), headers, secret: SECRET }), envelope)
  const lower = Object.fromEntries(Object.entries(headers).map(([k, v]) => [k.toLowerCase(), v]))   // Node IncomingHttpHeaders
  assert.deepEqual(await client.webhooks.verify({ rawBody, headers: lower, secret: SECRET }), envelope)
  const arrays = Object.fromEntries(Object.entries(lower).map(([k, v]) => [k, [v]]))
  assert.deepEqual(await client.webhooks.verify({ rawBody, headers: arrays, secret: SECRET }), envelope)
})

test('re-serialized body (different spacing) → invalid_signature', async () => {
  const headers = sign(rawBody, now())
  await rejectsCode(() => client.webhooks.verify({ rawBody: JSON.stringify(envelope, null, 2), headers, secret: SECRET }), 'invalid_signature')
})

test('wrong secret, tampered body, same-length forged signature → invalid_signature', async () => {
  const ts = now()
  await rejectsCode(() => client.webhooks.verify({ rawBody, headers: sign(rawBody, ts, 'other'), secret: SECRET }), 'invalid_signature')
  await rejectsCode(() => client.webhooks.verify({ rawBody: rawBody.replace('0.5', '5.0'), headers: sign(rawBody, ts), secret: SECRET }), 'invalid_signature')
  const forged = { ...sign(rawBody, ts), 'X-BITGEN-Signature': 'sha256=' + 'a'.repeat(64) }
  await rejectsCode(() => client.webhooks.verify({ rawBody, headers: forged, secret: SECRET }), 'invalid_signature')
  await rejectsCode(() => client.webhooks.verify({ rawBody, headers: { ...sign(rawBody, ts), 'X-BITGEN-Signature': 'sha256=short' }, secret: SECRET }), 'invalid_signature')
})

test('missing headers → missing_signature / missing_timestamp', async () => {
  const headers = sign(rawBody, now())
  await rejectsCode(() => client.webhooks.verify({ rawBody, headers: { 'X-BITGEN-Timestamp': headers['X-BITGEN-Timestamp'] }, secret: SECRET }), 'missing_signature')
  await rejectsCode(() => client.webhooks.verify({ rawBody, headers: { 'X-BITGEN-Signature': headers['X-BITGEN-Signature'] }, secret: SECRET }), 'missing_timestamp')
  await rejectsCode(() => client.webhooks.verify({ rawBody, headers: {}, secret: SECRET }), 'missing_signature')
})

test('freshness: 301 s old → timestamp_expired, 299 s → OK, future 301 s → expired, tolerance 0 → no check', async () => {
  await rejectsCode(() => client.webhooks.verify({ rawBody, headers: sign(rawBody, now() - 301), secret: SECRET }), 'timestamp_expired')
  assert.deepEqual(await client.webhooks.verify({ rawBody, headers: sign(rawBody, now() - 299), secret: SECRET }), envelope)
  await rejectsCode(() => client.webhooks.verify({ rawBody, headers: sign(rawBody, now() + 301), secret: SECRET }), 'timestamp_expired')
  assert.deepEqual(await client.webhooks.verify({ rawBody, headers: sign(rawBody, now() - 3600), secret: SECRET, tolerance: 0 }), envelope)
  await rejectsCode(() => client.webhooks.verify({ rawBody, headers: sign(rawBody, now() - 20), secret: SECRET, tolerance: 10 }), 'timestamp_expired')
  // a valid signature over a non-numeric timestamp is still unusable
  await rejectsCode(() => client.webhooks.verify({ rawBody, headers: sign(rawBody, 'yesterday'), secret: SECRET }), 'missing_timestamp')
})

test('valid signature over an invalid JSON or a non-envelope → invalid_payload', async () => {
  const ts = now()
  await rejectsCode(() => client.webhooks.verify({ rawBody: '{not json', headers: sign('{not json', ts), secret: SECRET }), 'invalid_payload')
  const noEvent = JSON.stringify({ delivery_id: 'd', timestamp: 1 })
  await rejectsCode(() => client.webhooks.verify({ rawBody: noEvent, headers: sign(noEvent, ts), secret: SECRET }), 'invalid_payload')
  await rejectsCode(() => client.webhooks.verify({ rawBody: '"str"', headers: sign('"str"', ts), secret: SECRET }), 'invalid_payload')
})

test('argument validation rejects with a TypeError, signature checked before freshness', async () => {
  await assert.rejects(() => client.webhooks.verify({ rawBody, headers: sign(rawBody, now()), secret: '' }), { name: 'TypeError', message: /secret must be/ })
  await assert.rejects(() => client.webhooks.verify({ rawBody, headers: sign(rawBody, now()), secret: SECRET, tolerance: -1 }), { name: 'TypeError', message: /tolerance/ })
  await assert.rejects(() => client.webhooks.verify({ rawBody: { parsed: true }, headers: sign(rawBody, now()), secret: SECRET }), { name: 'TypeError', message: /rawBody must be the received bytes/ })
  await assert.rejects(() => client.webhooks.verify({ rawBody, headers: null, secret: SECRET }), { name: 'TypeError', message: /headers must be an object/ })
  // expired AND badly signed → invalid_signature wins: freshness is never evaluated on an unauthenticated payload
  await rejectsCode(() => client.webhooks.verify({ rawBody, headers: sign(rawBody, now() - 9999, 'other'), secret: SECRET }), 'invalid_signature')
})
