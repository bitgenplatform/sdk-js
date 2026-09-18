# Errors

The API answers with real HTTP status codes and, on failure, a JSON body `{ error: true, message: '<code>', code: <status> }` where `message` is a stable snake_case code (`invalid_amount`, `unknown_asset`…), never a sentence. The SDK turns every non-2xx answer — and every request that gets no HTTP answer at all — into a `BitgenError` that rejects the returned promise.

Examples use `client`, a configured `BitgenClient` ([Configuration](configuration.md)).

## BitgenError

| Property | Type | Description |
|---|---|---|
| `status` | `number` | The HTTP status (`416`…), or `0` when no HTTP response was received |
| `code` | `string` | The stable code of the API (`requested_amount_error`), or the raw response text when the body is not the API's JSON error |
| `message` | `string` | `"[<status>] <code>"` |
| `cause` | `unknown` | The native error, for `network_error` |
| `name` | `string` | `'BitgenError'` |

```ts
import { BitgenError } from '@bitgen/sdk'

try {
  await client.bank.withdraw('CUSTOMER_UUID', { amount: '50.00' })
} catch (err) {
  if (err instanceof BitgenError) {
    console.log(err.status)    // 416
    console.log(err.code)      // 'requested_amount_error'
    console.log(err.message)   // '[416] requested_amount_error'
  }
}
```

`instanceof BitgenError` is reliable even when the ESM and CommonJS builds of the SDK are both loaded in the same process. `JSON.stringify(err)` gives `{ name, message, status, code }` — `cause` is left out.

## No HTTP response

| Status | `code` | Meaning |
|---|---|---|
| `0` | `request_timeout` | No response within the configured `timeout` — 30 seconds by default ([Timeout](configuration.md#timeout)) |
| `0` | `network_error` | The request never got an HTTP answer: DNS, connection refused, TLS… `err.cause` holds the native error |

## Unexpected answers

When the body is not the API's JSON error payload (proxy error page, unexpected `500`…), `code` holds the raw response text, truncated to 200 characters; the same goes for a 2xx answer that is not JSON. A `500` is not always a failure of the API: it is also its answer to a request it does not recognize — with a custom `host`, check that it reaches the API unchanged. Redirects are never followed: a `3xx` answer is reported as a `BitgenError`, and the key is never replayed to another host. A value the SDK enumerates (a `state`, a `mode`…) is never checked: the API may add one, the types keep it as a string ([Constants](concepts.md#constants)).

## Rejected promises

Every method returns a promise. An invalid argument — an empty user, asset, order or amount, a model without uuid, a negative or non-finite number, a `tolerance` that is not a number of seconds… — rejects it with a `TypeError` **before any request is sent**, so `.catch()` and `Promise.all` see every failure. The only synchronous error of the SDK is an invalid configuration, thrown by `new BitgenClient()` ([Validation](configuration.md#validation)).

## Common errors

The errors any call can answer. Each resource page lists its own codes.

| Status | `code` | Meaning |
|---|---|---|
| `401` | `auth_missing` | The `BITGEN-Scope` or `Api-key` header is missing |
| `401` | `api_key_missmatch` | The key is unknown, revoked or expired, or `scope` is not the key's organization |
| `403` | `unknown_organization` | The organization of the key is unknown |
| `403` | `organization_not_enabled` | The organization is not enabled |
| `403` | `api_disabled` | API access is not enabled for the organization |
| `403` | `invalid_api_key` | The key is invalid |
| `403` | `expired_api_key` | The key has expired |
| `403` | `forbidden_permission` | The key does not carry the permission for this call — contact BITGEN |
| `400` | `required_index_missing::<field>` | A mandatory field is missing or empty |
| `404` | `unknown_<resource>` | The target does not exist — `unknown_user`, `unknown_asset`, `unknown_bank`… — or the API does not reveal it |
| `422` | `invalid_<param>` | A boolean filter (`includeClosed`, `includeRevoked`, `includeArchived`) is not a boolean value ([Query booleans](concepts.md#query-booleans)) |
| `423` | `blocked_by_alert` | The customer is under an active compliance alert (each resource page lists its `423` codes, with `account_frozen` and the lock codes) |

Webhook verification has its own codes, with `status: 0`: [Webhooks › verify](resource/webhooks.md#verify).
