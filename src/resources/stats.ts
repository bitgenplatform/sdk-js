import type { HttpClient } from '../http.js'
import type { HealthCheck, Stats } from '../types/index.js'

export class StatsResource {
  constructor(private readonly http: HttpClient) {}

  /** Check API health */
  health(): Promise<HealthCheck> {
    return this.http.get<HealthCheck>('/health')
  }

  /** Get service quotas (user slots, etc.) */
  quotas(): Promise<Stats> {
    return this.http.get<Stats>('/api/v3/stats')
  }
}
