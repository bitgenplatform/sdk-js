import { createHmac, timingSafeEqual } from 'node:crypto'
import { BitgenError } from '../error.js'
import type { HttpClient } from '../http.js'
import type {
  Created,
  DeliveryLog,
  Page,
  PageParams,
  Subscriber,
  VerifyInput,
  WebhookEvent,
  WebhookSubscriptions,
  WebhookType,
} from '../types/index.js'
import { idOf, pathSegment } from '../utils.js'

/** Default freshness window of `verify`, in seconds */
const DEFAULT_TOLERANCE = 300

/**
 * `/webhook`, `/webhooks` — permissions `webhooks.admin`, `webhooks.write`, `webhooks.read`, `webhook.read`.
 * Wherever the API expects `{organization}`, the SDK sends the key's scope.
 */
export class WebhooksResource {
  constructor(private readonly http: HttpClient) {}

  /** Activate the security (generates the HMAC secret) with the endpoint to deliver to — `https://` is added when the scheme is missing */
  async activate(params: { endpoint: string }): Promise<void> {
    await this.http.post(`/webhook/security/${this.organization()}/activate`, { endpoint: params.endpoint })
  }

  /** Change the delivery endpoint */
  async updateEndpoint(params: { endpoint: string }): Promise<void> {
    await this.http.patch(`/webhook/security/${this.organization()}`, { endpoint: params.endpoint })
  }

  /** Generate a new secret — read it with `list()` */
  async regenerate(): Promise<void> {
    await this.http.patch(`/webhook/security/${this.organization()}/regenerate`)
  }

  /** The secret, the endpoint and the subscriptions of the organization */
  async list(params: { includeArchived?: boolean } = {}): Promise<WebhookSubscriptions> {
    return await this.http.get(`/webhooks/${this.organization()}`, { ...params })
  }

  /** Subscribe the organization to an event of the catalogue — by name (`WebhookEventName.CUSTODY_SENT`), by uuid, or as a `WebhookType` of the catalogue (its uuid is sent) */
  async subscribe(event: string | WebhookType): Promise<Created> {
    return await this.http.post('/webhooks', { organization: this.http.scope, event: idOf(event, 'event') })
  }

  /** Archive a subscription, by uuid or as the `Subscriber` of `list()` */
  async archive(subscriber: string | Subscriber): Promise<void> {
    await this.http.delete(`/webhooks/${pathSegment(idOf(subscriber, 'subscriber'), 'subscriber')}`)
  }

  /** Reactivate an archived subscription, by uuid or as the `Subscriber` of `list()` */
  async reactivate(subscriber: string | Subscriber): Promise<void> {
    await this.http.post(`/webhooks/${pathSegment(idOf(subscriber, 'subscriber'), 'subscriber')}`)
  }

  /** Delivery attempts of a subscription, by uuid or as the `Subscriber` of `list()` */
  async logs(subscriber: string | Subscriber, params: PageParams = {}): Promise<Page<DeliveryLog>> {
    return await this.http.get(`/webhooks/${pathSegment(idOf(subscriber, 'subscriber'), 'subscriber')}/logs`, { ...params })
  }

  /** The catalogue of events, all states */
  async catalog(): Promise<Page<WebhookType>> {
    return await this.http.get('/webhook')
  }

  /** One event of the catalogue, by uuid or by model */
  async catalogItem(webhook: string | WebhookType): Promise<WebhookType> {
    return await this.http.get(`/webhook/${pathSegment(idOf(webhook, 'webhook'), 'webhook')}`)
  }

  /**
   * Verify a delivery received by your endpoint and return its envelope. Recomputes
   * `HMAC_SHA256(secret, "<timestamp>.<rawBody>")` on the raw bytes, compares it with
   * `X-BITGEN-Signature` in constant time, checks `X-BITGEN-Timestamp` against `tolerance`, then
   * parses the JSON. Rejects with `BitgenError { status: 0, code }` — `missing_signature`,
   * `invalid_signature`, `missing_timestamp`, `timestamp_expired`, `invalid_payload`.
   */
  // eslint-disable-next-line @typescript-eslint/require-await -- same rejection channel as every method, the work itself is synchronous
  async verify(input: VerifyInput): Promise<WebhookEvent> {
    return verifyDelivery(input)
  }

  private organization(): string {
    return pathSegment(this.http.scope, 'scope')
  }
}

function verifyDelivery(input: VerifyInput): WebhookEvent {
  if (typeof input.rawBody !== 'string' && !(input.rawBody instanceof Uint8Array)) {
    throw new TypeError('rawBody must be the received bytes: a string or a Uint8Array (Buffer)')
  }
  if (typeof input.headers !== 'object' || input.headers === null) {
    throw new TypeError('headers must be an object of the received headers')
  }
  if (typeof input.secret !== 'string' || input.secret === '') {
    throw new TypeError('secret must be a non-empty string')
  }
  const tolerance = input.tolerance ?? DEFAULT_TOLERANCE
  if (typeof tolerance !== 'number' || !Number.isFinite(tolerance) || tolerance < 0) {
    throw new TypeError('tolerance must be a number of seconds >= 0')
  }

  const signature = header(input.headers, 'x-bitgen-signature')
  if (signature === undefined || signature === '') {
    throw fail('missing_signature')
  }
  const timestamp = header(input.headers, 'x-bitgen-timestamp')
  if (timestamp === undefined || timestamp === '') {
    throw fail('missing_timestamp')
  }

  // Signature first: nothing else is trusted before it matches
  const body = typeof input.rawBody === 'string' ? Buffer.from(input.rawBody, 'utf8') : Buffer.from(input.rawBody)
  const expected = Buffer.from(`sha256=${createHmac('sha256', input.secret).update(`${timestamp}.`).update(body).digest('hex')}`)
  const given = Buffer.from(signature.trim().toLowerCase())
  if (given.length !== expected.length || !timingSafeEqual(given, expected)) {
    throw fail('invalid_signature')
  }

  const issuedAt = Number(timestamp)
  if (!Number.isFinite(issuedAt)) {
    throw fail('missing_timestamp')
  }
  if (tolerance > 0 && Math.abs(Date.now() / 1000 - issuedAt) > tolerance) {
    throw fail('timestamp_expired')
  }

  return parseEnvelope(body)
}

/** Case-insensitive header lookup; a multi-valued header keeps its first value */
function header(headers: VerifyInput['headers'], name: string): string | undefined {
  for (const [key, value] of Object.entries(headers)) {
    if (key.toLowerCase() === name) {
      return Array.isArray(value) ? value[0] : value
    }
  }
  return undefined
}

function parseEnvelope(body: Buffer): WebhookEvent {
  let data: unknown
  try {
    data = JSON.parse(body.toString('utf8'))
  } catch {
    throw fail('invalid_payload')
  }
  if (
    typeof data !== 'object' || data === null ||
    typeof (data as { delivery_id?: unknown }).delivery_id !== 'string' ||
    typeof (data as { timestamp?: unknown }).timestamp !== 'number' ||
    typeof (data as { event?: unknown }).event !== 'string' ||
    !('data' in data)
  ) {
    throw fail('invalid_payload')
  }
  return data as WebhookEvent
}

/** Verification failure — no HTTP status, and never the secret in the message */
function fail(code: string): BitgenError {
  return new BitgenError(0, { error: true, message: code, code: 0 })
}
