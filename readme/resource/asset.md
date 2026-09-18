# Assets

The assets are the crypto currencies and tokens of the BITGEN platform, each on its network, with its decimals, its fees, a live ticker and its EUR price history. `client.asset` reads this catalogue: which assets exist and are `AssetState.AVAILABLE`, how many decimals an amount may carry, and the prices.

Examples use `client`, a configured `BitgenClient` ([Configuration](../configuration.md)). An asset is designated by its uuid or its ISO code, in any case, or by a model carrying its uuid ([Assets](../concepts.md#assets)).

## Methods

| Method | What it does | Returns |
|---|---|---|
| `list()` | Lists the assets of the platform | `Page<Asset>` |
| `get(asset)` | Reads one asset | `Asset` |
| `tickers()` | Reads the ticker of every asset | `Page<{ iso, ticker }>` |
| `ticker(iso)` | Reads the ticker and the EUR price history of one asset | `{ iso, ticker, history }` |

TypeScript types of this resource, exported by the package: `AssetTicker`, `AssetFees`, `AssetNetworkType`, `AssetNetwork`, `Asset` — the constants `AssetState` (also a type) and `Asset` (the ISO codes, a value only: the `Asset` type is the model) — plus the shared `AssetRef`, `AssetInput`, `History`.

## list

```
client.asset.list(): Promise<Page<Asset>>
```

```ts
import { AssetState } from '@bitgen/sdk'

const { count, items } = await client.asset.list()

const available = items.filter((asset) => asset.state === AssetState.AVAILABLE)
for (const asset of available) {
  console.log(asset.iso, asset.label, asset.baseUnit)   // 'ETH' 'Ethereum' 18
}
```

Returns a page of `Asset` ([get](#get)).

## get

```
client.asset.get(asset: AssetInput): Promise<Asset>
```

`asset` is the uuid or the ISO code of the asset (`Asset.ETH`), or a model carrying its uuid — an `AssetRef` such as `wallet.asset`.

```ts
import { Asset, AssetState } from '@bitgen/sdk'

const eth = await client.asset.get(Asset.ETH)

console.log(eth.state === AssetState.AVAILABLE, eth.baseUnit, eth.ticker.price)   // true 18 2031.5
```

Returns an `Asset`:

| Field | Description |
|---|---|
| `uuid` | The asset |
| `state` | `AssetState.AVAILABLE`, `UNAVAILABLE`, `ARCHIVED` or `HIDDEN` |
| `iso` | The ISO code, with the case it is stored with (`ETH`) — compare it case-insensitively |
| `label` | Display name (`Bitcoin`) |
| `contractAddress` | The contract address of a token — `''` for a native asset, never `null` |
| `baseUnit` | The decimals of the asset (18 by default, 24 at most): the precision amounts may carry |
| `gasUnit` | Gas units consumed by a transfer of this asset on its network; with the network's `gasBase`, it sizes the network fee |
| `logo` | The logo as a data URI (SVG), or `null` |
| `data` | Internal connector mapping, raw JSON string — not needed for an integration |
| `fees` | `low`, `medium`, `high` — the raw fee schedule of the gas provider, opaque — and `computed`: `gas` (gas cost of a transfer, in the smallest unit of the native coin), `native` (the same, in native coin units) |
| `ticker` | `price` and `marketcap` (in EUR), `rank` (market cap rank), `percentChange24h` (24-hour change, in %) |
| `history` | The EUR price curve, a `History` ([Timestamps and histories](../concepts.md#timestamps-and-histories)) |
| `network` | `uuid`, `state` (state of the network record), `caip2` (chain identifier, CAIP-2 — `eip155:1`), `label`, `gasBase`, `data`, `type` (`{ uuid, code, label, data }` — `code` is the network family: `UTXO`, `EVM`, `COMPUTE_UNIT` or `DROPS`; `label` its name) — both `data` are internal connector mappings, raw JSON strings, not needed for an integration |

An unknown uuid or ISO code answers `404 unknown_asset`.

## tickers

```
client.asset.tickers(): Promise<Page<{ iso: string, ticker: AssetTicker }>>
```

```ts
const { items } = await client.asset.tickers()

for (const { iso, ticker } of items) {
  console.log(iso, ticker.price, ticker.percentChange24h)   // 'BTC' 61230.4 -1.2
}
```

Returns, for every asset, its `iso` and its `ticker` (`AssetTicker`): `price` and `marketcap` (in EUR), `rank` (market cap rank), `percentChange24h` (24-hour change, in %).

## ticker

```
client.asset.ticker(iso: string): Promise<{ iso: string, ticker: AssetTicker, history: History }>
```

`iso` is the ISO code of the asset (`Asset.BTC`) — this read takes no uuid and no model.

```ts
import { Asset } from '@bitgen/sdk'

const btc = await client.asset.ticker(Asset.BTC)

console.log(btc.ticker.price)   // 61230.4
console.log(btc.history.d)      // EUR price over the last 24 hours, one point per hour
```

Returns the `iso`, the `ticker` and the EUR price `history` of the asset.

## Errors

In addition to the [common errors](../errors.md#common-errors):

| Status | `code` | Meaning |
|---|---|---|
| `404` | `unknown_asset` | Unknown uuid or ISO code |

## Related

- [Assets](../concepts.md#assets) — the `Asset` constants, uuid or ISO code, case
- [Amounts](../concepts.md#amounts) — crypto amounts as strings, up to the decimals of the asset
- [Custody wallets](custody.md) — one wallet per customer and per asset
- [Trading](trading.md) — orders take an `AssetState.AVAILABLE` asset
