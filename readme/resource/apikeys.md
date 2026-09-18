# API keys

An API key belongs to your organization: it is valid until it expires or is revoked, and every call made with it is journaled. `client.apikeys` reads the keys of your organization and the journal of their calls — it is read-only: a key cannot be created through the API, and the SDK does not revoke.

Examples use `client`, a configured `BitgenClient` ([Configuration](../configuration.md)). Wherever the API expects your organization, the SDK sends the `scope` of the client.

## Methods

| Method | What it does | Returns |
|---|---|---|
| `list(params?)` | Lists the keys of your organization | `Page<Apikey>` |
| `get(apikey)` | Reads one key | `Apikey` |
| `logs(apikey, params?)` | Lists the calls made with a key | `Page<ApikeyLog>` |

TypeScript types of this resource, exported by the package: `Apikey`, `ApikeyLog`, `ApikeyListParams` — the constant `ApikeyState` (also a type) — plus the shared `PageParams`.

## list

```
client.apikeys.list(params?: ApikeyListParams): Promise<Page<Apikey>>
```

| Parameter | Type | Description |
|---|---|---|
| `params.offset`, `params.limit` | `number` | [Pagination](../concepts.md#pagination) |
| `params.includeRevoked` | `boolean` | Also returns the `ApikeyState.REVOKED` keys — default `false` ([Query booleans](../concepts.md#query-booleans)) |

```ts
import { ApikeyState } from '@bitgen/sdk'

const { count, items } = await client.apikeys.list({ includeRevoked: true })

for (const key of items) {
  console.log(key.name, key.state === ApikeyState.ENABLED, key.expireAt)   // 'backend' true 1735689600
}
```

Returns a page of `Apikey` ([get](#get)).

## get

```
client.apikeys.get(apikey: string | Apikey): Promise<Apikey>
```

`apikey` is the uuid of the key, or an `Apikey` of `list()`.

```ts
import { ApikeyState } from '@bitgen/sdk'

const key = await client.apikeys.get('APIKEY_UUID')

console.log(key.state === ApikeyState.ENABLED, new Date(key.expireAt * 1000))   // true 2025-01-01T00:00:00.000Z
```

Returns an `Apikey`:

| Field | Description |
|---|---|
| `uuid` | The key |
| `state` | `ApikeyState.ENABLED` or `ApikeyState.REVOKED` |
| `name` | Label given at creation |
| `permissions` | What the key is allowed to do, as set by BITGEN |
| `expireAt`, `createdAt` | Epoch seconds |
| `organization` | `{ uuid, state, name, hub, owner }` — `hub` is `{ uuid, state, name, options }` or `null` (`options`: internal), `owner` is the owner of the organization, `{ uuid, login, firstname, lastname }` or `null` |

An unknown uuid answers `404 unknown_apikey`. The raw key itself is never returned: it is shown once, when the key is created.

## logs

```
client.apikeys.logs(apikey: string | Apikey, params?: PageParams): Promise<Page<ApikeyLog>>
```

`apikey` is the uuid of the key, or an `Apikey` of `list()`.

| Parameter | Type | Description |
|---|---|---|
| `params.offset`, `params.limit` | `number` | [Pagination](../concepts.md#pagination) |

```ts
const { count, items } = await client.apikeys.logs('APIKEY_UUID', { offset: 0, limit: 50 })

for (const call of items) {
  console.log(call.date, call.path, call.status, call.error)   // 1701000000 'GET /custody/…' 200 null
}
```

Returns a page of `ApikeyLog`, one entry per call made with the key: `date` (epoch seconds), `path` (`"GET /custody/…"`), `payload` (the inputs of the call as a JSON string, personal data masked), `status` (the HTTP status answered), `error` (response body of the failed call, `null` when the call succeeded).

## Errors

In addition to the [common errors](../errors.md#common-errors):

| Status | `code` | Meaning |
|---|---|---|
| `404` | `unknown_apikey` | Unknown key |
| `422` | `invalid_include_revoked` | `includeRevoked` is not a boolean value |

## Related

- [Configuration](../configuration.md#credentials) — `scope` and `apiKey`
- [Errors](../errors.md#common-errors) — a missing, unknown, revoked or expired key
