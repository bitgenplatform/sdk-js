import type { BitgenConfig } from './types/index.js';
type HttpMethod = 'GET' | 'POST' | 'PUT' | 'DELETE';
interface RequestOptions {
    method?: HttpMethod;
    body?: unknown;
    query?: Record<string, string | number | boolean | undefined>;
    /** Set to true for endpoints that return raw non-JSON errors (POST /tx) */
    rawErrors?: boolean;
}
export declare class HttpClient {
    private readonly baseUrl;
    private readonly headers;
    constructor(config: BitgenConfig);
    request<T>(path: string, options?: RequestOptions): Promise<T>;
    get<T>(path: string, query?: RequestOptions['query']): Promise<T>;
    post<T>(path: string, body: unknown, rawErrors?: boolean): Promise<T>;
    put<T>(path: string, body: unknown): Promise<T>;
    delete<T>(path: string): Promise<T>;
}
export {};
//# sourceMappingURL=http.d.ts.map