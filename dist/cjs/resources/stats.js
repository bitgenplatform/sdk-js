"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.StatsResource = void 0;
class StatsResource {
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
exports.StatsResource = StatsResource;
//# sourceMappingURL=stats.js.map