export class AssetResource {
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
//# sourceMappingURL=asset.js.map