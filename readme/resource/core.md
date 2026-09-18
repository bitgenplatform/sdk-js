# Connectors

A connector — a *core* — is a service the BITGEN platform is plugged into: a bank (`CoreType.RAMP`), an exchange (`CoreType.TRADING`), a custodian (`CoreType.CUSTODY`), a staking provider (`CoreType.STAKING`), an identity verification service (`CoreType.IDENTITY`) or an anti-money-laundering service (`CoreType.AML`). `client.core` reads this catalogue: which connectors exist, their state, and — for staking providers — the asset and the offer they carry. Its main use for an integration is to pick a staking provider ([Staking](staking.md)).

Examples use `client`, a configured `BitgenClient` ([Configuration](../configuration.md)).

## Methods

| Method | What it does | Returns |
|---|---|---|
| `list(params?)` | Lists the connectors of the platform, optionally filtered by type, asset and state | `Page<Core>` |
| `get(core)` | Reads one connector | `Core` |

TypeScript types of this resource, exported by the package: `CoreConfigField`, `Core`, `CoreListParams` — the constants `CoreType`, `CoreState` (also types) — plus the shared `CoreRef`, `AssetRef`, `AssetInput`, `Page`.

The catalogue is managed by BITGEN. Which connectors your organization uses, and their configuration, are set in the BITGEN interface — not through the API.

## list

```
client.core.list(params?: CoreListParams): Promise<Page<Core>>
```

Not paginated: `count` is everything that matches. All the filters are optional and combine.

| Parameter | Type | Description |
|---|---|---|
| `params.type` | `CoreType` | `CoreType.IDENTITY`, `AML`, `TRADING`, `CUSTODY`, `STAKING` or `RAMP` — anything else → `424 unknown_core_type` |
| `params.asset` | `AssetInput` | Only the connectors attached to this asset (the `CoreType.STAKING` ones), by uuid or ISO code (`Asset.ETH`) or by model ([Assets](../concepts.md#assets)) — unknown → `404 unknown_asset` |
| `params.state` | `CoreState` | `CoreState.ENABLED` or `CoreState.DISABLED` — anything else → `400 invalid_core_status` |

```ts
import { Asset, CoreState, CoreType } from '@bitgen/sdk'

const banks = await client.core.list({ type: CoreType.RAMP })
const exchanges = await client.core.list({ type: CoreType.TRADING })
const custodians = await client.core.list({ type: CoreType.CUSTODY })
const providers = await client.core.list({ type: CoreType.STAKING, asset: Asset.ETH })   // the staking providers of ETH

for (const provider of providers.items) {
  console.log(provider.name, provider.asset?.iso, provider.state === CoreState.ENABLED)   // 'bitgen_eth' 'ETH' true
}
```

Returns the matching `Core` connectors ([get](#get)).

## get

```
client.core.get(core: string | Core): Promise<Core>
```

`core` is the uuid of the connector, or a `Core` of `list()`.

```ts
const core = await client.core.get('CORE_UUID')

for (const field of core.config) {
  console.log(field.name, field.data.value)   // 'min_deposit' …
}
```

Returns a `Core`:

| Field | Description |
|---|---|
| `uuid` | The connector |
| `state` | `CoreState.ENABLED` or `CoreState.DISABLED` |
| `name` | The identifier of the connector — for a `CoreType.STAKING` connector, `<provider>_<iso>` (`figment_sol`, `bitgen_eth`) |
| `label` | Display name |
| `type` | `CoreType.IDENTITY`, `AML`, `TRADING`, `CUSTODY`, `STAKING` or `RAMP` |
| `asset` | `AssetRef`: `{ uuid, iso, label }` for a `CoreType.STAKING` connector (derived from its `name`), `null` for the other types |
| `config` | The configuration schema of the connector, a list of `CoreConfigField`: `name` (key), `label` (display names `{ fr, en }`), `data.type` (`string`, `int`, `bool`, `password` or `webhook`), `data.value` (the value — empty for secrets). The secrets of your organization's configuration never appear here. |

An unknown uuid answers `404 unknown_core`.

## Errors

In addition to the [common errors](../errors.md#common-errors):

| Status | `code` | Meaning |
|---|---|---|
| `400` | `invalid_core_status` | `state` is neither `CoreState.ENABLED` nor `CoreState.DISABLED` |
| `404` | `unknown_asset` | `list`: unknown `asset` |
| `404` | `unknown_core` | `get`: unknown connector |
| `424` | `unknown_core_type` | `type` is not one of the connector types |

## Related

- [Staking](staking.md) — `client.staking.providers` is `list` filtered on `CoreType.STAKING`; a `StakingPosition` carries its provider as a `CoreRef`
- [Assets](../concepts.md#assets) — uuid or ISO code, case
