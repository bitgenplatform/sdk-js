"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.BitgenClient = void 0;
const http_js_1 = require("./http.js");
const asset_js_1 = require("./resources/asset.js");
const bank_js_1 = require("./resources/bank.js");
const order_js_1 = require("./resources/order.js");
const transaction_js_1 = require("./resources/transaction.js");
const user_js_1 = require("./resources/user.js");
const wallet_js_1 = require("./resources/wallet.js");
const stats_js_1 = require("./resources/stats.js");
class BitgenClient {
    constructor(config) {
        const http = new http_js_1.HttpClient(config);
        this.asset = new asset_js_1.AssetResource(http);
        this.bank = new bank_js_1.BankResource(http);
        this.order = new order_js_1.OrderResource(http);
        this.transaction = new transaction_js_1.TransactionResource(http);
        this.user = new user_js_1.UserResource(http);
        this.wallet = new wallet_js_1.WalletResource(http);
        this.stats = new stats_js_1.StatsResource(http);
    }
}
exports.BitgenClient = BitgenClient;
//# sourceMappingURL=client.js.map