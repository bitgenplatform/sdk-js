import type { HttpClient } from '../http.js'
import type {
  CreateTransactionParams,
  CreatedTransaction,
  Transaction,
  TransactionHistoryFilter,
  TransactionHistoryItem,
  UserRef,
} from '../types/index.js'
import { resolveUuid } from '../utils.js'

export class TransactionResource {
  constructor(private readonly http: HttpClient) {}

  /**
   * Create a crypto withdrawal transaction.
   *
   * ⚠ This endpoint throws `BitgenRawError` (not `BitgenError`) for
   * HTTP 500 (invalid_asset) and HTTP 400 (missing field) — both return
   * a plain text body, not a JSON error object.
   */
  create(params: CreateTransactionParams): Promise<CreatedTransaction> {
    return this.http.post<CreatedTransaction>(
      '/api/v3/tx',
      {
        ...params,
        user: resolveUuid(params.user),
      },
      true, // rawErrors flag — enables special handling for this endpoint
    )
  }

  /** Get a transaction by its ID */
  get(txId: string): Promise<Transaction> {
    return this.http.get<Transaction>(`/api/v3/tx/${txId}`)
  }

  /** Get transaction history for a user */
  history(user: UserRef, filters?: TransactionHistoryFilter): Promise<TransactionHistoryItem[]> {
    return this.http.get<TransactionHistoryItem[]>(
      `/api/v3/txs/${resolveUuid(user)}`,
      filters as Record<string, string | number | undefined>,
    )
  }
}
