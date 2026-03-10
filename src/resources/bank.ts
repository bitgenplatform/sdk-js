import type { HttpClient } from '../http.js'
import type {
  BankAccount,
  BankWithdrawResult,
  BankOperation,
  BankOperationsFilter,
  UserRef,
} from '../types/index.js'
import { resolveUuid } from '../utils.js'

export class BankResource {
  constructor(private readonly http: HttpClient) {}

  /** Get a user's EUR bank account balance and reference */
  get(user: UserRef): Promise<BankAccount> {
    return this.http.get<BankAccount>(`/api/v3/bank/${resolveUuid(user)}`)
  }

  /** Withdraw EUR from a user's bank account */
  withdraw(user: UserRef, amount: number): Promise<BankWithdrawResult> {
    return this.http.put<BankWithdrawResult>(`/api/v3/bank/${resolveUuid(user)}`, { amount })
  }

  /** Get bank operation history for a user */
  operations(user: UserRef, filters?: BankOperationsFilter): Promise<BankOperation[]> {
    return this.http.get<BankOperation[]>(
      `/api/v3/bank/${resolveUuid(user)}/operations`,
      filters as Record<string, string | number | undefined>,
    )
  }
}
