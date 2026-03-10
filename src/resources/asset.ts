import type { HttpClient } from '../http.js'
import type { Asset } from '../types/index.js'

export class AssetResource {
  constructor(private readonly http: HttpClient) {}

  /** Get a single asset by ISO code (e.g. 'BTC', 'ETH') */
  get(iso: string): Promise<Asset> {
    return this.http.get<Asset>(`/api/v3/asset/${iso}`)
  }

  /** List all available assets */
  list(): Promise<Asset[]> {
    return this.http.get<Asset[]>('/api/v3/assets')
  }
}
