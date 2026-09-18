export type { WebhookEventName, SubscriberState } from '../constants.js'
import type { WebhookEventName, SubscriberState } from '../constants.js'

/** An event of the catalogue (`GET /webhook`) */
export interface WebhookType {
  uuid: string
  state: SubscriberState
  name: string
  /** Raw JSON `{"fr": "…", "en": "…"}` */
  label: string
  /** Raw JSON */
  data: string
}

/** A subscription of the organization to an event */
export interface Subscriber {
  uuid: string
  state: SubscriberState
  updatedAt: number
  webhook: WebhookType
}

/** `GET /webhooks/{organization}` — the HMAC secret, the endpoint and the subscriptions */
export interface WebhookSubscriptions {
  secret: string
  endpoint: string
  items: Subscriber[]
}

/** One delivery attempt of a subscription (`GET /webhooks/{subscriber}/logs`) */
export interface DeliveryLog {
  date: number
  webhook: string
  url: string
  status: string
  http_code: number | null
  duration_ms: number | null
  attempts: number
  payload: Record<string, unknown>
  error: string | null
}

/** Envelope delivered to the endpoint — `data` depends on the event */
export interface WebhookEvent {
  delivery_id: string
  timestamp: number
  event: WebhookEventName
  data: unknown
}

export interface VerifyInput {
  /** The bytes received, never a re-serialized JSON */
  rawBody: string | Uint8Array
  /** Headers as received (Node `IncomingHttpHeaders`) — names are matched case-insensitively */
  headers: Record<string, string | string[] | undefined>
  /** The organization's secret, from `list().secret` */
  secret: string
  /** Seconds, default 300 — `0` disables the freshness check */
  tolerance?: number
}
