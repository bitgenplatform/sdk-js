# Installation

`@bitgen/sdk` is the official Node.js SDK for the BITGEN API v4. It runs server-side only: the API accepts browser requests from a fixed list of origins, so the SDK is not meant to be used from a browser.

## Requirements

- Node.js 20 or later
- No dependency: the SDK only uses what Node.js 20 already provides

## Install

```bash
npm install @bitgen/sdk
```

## Import

ESM:

```ts
import { BitgenClient, BitgenError, Env, Asset } from '@bitgen/sdk'
```

CommonJS:

```js
const { BitgenClient, BitgenError, Env, Asset } = require('@bitgen/sdk')
```

The package exports the client (`BitgenClient`), its error class (`BitgenError`), two constants — `Env`, the environments, and `Asset`, the ISO codes of the main assets ([Configuration](configuration.md), [Assets](concepts.md#assets)) — and the constants naming the known values of the API (`AssetState`, `OrderState`, `Locale`, `OrganizationCategory`…), each also a type ([Constants](concepts.md#constants)).

## TypeScript

Type declarations ship with the package: nothing else to install. Every type a method takes or returns is exported under the same name as in the documentation (`BitgenConfig`, `Customer`, `Wallet`, `Order`, `UserRef`, `AssetInput`…):

```ts
import type { BitgenConfig, Customer, Wallet } from '@bitgen/sdk'
```

## Next steps

- [Quick start](quick-start.md) — create the client and run a first customer journey
- [Configuration](configuration.md) — credentials, environments, custom host, timeout
