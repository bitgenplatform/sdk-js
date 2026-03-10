import type { HttpClient } from '../http.js';
import type { Wallet, UserRef } from '../types/index.js';
export declare class WalletResource {
    private readonly http;
    constructor(http: HttpClient);
    /** Get all wallets for a user */
    list(user: UserRef): Promise<Wallet[]>;
    /** Get a specific wallet by user and asset ISO code */
    get(user: UserRef, asset: string): Promise<Wallet>;
}
//# sourceMappingURL=wallet.d.ts.map