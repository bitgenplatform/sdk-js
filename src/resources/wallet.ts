import type { HttpClient } from '../http.js'
import type { Wallet, UserRef } from '../types/index.js'
import { resolveUuid } from '../utils.js'

export class WalletResource {
  constructor(private readonly http: HttpClient) {}

  /** Get all wallets for a user */
  list(user: UserRef): Promise<Wallet[]> {
    return this.http.get<Wallet[]>(`/api/v3/wallet/${resolveUuid(user)}`)
  }

  /** Get a specific wallet by user and asset ISO code */
  get(user: UserRef, asset: string): Promise<Wallet> {
    return this.http.get<Wallet>(`/api/v3/wallet/${resolveUuid(user)}/${asset}`)
  }
}
