# Configuration

A `BitgenClient` is built once per API key and reused: it holds the credentials, the target environment and the request timeout. Every resource hangs off it (`client.customer`, `client.bank`, `client.custody`…).

```ts
import { BitgenClient, Env } from '@bitgen/sdk'

const client = new BitgenClient({
  scope: 'YOUR_SCOPE_UUID',
  apiKey: 'YOUR_API_KEY',
  env: Env.PRODUCTION,   // default
  timeout: 30,           // seconds, default 30
})
```

## Credentials

| Option | Description |
|---|---|
| `scope` | uuid of the organization that owns the key. Sent as the `BITGEN-Scope` header. It is also the organization the SDK uses wherever the API expects yours (webhooks, API keys, the organization of a new customer). |
| `apiKey` | The raw key, shown once when it is created. Sent as the `Api-key` header. |

A missing key, an unknown, revoked or expired key, or a `scope` that is not the key's organization, is refused with a `401` ([Common errors](errors.md#common-errors)).

## Environments

| `env` | Constant | URL |
|---|---|---|
| `production` | `Env.PRODUCTION` (default) | `https://api.bitgen.com` |
| `sandbox` | `Env.SANDBOX` | `https://api.sandbox.bitgen.com` |

`Env` holds these names as a frozen object (`Object.values(Env)` lists them): pass the constant — the type of its values is `BitgenEnv`. Anything else is refused before any request ([Validation](#validation), [Constants](concepts.md#constants)).

## Custom host

To reach the API through another hostname — a container, a tunnel — give `host` instead of `env`:

```ts
const client = new BitgenClient({
  scope: 'YOUR_SCOPE_UUID',
  apiKey: 'YOUR_API_KEY',
  host: 'my-hostname',   // bare hostname: no scheme, port or path
  port: 8080,             // default 80
  isSsl: false,           // default true (https)
})
```

## Timeout

`timeout` is the maximum time, in seconds, the SDK waits for the API to answer: `30` by default, `0` disables it. When it expires, the call rejects with `BitgenError { status: 0, code: 'request_timeout' }` ([No HTTP response](errors.md#no-http-response)).

## Requests

Every request carries the headers `BITGEN-Scope`, `Api-key`, `Content-Type: application/json` and `User-Agent: bitgen-sdk-nodejs/<version>`, where `<version>` is the installed version of the SDK. Redirects are never followed.

## Validation

An invalid configuration throws a `TypeError` from the constructor, before any request is sent: empty `scope` or `apiKey` (or one that is not printable ASCII), `env` that is not one of `Env`, `host` that is not a bare hostname (letters, digits, `.`, `-` and `_` only — no scheme, port, path, credentials or brackets), `port` outside 1–65535, `timeout` that is not a number of seconds between `0` and `2_147_483`. The values of `scope`, `apiKey` and `env` never appear in the message. This is the only synchronous error of the SDK: everything else rejects a promise ([Rejected promises](errors.md#rejected-promises)).

## Options

`BitgenConfig`:

| Option | Type | Default | Description |
|---|---|---|---|
| `scope` | `string` | — | Organization uuid |
| `apiKey` | `string` | — | API key |
| `env` | `BitgenEnv` | `Env.PRODUCTION` | Target environment — an `Env` constant |
| `host` | `string` | — | Custom hostname, used instead of `env` |
| `port` | `number` | `80` | Port, with `host` |
| `isSsl` | `boolean` | `true` | `https` or `http`, with `host` |
| `timeout` | `number` | `30` | Request timeout in seconds, `0` = none |
