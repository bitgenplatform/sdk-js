import type { HttpClient } from '../http.js'
import type { Asset, AssetInput, AssetTicker, History, Page } from '../types/index.js'
import { assetId, pathSegment } from '../utils.js'

/** `/asset`, `/ticker` — permission `asset.read` */
export class AssetResource {
  constructor(private readonly http: HttpClient) {}

  /** List all assets */
  async list(): Promise<Page<Asset>> {
    return await this.http.get('/asset')
  }

  /** Get one asset by uuid or ISO code (any case, sent as is — `Asset.ETH`), or by model (its uuid is sent) */
  async get(asset: AssetInput): Promise<Asset> {
    return await this.http.get(`/asset/${pathSegment(assetId(asset), 'asset')}`)
  }

  /** Tickers of all assets */
  async tickers(): Promise<Page<{ iso: string, ticker: AssetTicker }>> {
    return await this.http.get('/ticker')
  }

  /** Ticker and EUR price history of one asset, by ISO code */
  async ticker(iso: string): Promise<{ iso: string, ticker: AssetTicker, history: History }> {
    return await this.http.get(`/ticker/${pathSegment(iso, 'iso')}`)
  }
}
