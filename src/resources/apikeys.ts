import type { HttpClient } from '../http.js'
import type { Apikey, ApikeyListParams, ApikeyLog, Page, PageParams } from '../types/index.js'
import { idOf, pathSegment } from '../utils.js'

/**
 * `/organization/{scope}/apikeys` — permission `apikey.read`, read-only: a key cannot be created
 * through the API (and the SDK does not revoke). `{organization}` is always the key's scope.
 */
export class ApikeysResource {
  constructor(private readonly http: HttpClient) {}

  /** Keys of the organization — revoked ones with `includeRevoked` */
  async list(params: ApikeyListParams = {}): Promise<Page<Apikey>> {
    return await this.http.get(`/organization/${this.organization()}/apikeys`, { ...params })
  }

  /** One key by uuid, or by model */
  async get(apikey: string | Apikey): Promise<Apikey> {
    return await this.http.get(`/organization/${this.organization()}/apikeys/${pathSegment(idOf(apikey, 'apikey'), 'apikey')}`)
  }

  /** Calls made with the key: path, inputs (PII masked), status, error */
  async logs(apikey: string | Apikey, params: PageParams = {}): Promise<Page<ApikeyLog>> {
    return await this.http.get(`/organization/${this.organization()}/apikeys/${pathSegment(idOf(apikey, 'apikey'), 'apikey')}/logs`, { ...params })
  }

  private organization(): string {
    return pathSegment(this.http.scope, 'scope')
  }
}
