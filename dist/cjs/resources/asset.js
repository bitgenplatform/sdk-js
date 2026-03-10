"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.AssetResource = void 0;
class AssetResource {
    constructor(http) {
        this.http = http;
    }
    /** Get a single asset by ISO code (e.g. 'BTC', 'ETH') */
    get(iso) {
        return this.http.get(`/api/v3/asset/${iso}`);
    }
    /** List all available assets */
    list() {
        return this.http.get('/api/v3/assets');
    }
}
exports.AssetResource = AssetResource;
//# sourceMappingURL=asset.js.map