## [0.1.5] - 2026-03-22

### Changed
- Sandbox URL updated from `api.btgn.dev` to `api.staging.btgn.dev`
- Removed `dist/` from repository (built by CI on release)

## [0.1.3] - 2026-03-11

### Changed
- `BitgenRawError` removed — `transaction.create()` now throws `BitgenError` like all other methods

### Breaking
- `BitgenRawError` is no longer exported