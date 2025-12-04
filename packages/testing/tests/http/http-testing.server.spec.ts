import { describe, it, expect, vi, beforeEach, afterEach, afterAll, beforeAll } from 'vitest';
import * as http from 'node:http';

import {
    HttpTestingServer,
    createHttpTestingServer,
    HttpRequestBuilder,
    HttpResponseAssert,
    assertResponse,
    IHttpTestResponse,
} from '../../http/http-testing.server';

// Create a mock testing module
const createMockTestingModule = () => ({
    getApplication: vi.fn().mockReturnValue(null),
    get: vi.fn().mockReturnValue(null),
    resolve: vi.fn().mockResolvedValue(null),
    getHttpAdapter: vi.fn().mockReturnValue(null),
    getController: vi.fn().mockReturnValue(null),
    close: vi.fn().mockResolvedValue(undefined),
    init: vi.fn().mockResolvedValue({}),
});

describe('HttpTestingServer', () => {
    let testServer: http.Server;
    let testPort: number;

    beforeAll(() => {
        // Create a simple HTTP server for testing
        testPort = 49200 + Math.floor(Math.random() * 100);
        testServer = http.createServer((req, res) => {
            let body = '';
            req.on('data', chunk => {
                body += chunk;
            });
            req.on('end', () => {
                const url = new URL(req.url || '/', `http://localhost:${testPort}`);

                if (url.pathname === '/api/health') {
                    res.writeHead(200, { 'Content-Type': 'application/json' });
                    res.end(JSON.stringify({ status: 'ok' }));
                } else if (url.pathname === '/api/users' && req.method === 'GET') {
                    res.writeHead(200, { 'Content-Type': 'application/json' });
                    res.end(JSON.stringify({ users: [{ id: 1, name: 'Test' }] }));
                } else if (url.pathname === '/api/users' && req.method === 'POST') {
                    const data = body ? JSON.parse(body) : {};
                    res.writeHead(201, { 'Content-Type': 'application/json' });
                    res.end(JSON.stringify({ id: 1, ...data }));
                } else if (url.pathname === '/api/users/1' && req.method === 'PUT') {
                    const data = body ? JSON.parse(body) : {};
                    res.writeHead(200, { 'Content-Type': 'application/json' });
                    res.end(JSON.stringify({ id: 1, ...data }));
                } else if (url.pathname === '/api/users/1' && req.method === 'DELETE') {
                    res.writeHead(204);
                    res.end();
                } else if (url.pathname === '/api/echo') {
                    res.writeHead(200, { 'Content-Type': 'application/json' });
                    res.end(JSON.stringify({
                        method: req.method,
                        query: Object.fromEntries(url.searchParams),
                        headers: req.headers,
                    }));
                } else if (url.pathname === '/api/error') {
                    res.writeHead(500, { 'Content-Type': 'application/json' });
                    res.end(JSON.stringify({ error: 'Internal Server Error' }));
                } else if (url.pathname === '/api/unauthorized') {
                    res.writeHead(401, { 'Content-Type': 'application/json' });
                    res.end(JSON.stringify({ error: 'Unauthorized' }));
                } else {
                    res.writeHead(404, { 'Content-Type': 'application/json' });
                    res.end(JSON.stringify({ error: 'Not Found' }));
                }
            });
        });

        return new Promise<void>((resolve) => {
            testServer.listen(testPort, '127.0.0.1', () => {
                resolve();
            });
        });
    });

    afterAll(() => {
        return new Promise<void>((resolve) => {
            testServer.close(() => {
                resolve();
            });
        });
    });

    describe('constructor and init', () => {
        it('should create HttpTestingServer with a module', () => {
            const mockModule = createMockTestingModule();
            const server = new HttpTestingServer(mockModule as any);
            expect(server).toBeInstanceOf(HttpTestingServer);
        });

        it('should initialize with default options', async () => {
            const mockModule = createMockTestingModule();
            const server = new HttpTestingServer(mockModule as any);
            await server.init();

            expect(server.getUrl()).toMatch(/^http:\/\/127\.0\.0\.1:\d+$/);
            expect(server.getPort()).toBeGreaterThan(0);
        });

        it('should initialize with custom port and host', async () => {
            const mockModule = createMockTestingModule();
            const server = new HttpTestingServer(mockModule as any);
            await server.init({ port: 54321, host: '127.0.0.1' });

            expect(server.getUrl()).toBe('http://127.0.0.1:54321');
            expect(server.getPort()).toBe(54321);
        });
    });

    describe('createHttpTestingServer helper', () => {
        it('should create and initialize server', async () => {
            const mockModule = createMockTestingModule();
            const server = await createHttpTestingServer(mockModule as any);

            expect(server).toBeInstanceOf(HttpTestingServer);
            expect(server.getPort()).toBeGreaterThan(0);
        });
    });

    describe('HTTP methods', () => {
        // We'll test against our test server directly using fetch-like patterns
        let httpServer: HttpTestingServer;

        beforeEach(() => {
            const mockModule = createMockTestingModule();
            httpServer = new HttpTestingServer(mockModule as any);
        });

        it('should make GET requests', async () => {
            // Test directly using the test server's port
            const mockModule = createMockTestingModule();
            httpServer = new HttpTestingServer(mockModule as any);
            // Override the baseUrl to point to our test server
            (httpServer as any).baseUrl = `http://127.0.0.1:${testPort}`;

            const response = await httpServer.get('/api/health');

            expect(response.status).toBe(200);
            expect(response.body).toEqual({ status: 'ok' });
        });

        it('should make POST requests', async () => {
            (httpServer as any).baseUrl = `http://127.0.0.1:${testPort}`;

            const response = await httpServer.post('/api/users', { name: 'John' });

            expect(response.status).toBe(201);
            expect(response.body).toEqual({ id: 1, name: 'John' });
        });

        it('should make PUT requests', async () => {
            (httpServer as any).baseUrl = `http://127.0.0.1:${testPort}`;

            const response = await httpServer.put('/api/users/1', { name: 'Updated' });

            expect(response.status).toBe(200);
            expect(response.body).toEqual({ id: 1, name: 'Updated' });
        });

        it('should make DELETE requests', async () => {
            (httpServer as any).baseUrl = `http://127.0.0.1:${testPort}`;

            const response = await httpServer.delete('/api/users/1');

            expect(response.status).toBe(204);
        });

        it('should make PATCH requests', async () => {
            (httpServer as any).baseUrl = `http://127.0.0.1:${testPort}`;

            const response = await httpServer.patch('/api/users/1', { name: 'Patched' });

            // Our test server doesn't implement PATCH, so it returns 404
            expect(response.status).toBe(404);
        });

        it('should include query parameters', async () => {
            (httpServer as any).baseUrl = `http://127.0.0.1:${testPort}`;

            const response = await httpServer.get('/api/echo', {
                query: { foo: 'bar', num: 42 },
            });

            expect(response.status).toBe(200);
            expect(response.body.query).toEqual({ foo: 'bar', num: '42' });
        });

        it('should include custom headers', async () => {
            (httpServer as any).baseUrl = `http://127.0.0.1:${testPort}`;

            const response = await httpServer.get('/api/echo', {
                headers: { 'X-Custom-Header': 'test-value' },
            });

            expect(response.status).toBe(200);
            expect(response.body.headers['x-custom-header']).toBe('test-value');
        });

        it('should handle 404 responses', async () => {
            (httpServer as any).baseUrl = `http://127.0.0.1:${testPort}`;

            const response = await httpServer.get('/api/nonexistent');

            expect(response.status).toBe(404);
            expect(response.body.error).toBe('Not Found');
        });

        it('should handle 500 responses', async () => {
            (httpServer as any).baseUrl = `http://127.0.0.1:${testPort}`;

            const response = await httpServer.get('/api/error');

            expect(response.status).toBe(500);
            expect(response.body.error).toBe('Internal Server Error');
        });

        it('should track response time', async () => {
            (httpServer as any).baseUrl = `http://127.0.0.1:${testPort}`;

            const response = await httpServer.get('/api/health');

            expect(response.responseTime).toBeGreaterThanOrEqual(0);
            expect(response.responseTime).toBeLessThan(5000); // Should be fast
        });
    });
});

describe('HttpRequestBuilder', () => {
    let testServer: http.Server;
    let testPort: number;
    let httpServer: HttpTestingServer;

    beforeAll(() => {
        testPort = 49300 + Math.floor(Math.random() * 100);
        testServer = http.createServer((req, res) => {
            let body = '';
            req.on('data', chunk => { body += chunk; });
            req.on('end', () => {
                const url = new URL(req.url || '/', `http://localhost:${testPort}`);
                res.writeHead(200, { 'Content-Type': 'application/json' });
                res.end(JSON.stringify({
                    method: req.method,
                    path: url.pathname,
                    query: Object.fromEntries(url.searchParams),
                    headers: req.headers,
                    body: body ? JSON.parse(body) : null,
                }));
            });
        });

        return new Promise<void>((resolve) => {
            testServer.listen(testPort, '127.0.0.1', () => {
                resolve();
            });
        });
    });

    afterAll(() => {
        return new Promise<void>((resolve) => {
            testServer.close(() => {
                resolve();
            });
        });
    });

    beforeEach(() => {
        const mockModule = {
            getApplication: vi.fn(),
            get: vi.fn(),
            resolve: vi.fn(),
            getHttpAdapter: vi.fn().mockReturnValue(null),
            getController: vi.fn(),
            close: vi.fn(),
            init: vi.fn(),
        };
        httpServer = new HttpTestingServer(mockModule as any);
        (httpServer as any).baseUrl = `http://127.0.0.1:${testPort}`;
    });

    it('should build request with fluent API', async () => {
        const builder = new HttpRequestBuilder(httpServer);

        const response = await builder
            .method('POST')
            .path('/api/test')
            .header('X-Test', 'value')
            .body({ data: 'test' })
            .query({ page: 1 })
            .send();

        expect(response.body.method).toBe('POST');
        expect(response.body.path).toBe('/api/test');
        expect(response.body.headers['x-test']).toBe('value');
        expect(response.body.body).toEqual({ data: 'test' });
        expect(response.body.query).toEqual({ page: '1' });
    });

    it('should add authorization header', async () => {
        const builder = new HttpRequestBuilder(httpServer);

        const response = await builder
            .path('/api/test')
            .auth('my-token')
            .send();

        expect(response.body.headers['authorization']).toBe('Bearer my-token');
    });

    it('should add Basic authorization', async () => {
        const builder = new HttpRequestBuilder(httpServer);

        const response = await builder
            .path('/api/test')
            .auth('credentials', 'Basic')
            .send();

        expect(response.body.headers['authorization']).toBe('Basic credentials');
    });

    it('should set content type', async () => {
        const builder = new HttpRequestBuilder(httpServer);

        const response = await builder
            .path('/api/test')
            .contentType('text/plain')
            .send();

        expect(response.body.headers['content-type']).toBe('text/plain');
    });

    it('should set accept header', async () => {
        const builder = new HttpRequestBuilder(httpServer);

        const response = await builder
            .path('/api/test')
            .accept('application/xml')
            .send();

        expect(response.body.headers['accept']).toBe('application/xml');
    });

    it('should set multiple headers', async () => {
        const builder = new HttpRequestBuilder(httpServer);

        const response = await builder
            .path('/api/test')
            .headers({
                'X-First': 'one',
                'X-Second': 'two',
            })
            .send();

        expect(response.body.headers['x-first']).toBe('one');
        expect(response.body.headers['x-second']).toBe('two');
    });

    it('should add query params one by one', async () => {
        const builder = new HttpRequestBuilder(httpServer);

        const response = await builder
            .path('/api/test')
            .queryParam('a', 'one')
            .queryParam('b', 2)
            .send();

        expect(response.body.query).toEqual({ a: 'one', b: '2' });
    });
});

describe('HttpResponseAssert', () => {
    const createResponse = (overrides: Partial<IHttpTestResponse> = {}): IHttpTestResponse => ({
        status: 200,
        headers: { 'content-type': 'application/json' },
        body: { message: 'success', data: { id: 1 } },
        text: '{"message":"success","data":{"id":1}}',
        responseTime: 50,
        ...overrides,
    });

    describe('status assertions', () => {
        it('should assert exact status', () => {
            const response = createResponse({ status: 200 });
            const assert = assertResponse(response);

            expect(() => assert.status(200)).not.toThrow();
        });

        it('should throw for wrong status', () => {
            const response = createResponse({ status: 404 });
            const assert = assertResponse(response);

            expect(() => assert.status(200)).toThrow('Expected status 200 but got 404');
        });

        it('should assert isOk for 2xx', () => {
            const response = createResponse({ status: 201 });
            expect(() => assertResponse(response).isOk()).not.toThrow();
        });

        it('should throw isOk for non-2xx', () => {
            const response = createResponse({ status: 400 });
            expect(() => assertResponse(response).isOk()).toThrow('Expected 2xx status but got 400');
        });

        it('should assert isClientError for 4xx', () => {
            const response = createResponse({ status: 404 });
            expect(() => assertResponse(response).isClientError()).not.toThrow();
        });

        it('should throw isClientError for non-4xx', () => {
            const response = createResponse({ status: 200 });
            expect(() => assertResponse(response).isClientError()).toThrow('Expected 4xx status but got 200');
        });

        it('should assert isServerError for 5xx', () => {
            const response = createResponse({ status: 500 });
            expect(() => assertResponse(response).isServerError()).not.toThrow();
        });

        it('should throw isServerError for non-5xx', () => {
            const response = createResponse({ status: 200 });
            expect(() => assertResponse(response).isServerError()).toThrow('Expected 5xx status but got 200');
        });
    });

    describe('header assertions', () => {
        it('should assert header exists', () => {
            const response = createResponse({ headers: { 'content-type': 'application/json' } });
            expect(() => assertResponse(response).header('content-type')).not.toThrow();
        });

        it('should throw when header missing', () => {
            const response = createResponse({ headers: {} });
            expect(() => assertResponse(response).header('x-missing')).toThrow("Expected header 'x-missing' to exist");
        });

        it('should assert header value', () => {
            const response = createResponse({ headers: { 'content-type': 'application/json' } });
            expect(() => assertResponse(response).header('content-type', 'application/json')).not.toThrow();
        });

        it('should throw for wrong header value', () => {
            const response = createResponse({ headers: { 'content-type': 'text/html' } });
            expect(() => assertResponse(response).header('content-type', 'application/json'))
                .toThrow("Expected header 'content-type' to be 'application/json' but got 'text/html'");
        });
    });

    describe('body assertions', () => {
        it('should assert body equals', () => {
            const response = createResponse({ body: { id: 1 } });
            expect(() => assertResponse(response).bodyEquals({ id: 1 })).not.toThrow();
        });

        it('should throw for body mismatch', () => {
            const response = createResponse({ body: { id: 1 } });
            expect(() => assertResponse(response).bodyEquals({ id: 2 })).toThrow();
        });

        it('should assert body has property', () => {
            const response = createResponse({ body: { message: 'test' } });
            expect(() => assertResponse(response).bodyHas('message')).not.toThrow();
        });

        it('should throw when body missing property', () => {
            const response = createResponse({ body: {} });
            expect(() => assertResponse(response).bodyHas('missing')).toThrow("Expected body to have property 'missing'");
        });

        it('should assert body property value', () => {
            const response = createResponse({ body: { count: 5 } });
            expect(() => assertResponse(response).bodyProperty('count', 5)).not.toThrow();
        });

        it('should throw for wrong body property value', () => {
            const response = createResponse({ body: { count: 5 } });
            expect(() => assertResponse(response).bodyProperty('count', 10))
                .toThrow('Expected body.count to be 10 but got 5');
        });
    });

    describe('response time assertions', () => {
        it('should assert response time below threshold', () => {
            const response = createResponse({ responseTime: 50 });
            expect(() => assertResponse(response).responseTimeBelow(100)).not.toThrow();
        });

        it('should throw when response time exceeds threshold', () => {
            const response = createResponse({ responseTime: 150 });
            expect(() => assertResponse(response).responseTimeBelow(100))
                .toThrow('Expected response time below 100ms but got 150ms');
        });
    });

    describe('chaining', () => {
        it('should allow chaining multiple assertions', () => {
            const response = createResponse({
                status: 200,
                headers: { 'content-type': 'application/json' },
                body: { status: 'ok', count: 10 },
                responseTime: 30,
            });

            expect(() =>
                assertResponse(response)
                    .status(200)
                    .isOk()
                    .header('content-type', 'application/json')
                    .bodyHas('status')
                    .bodyProperty('count', 10)
                    .responseTimeBelow(100)
            ).not.toThrow();
        });

        it('should return response via getResponse', () => {
            const response = createResponse();
            const assert = assertResponse(response);

            expect(assert.getResponse()).toBe(response);
        });
    });
});
