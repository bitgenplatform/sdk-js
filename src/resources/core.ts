import type { HttpClient } from '../http.js'
import type { Core, CoreListParams, Page } from '../types/index.js'
import { assetFilter, idOf, pathSegment } from '../utils.js'

/** `/applications/core` — permission `core.read`. Platform catalogue of connectors, read-only. */
export class CoreResource {
  constructor(private readonly http: HttpClient) {}

  /** Connectors matching the filters — not paginated, `count` is everything that matches */
  async list(params: CoreListParams = {}): Promise<Page<Core>> {
    // spread first: the query keeps the order of the params, `asset` is replaced in place (absent or null = no filter)
    return await this.http.get('/applications/core', { ...params, asset: assetFilter(params.asset) })
  }

  /** One connector by uuid or by model */
  async get(core: string | Core): Promise<Core> {
    return await this.http.get(`/applications/core/${pathSegment(idOf(core, 'core'), 'core')}`)
  }
}
