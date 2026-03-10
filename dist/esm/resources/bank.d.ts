import type { HttpClient } from '../http.js';
import type { BankAccount, BankWithdrawResult, BankOperation, BankOperationsFilter, UserRef } from '../types/index.js';
export declare class BankResource {
    private readonly http;
    constructor(http: HttpClient);
    /** Get a user's EUR bank account balance and reference */
    get(user: UserRef): Promise<BankAccount>;
    /** Withdraw EUR from a user's bank account */
    withdraw(user: UserRef, amount: number): Promise<BankWithdrawResult>;
    /** Get bank operation history for a user */
    operations(user: UserRef, filters?: BankOperationsFilter): Promise<BankOperation[]>;
}
//# sourceMappingURL=bank.d.ts.map