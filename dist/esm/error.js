export class BitgenError extends Error {
    constructor(status, body) {
        super(`[${body.service}] ${body.message}`);
        this.name = 'BitgenError';
        this.status = status;
        this.code = body.code;
        this.service = body.service;
        this.module = body.module;
        this.apiMessage = body.message;
    }
}
/**
 * Special error for the POST /api/v3/tx endpoint which returns
 * raw HTTP 500 / 400 with a plain text body (not JSON-wrapped).
 */
export class BitgenRawError extends Error {
    constructor(status, rawBody) {
        super(rawBody);
        this.name = 'BitgenRawError';
        this.status = status;
        this.rawBody = rawBody;
    }
}
//# sourceMappingURL=error.js.map