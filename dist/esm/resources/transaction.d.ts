import type { HttpClient } from '../http.js';
import type { CreateTransactionParams, CreatedTransaction, Transaction, TransactionHistoryFilter, TransactionHistoryItem, UserRef } from '../types/index.js';
export declare class TransactionResource {
    private readonly http;
    constructor(http: HttpClient);
    /**
     * Create a crypto withdrawal transaction.
     *
     * ⚠ This endpoint throws `BitgenRawError` (not `BitgenError`) for
     * HTTP 500 (invalid_asset) and HTTP 400 (missing field) — both return
     * a plain text body, not a JSON error object.
     */
    create(params: CreateTransactionParams): Promise<CreatedTransaction>;
    /** Get a transaction by its ID */
    get(txId: string): Promise<Transaction>;
    /** Get transaction history for a user */
    history(user: UserRef, filters?: TransactionHistoryFilter): Promise<TransactionHistoryItem[]>;
}
//# sourceMappingURL=transaction.d.ts.map