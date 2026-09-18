# Contributing

Internal notes for working on `@bitgen/sdk`. The client documentation lives in `README.md` and `readme/`; this file is not published.

## Prerequisites

- Node.js 20 or later with npm — or nothing installed locally and a throwaway container mounted on the repository:

  ```bash
  docker run --rm -v "$PWD":/app -w /app node:20-alpine sh -c "npm ci && npm run lint && npm test"
  ```

- No network access is needed once `npm ci` has run: the tests work offline.

## Commands

```bash
npm ci
npm run lint    # ESLint (typescript-eslint, type-checked)
npm test        # builds first (pretest), then runs tests/**/*.test.js with node:test
npm run build   # cleans dist/, regenerates src/version.ts, then ESM + CJS (+ .d.ts) into dist/
```

`npm test` packs the package (`npm pack`) into a temporary directory, installs the tarball in a throwaway consumer project and checks it from JavaScript (ESM, CommonJS) and TypeScript (`node16` module / commonjs, `bundler`, `node10`), then runs HTTP tests against a local mock API (`tests/compat/mock-server.js`, one test file per resource). It needs `npm` on the PATH and no network access. Only `*.test.js` files under `tests/` are run.

`tests/compat/docs.test.js` checks the client documentation the same way: every ```` ```ts ```` / ```` ```js ```` block of `README.md` and `readme/**/*.md` is compiled against the packed package (`strict`, `node16`, `@types/node`) — each block as its own module, with a configured `client` (and the `customer` of the quick start) declared, and the imports shown earlier on the same page in scope — every relative link and anchor of the documentation (plus this file) must resolve, `README.md` must link every file of `readme/`, its title must carry the version of `package.json`, and no API route (`GET /custody/{user}`, with or without backticks) nor bare API path (`` `/customer` ``, `'/bank/…'`) may appear anywhere in it, code blocks included — the only tolerated occurrence is the `"GET /custody/…"` value of an `ApikeyLog` in `apikeys.md`; a failure names `file:line`. What depends on the API itself (error codes, signatures) is checked by BITGEN against the API, outside this repository.

## Repository layout

- `src/http.ts` — transport: hosts, headers, timeout, redirects, error mapping; `src/error.ts` — `BitgenError`; `src/utils.ts` — argument validation (path segments, user and asset references, amounts); `src/constants.ts` — `Env`, `Asset` and the enumerated values of the API (`AssetState`, `OrderState`, `Locale`… frozen `as const` objects, each also a type of the same name)
- `src/client.ts` — `BitgenClient`, one property per resource; `src/index.ts` — the public surface (classes, constants, every type)
- `src/resources/<resource>.ts` — one class per resource; `src/types/<resource>.ts` — its types, re-exported by `src/types/index.ts` and `src/index.ts`
- `src/version.ts` — generated from `package.json` by `scripts/prebuild.js` (npm `prebuild` and `version` hooks) and committed: every build rewrites it if needed, `npm version` adds it to the version commit, and the test suite checks they match
- `tests/compat/` — `mock-server.js` (mock API and helpers), `http.test.js` (transport), `<resource>.test.js` (one per resource), `verify.test.js` (webhook verification), `package.test.js` (the packed package from JS and TS consumers), `constants.test.js` (the enumerated values: keys, values, order, frozen), `fixtures/main.ts` (TypeScript consumer), `docs.test.js` (the documentation: examples compiled, links and anchors, no API route)
- `README.md`, `readme/` — client documentation, published with the package; `CHANGELOG.md`

## Adding a resource

1. Read the API reference of the resource (ask BITGEN's API team). Write `src/types/<resource>.ts` with the exact fields and types the API documents (`unknown`, `| null` and optional fields as written), re-export them from `src/types/index.ts` and `src/index.ts`; every set of values the API enumerates is a frozen object in `src/constants.ts` (value and type of the same name, keys and values as the API writes them — the same sets as the PHP SDK's `src/Model/<Name>.php`), and the types derive from it (`type X = (typeof X)[keyof typeof X]`, `Exclude<BankDirection, typeof BankDirection.ALL>`) rather than repeating the literals; write `src/resources/<resource>.ts` — every method `async`, path segments validated, users and assets resolved (`resolveUuid`, `assetId`), a model accepted wherever its uuid is (`string | Order`, `idOf`), amounts normalized, explicit request bodies — and add it to `BitgenClient`.
2. Write `tests/compat/<resource>.test.js`: for every method, the exact path and body sent, the models accepted in place of a uuid, and at least one error (`403 forbidden_permission` at minimum); extend `tests/compat/constants.test.js`, `tests/compat/fixtures/main.ts` (types, calls, `@ts-expect-error`) and the method checks of `tests/compat/package.test.js`.
3. Document it: `readme/resource/<resource>.md` on the template of the existing files (introduction, methods, one section per method, errors, related) — the SDK's methods, never the API's routes — its line in `README.md`, `CHANGELOG.md` — then re-read `README.md` and `readme/` in full.
4. Run `npm run lint`, `npm test` (Node.js 20, 22 and 24, offline) and `npm run build`; check the packed package (`npm pack`, `publint`, `@arethetypeswrong/cli`).

## Release

1. Set the release date in `CHANGELOG.md` and the version in the `README.md` title (`docs.test.js` checks it against `package.json`).
2. First release of a version already in `package.json`: commit, then `git tag -a vX.Y.Z -m vX.Y.Z` (`npm version` refuses an unchanged version). Next releases: `npm version x.y.z` — it regenerates `src/version.ts`, commits and tags.
3. `git push origin main` — `ci.yml` (lint on Node.js 20, tests on 20, 22 and 24) must be green.
4. `git push origin vX.Y.Z` — `release.yml` checks that the tag matches `package.json`, runs lint and tests, builds, and **stages the version on npm** by trusted publishing (OIDC: no token, no secret). The trust relationship only allows `npm stage publish`.
5. A maintainer publishes the staged version on npmjs.com (2FA).

## Rules

- The BITGEN API v4 is the only source of truth: routes, fields, error codes and behaviours come from the API reference kept by BITGEN's API team (not part of this repository), nothing is invented. A point it does not cover is a question to the API team, not a guess.
- `README.md` and `readme/` are re-read in full on every change: nothing stale, nothing anticipated, nothing the API does not do; every example compiles and every link resolves (`tests/compat/docs.test.js`). The documentation never lists the permissions of a key: they are set by the platform, not by the integrator.
- The documentation is the SDK's, not the API's: it names methods, types and constants, never routes, paths or query parameters (`tests/compat/docs.test.js` refuses them); the only API vocabulary is the hosts and headers of the configuration, the `POST` a webhook delivery makes to the integrator's endpoint, and the `path` value of an `ApikeyLog`.
- Never a string literal for an enumerated value, in the documentation and in the tests: always the constant (`type: CoreType.STAKING`, `locale: Locale.FR`, `order.state === OrderState.DONE`); parameter tables name the constants, output tables prefix the first value (`AssetState.AVAILABLE`, `UNAVAILABLE`…). The one exception is the `Constants` section of `readme/concepts.md`, which explains once that they are strings. Raw strings stay in the expected bodies and queries, and in the response fixtures of the tests.
- Wherever a method expects the uuid of something the SDK returns, it also accepts the model (`string | Order`, `UserRef`, `AssetInput`) and sends its uuid.
- A minimum (purchase, sale, withdrawal, staking) is documented by its existence and its error code, never by a figure or a variable name: they are set by BITGEN per environment and may change.
- An error message never echoes the value of an argument, and nothing ever contains the API key.
- `README.md` has no line budget: it is as long as it needs to be.
- No runtime dependency: the native `fetch` and `node:crypto` only.
