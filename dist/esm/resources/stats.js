export class StatsResource {
    constructor(http) {
        this.http = http;
    }
    /** Check API health */
    health() {
        return this.http.get('/health');
    }
    /** Get service quotas (user slots, etc.) */
    quotas() {
        return this.http.get('/api/v3/stats');
    }
}
//# sourceMappingURL=stats.js.map