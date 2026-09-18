import type { Amount, History, UserRef } from './index.js'

export type { BankDirection } from '../constants.js'
import type { BankDirection } from '../constants.js'

/** EUR ledger of a customer — created on the first `GET /bank/{user}` */
export interface BankAccount {
  uuid: string
  /** Wire transfer reference the customer must indicate (`BTGN` prefix) */
  message: string
  iban: string | null
  bank: string | null
  bic: string | null
  /** EUR */
  balance: number
  /** EUR balance curve, materialized by an hourly cron: `{}` until it has run for this account */
  history: History | Record<string, never>
  /** EUR pending: incoming not credited yet / outgoing not confirmed yet */
  pending: { in: number, out: number }
}

export interface BankOperation {
  txId: string
  /** EUR */
  amount: number
  /** One kind of operation — never the `ALL` of the filter */
  direction: Exclude<BankDirection, typeof BankDirection.ALL>
  date: number
  info: string | null
}

export interface BankOperationsParams {
  /** Default `ALL` */
  direction?: BankDirection
  /** Epoch seconds — `from` and `to` go together, otherwise ignored */
  from?: number
  to?: number
  offset?: number
  limit?: number
}

export interface BankWithdrawParams {
  /** EUR, rounded to 2 decimals */
  amount: Amount
  /** `iban` / `bank` / `bic` update the customer's bank details before the withdrawal */
  iban?: string
  bank?: string
  bic?: string
}

export interface BankCreditParams {
  amount: Amount
  currency?: 'EUR'
  /** Target customer — or `message`, one of the two is required */
  user?: UserRef
  /** Wire reference (`BTGN…`), alternative to `user` */
  message?: string
  /** Idempotency key: replaying returns the same uuid */
  reference?: string
}
