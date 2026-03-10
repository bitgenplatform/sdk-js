import type { HttpClient } from '../http.js';
import type { Asset } from '../types/index.js';
export declare class AssetResource {
    private readonly http;
    constructor(http: HttpClient);
    /** Get a single asset by ISO code (e.g. 'BTC', 'ETH') */
    get(iso: string): Promise<Asset>;
    /** List all available assets */
    list(): Promise<Asset[]>;
}
//# sourceMappingURL=asset.d.ts.map