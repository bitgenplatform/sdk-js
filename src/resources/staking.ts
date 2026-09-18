import { CoreType } from '../constants.js'
import type { HttpClient } from '../http.js'
import type {
  AssetInput,
  Core,
  Created,
  Page,
  PageParams,
  StakeParams,
  StakingAmountParams,
  StakingListParams,
  StakingMovement,
  StakingOperation,
  StakingPortfolio,
  StakingPosition,
  UserRef,
} from '../types/index.js'
import type { CoreResource } from './core.js'
import { amount, assetId, idOf, pathSegment, resolveUuid } from '../utils.js'

/**
 * `/staking` — permissions `staking.write`, `staking.read` (`core.read` for `providers`).
 * Two distinct ids: the **movement** uuid (returned by `stake`, handled by `get` / `list` / `movements`)
 * and the **position** uuid (`movement.staking.uuid`, taken by `rewards` / `unstake`).
 */
export class StakingResource {
  constructor(private readonly http: HttpClient, private readonly core: CoreResource) {}

  /** Staking providers = the `STAKING` cores, optionally for one asset — their `uuid` or `name` is the `provider` of `stake` */
  async providers(asset?: AssetInput): Promise<Page<Core>> {
    return await this.core.list(asset === undefined ? { type: CoreType.STAKING } : { type: CoreType.STAKING, asset })
  }

  /** Open a staking position — the amount is moved from the customer's custody to the provider's deposit address */
  async stake(user: UserRef, params: StakeParams): Promise<Created> {
    return await this.http.post('/staking', {
      user: resolveUuid(user),
      asset: assetId(params.asset),
      amount: amount(params.amount),
      provider: params.provider,
    })
  }

  /** Movements of the organization, all states */
  async list(params: StakingListParams = {}): Promise<Page<StakingMovement>> {
    return await this.http.get('/staking', movementsQuery(params))
  }

  /** Movements still in progress: `REQUESTED`, `PENDING`, `FAILED` */
  async movements(params: StakingListParams = {}): Promise<Page<StakingMovement>> {
    return await this.http.get('/staking/movements', movementsQuery(params))
  }

  /** One movement by its uuid, or by model */
  async get(movement: string | StakingMovement): Promise<StakingMovement> {
    return await this.http.get(`/staking/${pathSegment(idOf(movement, 'movement'), 'movement')}`)
  }

  /** Claim the rewards of a position — `amount` absent = all of them. Deducted immediately, the transfer is executed by compliance. */
  async rewards(position: string | StakingPosition, params: StakingAmountParams = {}): Promise<void> {
    await this.http.put(`/staking/${pathSegment(idOf(position, 'position'), 'position')}/rewards`, amountBody(params))
  }

  /** Leave a position — `amount` absent = the whole position (a full exit ignores the minimums). Deducted immediately, the transfer is executed by compliance. */
  async unstake(position: string | StakingPosition, params: StakingAmountParams = {}): Promise<void> {
    await this.http.put(`/staking/${pathSegment(idOf(position, 'position'), 'position')}/unstake`, amountBody(params))
  }

  /** Staking operations of a customer */
  async operations(user: UserRef, params: PageParams = {}): Promise<Page<StakingOperation>> {
    return await this.http.get(`/staking/${pathSegment(resolveUuid(user), 'user')}/operations`, { ...params })
  }

  /** EUR balances and curves (capital, revenues) of a customer's staking */
  async portfolio(user: UserRef): Promise<StakingPortfolio> {
    return await this.http.get(`/staking/${pathSegment(resolveUuid(user), 'user')}/portfolio`)
  }
}

function movementsQuery(params: StakingListParams): Record<string, string | number | undefined> {
  const { user, ...rest } = params
  return { user: user === undefined || user === null ? undefined : resolveUuid(user), ...rest }
}

/** `{ amount }` when given, `{}` otherwise — the API reads an absent amount as "everything" */
function amountBody(params: StakingAmountParams): { amount?: string } {
  return params.amount === undefined ? {} : { amount: amount(params.amount) }
}
