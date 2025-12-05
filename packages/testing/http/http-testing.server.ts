import * as http from 'node:http';
import { ITestingModule } from '../core/testing.interface';

/**
 * HTTP request options for testing
 */
export interface IHttpTestRequest {
    /** HTTP method */
    method?: 'GET' | 'POST' | 'PUT' | 'DELETE' | 'PATCH' | 'HEAD' | 'OPTIONS';
    /** Request path */
    path: string;
    /** Request headers */
    headers?: Record<string, string>;
    /** Request body (for POST, PUT, PATCH) */
    body?: any;
    /** Query parameters */
    query?: Record<string, string | number>;
}

/**
 * HTTP response from testing server
 */
export interface IHttpTestResponse {
    /** HTTP status code */
    status: number;
    /** Response headers */
    headers: Record<string, string | string[]>;
    /** Response body */
    body: any;
    /** Raw response text */
    text: string;
    /** Response time in milliseconds */
    responseTime: number;
}

/**
 * HttpTestingServer - Provides E2E HTTP testing capabilities
 * for testing controllers and routes
 */
export class HttpTestingServer {
    private server: http.Server | null = null;
    private port: number = 0;
    private host: string = '127.0.0.1';
    private baseUrl: string = '';
    private isRunning: boolean = false;

    constructor(private module: ITestingModule) {}

    /**
     * Initialize and start the testing server
     */
    async init(
        options: { port?: number; host?: string } = {},
    ): Promise<HttpTestingServer> {
        this.port = options.port || this.findAvailablePort();
        this.host = options.host || '127.0.0.1';
        this.baseUrl = `http://${this.host}:${this.port}`;

        const httpAdapter = this.module.getHttpAdapter();

        if (httpAdapter?.httpServer) {
            this.server = httpAdapter.httpServer;
        } else {
            // Create a simple test server if no adapter available
            this.server = http.createServer((req, res) => {
                // Default handler for testing
                res.writeHead(404, { 'Content-Type': 'application/json' });
                res.end(JSON.stringify({ error: 'Not Found' }));
            });
        }

        return this;
    }

    /**
     * Start the server
     */
    async listen(): Promise<void> {
        if (this.isRunning) {
            return;
        }

        return new Promise((resolve, reject) => {
            if (!this.server) {
                reject(new Error('Server not initialized. Call init() first.'));
                return;
            }

            this.server.listen(this.port, this.host, () => {
                this.isRunning = true;
                resolve();
            });

            this.server.on('error', (err) => {
                reject(err);
            });
        });
    }

    /**
     * Get the base URL of the testing server
     */
    getUrl(): string {
        return this.baseUrl;
    }

    /**
     * Get the port
     */
    getPort(): number {
        return this.port;
    }

    /**
     * Find an available port for testing
     */
    private findAvailablePort(): number {
        // Start from a random port in the ephemeral range
        return Math.floor(Math.random() * (65535 - 49152) + 49152);
    }

    /**
     * Make a GET request
     */
    async get(
        path: string,
        options: Omit<IHttpTestRequest, 'method' | 'path'> = {},
    ): Promise<IHttpTestResponse> {
        return this.request({ ...options, method: 'GET', path });
    }

    /**
     * Make a POST request
     */
    async post(
        path: string,
        body?: any,
        options: Omit<IHttpTestRequest, 'method' | 'path' | 'body'> = {},
    ): Promise<IHttpTestResponse> {
        return this.request({ ...options, method: 'POST', path, body });
    }

    /**
     * Make a PUT request
     */
    async put(
        path: string,
        body?: any,
        options: Omit<IHttpTestRequest, 'method' | 'path' | 'body'> = {},
    ): Promise<IHttpTestResponse> {
        return this.request({ ...options, method: 'PUT', path, body });
    }

    /**
     * Make a DELETE request
     */
    async delete(
        path: string,
        options: Omit<IHttpTestRequest, 'method' | 'path'> = {},
    ): Promise<IHttpTestResponse> {
        return this.request({ ...options, method: 'DELETE', path });
    }

    /**
     * Make a PATCH request
     */
    async patch(
        path: string,
        body?: any,
        options: Omit<IHttpTestRequest, 'method' | 'path' | 'body'> = {},
    ): Promise<IHttpTestResponse> {
        return this.request({ ...options, method: 'PATCH', path, body });
    }

    /**
     * Make a generic HTTP request
     */
    async request(options: IHttpTestRequest): Promise<IHttpTestResponse> {
        const startTime = Date.now();
        const method = options.method || 'GET';
        let url = `${this.baseUrl}${options.path}`;

        // Add query parameters
        if (options.query && Object.keys(options.query).length > 0) {
            const params = new URLSearchParams();
            for (const [key, value] of Object.entries(options.query)) {
                params.append(key, String(value));
            }
            url += `?${params.toString()}`;
        }

        return new Promise((resolve, reject) => {
            const urlObj = new URL(url);

            const reqOptions: http.RequestOptions = {
                hostname: urlObj.hostname,
                port: urlObj.port,
                path: urlObj.pathname + urlObj.search,
                method: method,
                headers: {
                    'Content-Type': 'application/json',
                    ...options.headers,
                },
            };

            const req = http.request(reqOptions, (res) => {
                let data = '';

                res.on('data', (chunk) => {
                    data += chunk;
                });

                res.on('end', () => {
                    const responseTime = Date.now() - startTime;
                    let body: any;

                    try {
                        body = JSON.parse(data);
                    } catch {
                        body = data;
                    }

                    const headers: Record<string, string | string[]> = {};
                    for (const [key, value] of Object.entries(res.headers)) {
                        if (value !== undefined) {
                            headers[key] = value;
                        }
                    }

                    resolve({
                        status: res.statusCode || 0,
                        headers,
                        body,
                        text: data,
                        responseTime,
                    });
                });
            });

            req.on('error', (err) => {
                reject(err);
            });

            // Write body if present
            if (options.body) {
                const bodyStr =
                    typeof options.body === 'string'
                        ? options.body
                        : JSON.stringify(options.body);
                req.write(bodyStr);
            }

            req.end();
        });
    }

    /**
     * Close the testing server
     */
    async close(): Promise<void> {
        return new Promise((resolve, reject) => {
            if (!this.server || !this.isRunning) {
                resolve();
                return;
            }

            this.server.close((err) => {
                if (err) {
                    reject(err);
                } else {
                    this.isRunning = false;
                    this.server = null;
                    resolve();
                }
            });
        });
    }

    /**
     * Check if server is running
     */
    running(): boolean {
        return this.isRunning;
    }
}

/**
 * Helper function to create an HttpTestingServer from a TestingModule
 */
export async function createHttpTestingServer(
    module: ITestingModule,
): Promise<HttpTestingServer> {
    const server = new HttpTestingServer(module);
    await server.init();
    return server;
}

/**
 * Request builder for fluent API
 */
export class HttpRequestBuilder {
    private _method: IHttpTestRequest['method'] = 'GET';
    private _path: string = '/';
    private _headers: Record<string, string> = {};
    private _body: any;
    private _query: Record<string, string | number> = {};

    constructor(private server: HttpTestingServer) {}

    method(method: IHttpTestRequest['method']): HttpRequestBuilder {
        this._method = method;
        return this;
    }

    path(path: string): HttpRequestBuilder {
        this._path = path;
        return this;
    }

    header(key: string, value: string): HttpRequestBuilder {
        this._headers[key] = value;
        return this;
    }

    headers(headers: Record<string, string>): HttpRequestBuilder {
        this._headers = { ...this._headers, ...headers };
        return this;
    }

    body(body: any): HttpRequestBuilder {
        this._body = body;
        return this;
    }

    query(query: Record<string, string | number>): HttpRequestBuilder {
        this._query = { ...this._query, ...query };
        return this;
    }

    queryParam(key: string, value: string | number): HttpRequestBuilder {
        this._query[key] = value;
        return this;
    }

    auth(
        token: string,
        type: 'Bearer' | 'Basic' = 'Bearer',
    ): HttpRequestBuilder {
        this._headers['Authorization'] = `${type} ${token}`;
        return this;
    }

    contentType(type: string): HttpRequestBuilder {
        this._headers['Content-Type'] = type;
        return this;
    }

    accept(type: string): HttpRequestBuilder {
        this._headers['Accept'] = type;
        return this;
    }

    async send(): Promise<IHttpTestResponse> {
        return this.server.request({
            method: this._method,
            path: this._path,
            headers: this._headers,
            body: this._body,
            query: this._query,
        });
    }
}

/**
 * Response assertion helper
 */
export class HttpResponseAssert {
    constructor(private response: IHttpTestResponse) {}

    /**
     * Assert status code
     */
    status(expected: number): HttpResponseAssert {
        if (this.response.status !== expected) {
            throw new Error(
                `Expected status ${expected} but got ${this.response.status}`,
            );
        }
        return this;
    }

    /**
     * Assert status is 2xx
     */
    isOk(): HttpResponseAssert {
        if (this.response.status < 200 || this.response.status >= 300) {
            throw new Error(
                `Expected 2xx status but got ${this.response.status}`,
            );
        }
        return this;
    }

    /**
     * Assert status is 4xx
     */
    isClientError(): HttpResponseAssert {
        if (this.response.status < 400 || this.response.status >= 500) {
            throw new Error(
                `Expected 4xx status but got ${this.response.status}`,
            );
        }
        return this;
    }

    /**
     * Assert status is 5xx
     */
    isServerError(): HttpResponseAssert {
        if (this.response.status < 500 || this.response.status >= 600) {
            throw new Error(
                `Expected 5xx status but got ${this.response.status}`,
            );
        }
        return this;
    }

    /**
     * Assert header exists and optionally matches value
     */
    header(name: string, value?: string): HttpResponseAssert {
        const headerValue = this.response.headers[name.toLowerCase()];
        if (!headerValue) {
            throw new Error(`Expected header '${name}' to exist`);
        }
        if (value !== undefined) {
            const actualValue = Array.isArray(headerValue)
                ? headerValue[0]
                : headerValue;
            if (actualValue !== value) {
                throw new Error(
                    `Expected header '${name}' to be '${value}' but got '${actualValue}'`,
                );
            }
        }
        return this;
    }

    /**
     * Assert body matches
     */
    bodyEquals(expected: any): HttpResponseAssert {
        const actual = JSON.stringify(this.response.body);
        const exp = JSON.stringify(expected);
        if (actual !== exp) {
            throw new Error(`Expected body ${exp} but got ${actual}`);
        }
        return this;
    }

    /**
     * Assert body contains property
     */
    bodyHas(property: string): HttpResponseAssert {
        if (!(property in this.response.body)) {
            throw new Error(`Expected body to have property '${property}'`);
        }
        return this;
    }

    /**
     * Assert body property matches value
     */
    bodyProperty(property: string, expected: any): HttpResponseAssert {
        const actual = this.response.body[property];
        if (actual !== expected) {
            throw new Error(
                `Expected body.${property} to be ${expected} but got ${actual}`,
            );
        }
        return this;
    }

    /**
     * Assert response time is below threshold
     */
    responseTimeBelow(ms: number): HttpResponseAssert {
        if (this.response.responseTime > ms) {
            throw new Error(
                `Expected response time below ${ms}ms but got ${this.response.responseTime}ms`,
            );
        }
        return this;
    }

    /**
     * Get the response for further assertions
     */
    getResponse(): IHttpTestResponse {
        return this.response;
    }
}

/**
 * Create assertion helper from response
 */
export function assertResponse(
    response: IHttpTestResponse,
): HttpResponseAssert {
    return new HttpResponseAssert(response);
}
