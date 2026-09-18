# Webhooks

BITGEN pushes the events of your organization — a customer created, an identity validated, a deposit credited, a withdrawal sent, an order executed, a compliance alert… — to an HTTPS endpoint of yours, each delivery signed with a secret shared with you. `client.webhooks` sets up that endpoint and its secret, subscribes your organization to the events of the catalogue, reads the delivery logs, and verifies the deliveries your endpoint receives with `verify`.

Examples use `client`, a configured `BitgenClient` ([Configuration](../configuration.md)). Wherever the API expects your organization, the SDK sends the `scope` of the client.

## Methods

| Method | What it does | Returns |
|---|---|---|
| `activate(params)` | Activates the webhooks of your organization: sets the endpoint, generates the secret | `void` |
| `updateEndpoint(params)` | Changes the endpoint | `void` |
| `regenerate()` | Generates a new secret | `void` |
| `list(params?)` | Reads the secret, the endpoint and the subscriptions of your organization | `WebhookSubscriptions` |
| `subscribe(event)` | Subscribes your organization to an event of the catalogue | `Created` (the subscription) |
| `archive(subscriber)` | Archives a subscription: the event is no longer delivered | `void` |
| `reactivate(subscriber)` | Reactivates an archived subscription | `void` |
| `logs(subscriber, params?)` | Lists the delivery attempts of a subscription | `Page<DeliveryLog>` |
| `catalog()` | Lists the events of the catalogue | `Page<WebhookType>` |
| `catalogItem(webhook)` | Reads one event of the catalogue | `WebhookType` |
| `verify(input)` | Verifies a delivery received by your endpoint and returns its envelope | `WebhookEvent` |

TypeScript types of this resource, exported by the package: `WebhookType`, `Subscriber`, `WebhookSubscriptions`, `DeliveryLog`, `WebhookEvent`, `VerifyInput` — the constants `WebhookEventName`, `SubscriberState` (also types) — plus the shared `Created`, `PageParams`.

## activate

```
client.webhooks.activate(params: { endpoint: string }): Promise<void>
```

| Parameter | Type | Description |
|---|---|---|
| `params.endpoint` | `string` | The URL BITGEN will deliver the events to — `https://` is added when the scheme is missing; `http://` is refused outside a local environment |

```ts
await client.webhooks.activate({ endpoint: 'https://example.com/bitgen' })

const { secret } = await client.webhooks.list()   // the initial secret is read with list(): keep it server-side for `verify`
```

Activation generates the secret of your organization. `activate` does not return it: the API returns the current secret in `list()` (`secret` field, next to `endpoint` and the subscriptions). Once active, a second activation answers `429 webhook_security_already_enabled`. The API answers with an empty body: the promise resolves with `undefined`.

## updateEndpoint

```
client.webhooks.updateEndpoint(params: { endpoint: string }): Promise<void>
```

| Parameter | Type | Description |
|---|---|---|
| `params.endpoint` | `string` | The new URL — same rules as `activate` |

```ts
await client.webhooks.updateEndpoint({ endpoint: 'https://example.com/bitgen/v2' })
```

Before activation, the API answers `404 unknown_webhook_security`. The promise resolves with `undefined`.

## regenerate

```
client.webhooks.regenerate(): Promise<void>
```

```ts
await client.webhooks.regenerate()                // 1. a new secret is created — it is not returned

const { secret } = await client.webhooks.list()   // 2. the new secret — configure your receiving endpoint with it, the previous one stops validating immediately
```

`regenerate()` creates a new secret but does not return it: the API returns the current secret in `list()` (`secret` field, next to `endpoint` and the subscriptions). The deliveries are signed with the new one from then on, the previous one stops validating immediately. Before activation, the API answers `404 unknown_webhook_security`. The promise resolves with `undefined`.

## list

```
client.webhooks.list(params?: { includeArchived?: boolean }): Promise<WebhookSubscriptions>
```

| Parameter | Type | Description |
|---|---|---|
| `params.includeArchived` | `boolean` | Also returns the `SubscriberState.ARCHIVED` subscriptions — default `false` ([Query booleans](../concepts.md#query-booleans)) |

```ts
import { SubscriberState } from '@bitgen/sdk'

const { secret, endpoint, items } = await client.webhooks.list({ includeArchived: true })

for (const subscription of items) {
  console.log(subscription.webhook.name, subscription.state === SubscriberState.ENABLED)   // 'custody.sent' true
}
```

Returns a `WebhookSubscriptions`:

| Field | Description |
|---|---|
| `secret` | The secret of your organization, for `verify` |
| `endpoint` | The URL the events are delivered to |
| `items` | The subscriptions (`Subscriber`): `uuid`, `state` (`SubscriberState.ENABLED` or `SubscriberState.ARCHIVED`), `updatedAt` (epoch seconds), `webhook` (the event of the catalogue: `uuid`, `state` (a `SubscriberState` too), `name`, `label` — its display names, a raw JSON string `{"fr": "…", "en": "…"}` — and `data`, internal) |

Before activation, the API answers `404 unknown_webhook_security`.

## subscribe

```
client.webhooks.subscribe(event: string | WebhookType): Promise<Created>
```

| Parameter | Type | Description |
|---|---|---|
| `event` | `string` or `WebhookType` | The event, by name (`WebhookEventName.CUSTODY_SENT`), by uuid of the catalogue, or by the `WebhookType` of `catalog()` |

```ts
import { WebhookEventName } from '@bitgen/sdk'

const { uuid } = await client.webhooks.subscribe(WebhookEventName.CUSTODY_SENT)
```

Returns a `Created` — the uuid of the subscription, for `archive`, `reactivate` and `logs`. A subscription that already exists answers `409 webhook_subscription_already_exists`; an unknown event, `404 unknown_webhook`. The events of the catalogue:

| Family | Events |
|---|---|
| Customers | `user.created`, `user.identity.started`, `user.identity.pending`, `user.identity.step.validated`, `user.identity.step.rejected`, `user.identity.step.requested`, `user.identity.validated`, `user.identity.renew`, `user.identity.request` |
| Organizations | `organization.created`, `organization.identity.started`, `organization.identity.pending`, `organization.identity.step.validated`, `organization.identity.step.rejected`, `organization.identity.step.requested`, `organization.identity.validated`, `organization.identity.renew`, `organization.identity.request` |
| Bank | `bank.credited`, `bank.debited`, `bank.transaction` |
| Custody | `custody.transaction`, `custody.wallet.created`, `custody.sent`, `custody.received` |
| Trading | `trading.buy`, `trading.sell` |
| Staking | `staking.requested`, `staking.status`, `staking.rewards`, `staking.claimed` |
| Compliance | `alert.opened`, `alert.status` |

The `WebhookEventName` constant carries these names — `WebhookEventName.CUSTODY_SENT` for `custody.sent`, `USER_IDENTITY_STEP_VALIDATED` for `user.identity.step.validated`… — and as a type it also accepts any other string, since the catalogue may grow ([Constants](../concepts.md#constants)).

## archive

```
client.webhooks.archive(subscriber: string | Subscriber): Promise<void>
```

`subscriber` is the uuid returned by `subscribe`, or a `Subscriber` of `list()`.

```ts
await client.webhooks.archive('SUBSCRIBER_UUID')
```

The subscription becomes `SubscriberState.ARCHIVED`: the event is no longer delivered. An unknown subscription answers `404 unknown_webhook_subscriber`. The promise resolves with `undefined`.

## reactivate

```
client.webhooks.reactivate(subscriber: string | Subscriber): Promise<void>
```

`subscriber` is the uuid returned by `subscribe`, or a `Subscriber` of `list({ includeArchived: true })`.

```ts
await client.webhooks.reactivate('SUBSCRIBER_UUID')
```

The subscription becomes `SubscriberState.ENABLED` again. An unknown subscription answers `404 unknown_webhook_subscriber`. The promise resolves with `undefined`.

## logs

```
client.webhooks.logs(subscriber: string | Subscriber, params?: PageParams): Promise<Page<DeliveryLog>>
```

`subscriber` is the uuid returned by `subscribe`, or a `Subscriber` of `list()`.

| Parameter | Type | Description |
|---|---|---|
| `params.offset`, `params.limit` | `number` | [Pagination](../concepts.md#pagination) |

```ts
const { count, items } = await client.webhooks.logs('SUBSCRIBER_UUID', { offset: 0, limit: 50 })

for (const delivery of items) {
  console.log(delivery.date, delivery.http_code, delivery.attempts)   // 1701000000 204 1
}
```

Returns a page of `DeliveryLog`: `date` (epoch seconds), `webhook` (the event name), `url` (the endpoint called), `status` (`SENT` or `FAILED` for that attempt), `http_code` (the status your endpoint answered, or `null`), `duration_ms` (or `null`), `attempts` (attempt number), `payload` (the delivered body), `error` (failure reason, `null` on success).

## catalog

```
client.webhooks.catalog(): Promise<Page<WebhookType>>
```

```ts
import { SubscriberState } from '@bitgen/sdk'

const { items } = await client.webhooks.catalog()

for (const type of items) {
  console.log(type.name, type.state === SubscriberState.ENABLED)   // 'custody.sent' true
}
```

Returns every event of the catalogue, `SubscriberState.ARCHIVED` ones included, as `WebhookType`: `uuid`, `state` (`SubscriberState.ENABLED` or `SubscriberState.ARCHIVED`), `name`, `label` (its display names, a raw JSON string `{"fr": "…", "en": "…"}`), `data` (internal, a raw JSON string).

## catalogItem

```
client.webhooks.catalogItem(webhook: string | WebhookType): Promise<WebhookType>
```

`webhook` is the uuid of the event, or a `WebhookType` of `catalog()`.

```ts
const type = await client.webhooks.catalogItem('WEBHOOK_UUID')
```

Returns one `WebhookType`; an unknown uuid answers `404 unknown_webhook`.

## verify

```
client.webhooks.verify(input: VerifyInput): Promise<WebhookEvent>
```

No request: the verification runs locally, with the secret of your organization.

Each delivery is a `POST` to your endpoint, with `Content-Type: application/json`, a JSON body `{ delivery_id, timestamp, event, data }` and two headers:

| Header | Content |
|---|---|
| `X-BITGEN-Timestamp` | The time of the delivery, epoch seconds |
| `X-BITGEN-Signature` | `sha256=<hex>`, where `hex = HMAC_SHA256(secret, "<timestamp>.<rawBody>")` |

Answer with a 2xx status: a delivery that does not get one is retried 4 times (after 60 s, 5 min, 15 min and 1 h).

| Parameter | Type | Description |
|---|---|---|
| `input.rawBody` | `string` or `Uint8Array` | The body exactly as received — the bytes, never a re-serialized JSON |
| `input.headers` | `Record<string, string \| string[] \| undefined>` | The headers as received (Node's `IncomingHttpHeaders`); names are matched case-insensitively |
| `input.secret` | `string` | The secret of your organization (`list().secret`) |
| `input.tolerance` | `number` | Optional: the maximum distance, in seconds, between now and the timestamp of the delivery — `300` by default, `0` disables the check |

```ts
import { createServer } from 'node:http'
import { BitgenClient, BitgenError, WebhookEventName } from '@bitgen/sdk'

const client = new BitgenClient({ scope: 'YOUR_SCOPE_UUID', apiKey: 'YOUR_API_KEY' })
const { secret } = await client.webhooks.list()

createServer((req, res) => {
  const chunks: Buffer[] = []
  req.on('data', (chunk: Buffer) => chunks.push(chunk))
  req.on('end', async () => {
    try {
      const event = await client.webhooks.verify({ rawBody: Buffer.concat(chunks), headers: req.headers, secret })
      if (event.event === WebhookEventName.CUSTODY_SENT) {
        // event.data is `unknown`: its shape depends on the event
      }
      res.writeHead(204).end()
    } catch (err) {
      res.writeHead(err instanceof BitgenError ? 400 : 500).end()
    }
  })
}).listen(8080)
```

`verify` recomputes the signature on the raw bytes, compares it with `X-BITGEN-Signature` in constant time, checks `X-BITGEN-Timestamp` against `tolerance`, and only then parses the body. The SDK is stateless: a delivery may be replayed within the freshness window and verify again — an endpoint that wants to ignore a replay deduplicates on `delivery_id` on its side. It returns the envelope, a `WebhookEvent`:

| Field | Description |
|---|---|
| `delivery_id` | The delivery |
| `timestamp` | The time of the delivery, epoch seconds |
| `event` | The event name (`WebhookEventName`) — compare it with the constant |
| `data` | The payload of the event — typed `unknown`: its shape depends on the event |

A delivery that fails the verification rejects the promise with a `BitgenError` whose `status` is `0` and whose `code` is one of:

| `code` | Meaning |
|---|---|
| `missing_signature` | No `X-BITGEN-Signature` header |
| `invalid_signature` | The signature does not match the body and the secret |
| `missing_timestamp` | No `X-BITGEN-Timestamp` header, or not a number |
| `timestamp_expired` | The timestamp of the delivery is more than `tolerance` seconds away from now |
| `invalid_payload` | The body is not the JSON envelope |

An `input` that is not usable — a `rawBody` that is neither a string nor bytes, `headers` that are not an object, an empty `secret`, a `tolerance` that is not a number of seconds — rejects with a `TypeError` ([Rejected promises](../errors.md#rejected-promises)).

## Errors

In addition to the [common errors](../errors.md#common-errors):

| Status | `code` | Meaning |
|---|---|---|
| `0` | `missing_signature`, `invalid_signature`, `missing_timestamp`, `timestamp_expired`, `invalid_payload` | `verify`: the delivery fails the verification ([verify](#verify)) |
| `400` | `webhook_security_https_required` | `activate`, `updateEndpoint`: an `http://` endpoint outside a local environment |
| `404` | `unknown_webhook_security` | The webhooks of your organization are not activated |
| `404` | `unknown_webhook` | Unknown event |
| `404` | `unknown_webhook_subscriber` | Unknown subscription |
| `409` | `webhook_subscription_already_exists` | `subscribe`: your organization is already subscribed to this event |
| `412` | `organization_not_enabled` | Your organization is closed |
| `422` | `invalid_include_archived` | `includeArchived` is not a boolean value |
| `429` | `webhook_security_already_enabled` | `activate`: the webhooks are already active |

## Related

- [Errors](../errors.md) — `BitgenError`, `status: 0`
- [Customers](customer.md) — `user.created`, `user.identity.*`
- [Bank accounts](bank.md) — `bank.credited`, `bank.debited`, `bank.transaction`
- [Custody wallets](custody.md) — `custody.wallet.created`, `custody.received`, `custody.sent`, `custody.transaction`
- [Trading](trading.md) — `trading.buy`, `trading.sell`
- [Staking](staking.md) — `staking.requested`, `staking.status`, `staking.rewards`, `staking.claimed`
