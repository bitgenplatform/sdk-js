import type { HttpClient } from '../http.js';
import type { HealthCheck, Stats } from '../types/index.js';
export declare class StatsResource {
    private readonly http;
    constructor(http: HttpClient);
    /** Check API health */
    health(): Promise<HealthCheck>;
    /** Get service quotas (user slots, etc.) */
    quotas(): Promise<Stats>;
}
//# sourceMappingURL=stats.d.ts.map