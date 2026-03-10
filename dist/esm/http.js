import { BitgenError, BitgenRawError } from './error.js';
const BASE_URLS = {
    sandbox: 'https://api.btgn.dev',
    production: 'https://api.bitgen.com',
};
export class HttpClient {
    constructor(config) {
        var _a, _b;
        if (config.env === 'localhost') {
            const port = (_a = config.port) !== null && _a !== void 0 ? _a : 3000;
            this.baseUrl = `http://localhost:${port}`;
        }
        else {
            this.baseUrl = BASE_URLS[(_b = config.env) !== null && _b !== void 0 ? _b : 'production'];
        }
        this.headers = {
            'Content-Type': 'application/json',
            'BITGEN-Scope': config.scope,
            'Api-key': config.apiKey,
        };
    }
    async request(path, options = {}) {
        const { method = 'GET', body, query, rawErrors = false } = options;
        // Build URL with optional query params
        const url = new URL(path, this.baseUrl);
        if (query) {
            for (const [key, value] of Object.entries(query)) {
                if (value !== undefined) {
                    url.searchParams.set(key, String(value));
                }
            }
        }
        const response = await fetch(url.toString(), {
            method,
            headers: this.headers,
            body: body !== undefined ? JSON.stringify(body) : undefined,
        });
        // Handle raw HTTP errors (POST /api/v3/tx exception documented in API)
        if (rawErrors && (response.status === 500 || response.status === 400)) {
            const text = await response.text();
            throw new BitgenRawError(response.status, text.trim());
        }
        // 204 No Content — no body to parse
        if (response.status === 204) {
            return undefined;
        }
        const data = await response.json();
        // API embeds errors in body with an `error` key — all HTTP 200/201 with error key
        if (data && typeof data === 'object' && 'error' in data && data.error !== null) {
            throw new BitgenError(response.status, data.error);
        }
        return data;
    }
    get(path, query) {
        return this.request(path, { method: 'GET', query });
    }
    post(path, body, rawErrors = false) {
        return this.request(path, { method: 'POST', body, rawErrors });
    }
    put(path, body) {
        return this.request(path, { method: 'PUT', body });
    }
    delete(path) {
        return this.request(path, { method: 'DELETE' });
    }
}
//# sourceMappingURL=http.js.map