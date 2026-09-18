import type { HttpClient } from '../http.js'
import type {
  BankAccount,
  BankCreditParams,
  BankOperation,
  BankOperationsParams,
  BankWithdrawParams,
  Created,
  Page,
  UserRef,
} from '../types/index.js'
import { amount, pathSegment, resolveUuid } from '../utils.js'

/** `/bank` — permissions `bank.read`, `bank.write`. EUR ledger per customer; `{user}` = uuid or email. */
export class BankResource {
  constructor(private readonly http: HttpClient) {}

  /** EUR account of a customer — created on first read (requires a validated KYC or KYB) */
  async get(user: UserRef): Promise<BankAccount> {
    return await this.http.get(`/bank/${pathSegment(resolveUuid(user), 'user')}`)
  }

  /** EUR operations of a customer */
  async operations(user: UserRef, params: BankOperationsParams = {}): Promise<Page<BankOperation>> {
    return await this.http.get(`/bank/${pathSegment(resolveUuid(user), 'user')}/operations`, { ...params })
  }

  /** EUR withdrawal to the customer's IBAN — `iban` / `bank` / `bic` update the bank details first */
  async withdraw(user: UserRef, params: BankWithdrawParams): Promise<{ transaction: string }> {
    return await this.http.put(`/bank/${pathSegment(resolveUuid(user), 'user')}`, { ...params, amount: amount(params.amount) })
  }

  /** Inject an EUR deposit (logical credit) — targets `user` or the wire `message`; `reference` makes it idempotent */
  async credit(params: BankCreditParams): Promise<Created> {
    const { user, ...rest } = params
    // `user` is optional (`message` is the alternative): absent or null → key omitted
    return await this.http.post('/bank', { ...rest, amount: amount(params.amount), user: user === undefined || user === null ? undefined : resolveUuid(user) })
  }
}
