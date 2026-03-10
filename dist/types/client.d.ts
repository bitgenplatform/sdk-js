import { AssetResource } from './resources/asset.js';
import { BankResource } from './resources/bank.js';
import { OrderResource } from './resources/order.js';
import { TransactionResource } from './resources/transaction.js';
import { UserResource } from './resources/user.js';
import { WalletResource } from './resources/wallet.js';
import { StatsResource } from './resources/stats.js';
import type { BitgenConfig } from './types/index.js';
export declare class BitgenClient {
    readonly asset: AssetResource;
    readonly bank: BankResource;
    readonly order: OrderResource;
    readonly transaction: TransactionResource;
    readonly user: UserResource;
    readonly wallet: WalletResource;
    readonly stats: StatsResource;
    constructor(config: BitgenConfig);
}
//# sourceMappingURL=client.d.ts.map