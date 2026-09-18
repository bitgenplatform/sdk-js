import type { AssetInput, AssetRef } from './index.js'

export type { CoreType, CoreState } from '../constants.js'
import type { CoreType, CoreState } from '../constants.js'

/** One field of a connector's configuration schema — secrets live in the organization's configuration, never here */
export interface CoreConfigField {
  name: string
  label: Record<string, string>
  data: { type: string, value: unknown }
}

/** Platform connector: bank (`RAMP`), exchange (`TRADING`), custodian (`CUSTODY`), staking provider… */
export interface Core {
  uuid: string
  state: CoreState
  /** Connector identifier; for a `STAKING` core: `<provider>_<iso>` (`bitgen_eth`, `figment_sol`) */
  name: string
  label: string
  type: CoreType
  /** Derived from the `name` suffix — null outside `STAKING` */
  asset: AssetRef | null
  config: CoreConfigField[]
}

/** All optional, combinable — the list is not paginated */
export interface CoreListParams {
  type?: CoreType
  /** Only the cores attached to this asset (the `STAKING` ones): uuid or ISO code, or an `Asset` / `AssetRef` model (its uuid is sent) */
  asset?: AssetInput
  state?: CoreState
}
