import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import 'reflect-metadata';

import { CacheControl } from '../../decorators/cache-control.decorator';
import { ContentType } from '../../decorators/content-type.decorator';
import { Expires } from '../../decorators/expires.decorator';
import { HttpCode } from '../../decorators/http-code.decorator';
import { LastModified } from '../../decorators/last-modified.decorator';
import { Redirect } from '../../decorators/redirect.decorator';
import { createRouteMiddleware } from '../../decorators/route-middleware.util';

describe('HTTP Decorators', () => {
    beforeEach(() => {
        vi.clearAllMocks();
    });

    afterEach(() => {
        vi.clearAllMocks();
    });

    describe('createRouteMiddleware', () => {
        it('should add middleware to route metadata', () => {
            const middleware = vi.fn();
            const descriptor = { value: vi.fn() };

            createRouteMiddleware(middleware, descriptor);

            const metadata = Reflect.getMetadata(
                'route_metadata',
                descriptor.value,
            );
            expect(metadata.middleware).toContain(middleware);
        });

        it('should append to existing middleware array', () => {
            const middleware1 = vi.fn();
            const middleware2 = vi.fn();
            const descriptor = { value: vi.fn() };

            createRouteMiddleware(middleware1, descriptor);
            createRouteMiddleware(middleware2, descriptor);

            const metadata = Reflect.getMetadata(
                'route_metadata',
                descriptor.value,
            );
            expect(metadata.middleware).toHaveLength(2);
            expect(metadata.middleware).toContain(middleware1);
            expect(metadata.middleware).toContain(middleware2);
        });

        it('should preserve existing metadata fields', () => {
            const descriptor = { value: vi.fn() };
            Reflect.defineMetadata(
                'route_metadata',
                { existingField: 'value' },
                descriptor.value,
            );

            createRouteMiddleware(vi.fn(), descriptor);

            const metadata = Reflect.getMetadata(
                'route_metadata',
                descriptor.value,
            );
            expect(metadata.existingField).toBe('value');
            expect(metadata.middleware).toBeDefined();
        });
    });

    describe('CacheControl', () => {
        it('should create decorator with public directive', () => {
            class TestController {
                @CacheControl({ public: true })
                handler() {}
            }

            const metadata = Reflect.getMetadata(
                'route_metadata',
                TestController.prototype.handler,
            );
            expect(metadata.middleware).toHaveLength(1);
        });

        it('should set Cache-Control header with public', async () => {
            class TestController {
                @CacheControl({ public: true })
                handler() {}
            }

            const metadata = Reflect.getMetadata(
                'route_metadata',
                TestController.prototype.handler,
            );
            const middleware = metadata.middleware[0];

            const response = { setHeader: vi.fn() };
            const next = vi.fn();

            await middleware({}, response, next);

            expect(response.setHeader).toHaveBeenCalledWith(
                'Cache-Control',
                'public',
            );
            expect(next).toHaveBeenCalled();
        });

        it('should set Cache-Control header with private', async () => {
            class TestController {
                @CacheControl({ private: true })
                handler() {}
            }

            const metadata = Reflect.getMetadata(
                'route_metadata',
                TestController.prototype.handler,
            );
            const middleware = metadata.middleware[0];

            const response = { setHeader: vi.fn() };
            await middleware({}, response, vi.fn());

            expect(response.setHeader).toHaveBeenCalledWith(
                'Cache-Control',
                'private',
            );
        });

        it('should set Cache-Control with no-store', async () => {
            class TestController {
                @CacheControl({ noStore: true })
                handler() {}
            }

            const metadata = Reflect.getMetadata(
                'route_metadata',
                TestController.prototype.handler,
            );
            const middleware = metadata.middleware[0];

            const response = { setHeader: vi.fn() };
            await middleware({}, response, vi.fn());

            expect(response.setHeader).toHaveBeenCalledWith(
                'Cache-Control',
                'no-store',
            );
        });

        it('should set Cache-Control with no-cache', async () => {
            class TestController {
                @CacheControl({ noCache: true })
                handler() {}
            }

            const metadata = Reflect.getMetadata(
                'route_metadata',
                TestController.prototype.handler,
            );
            const middleware = metadata.middleware[0];

            const response = { setHeader: vi.fn() };
            await middleware({}, response, vi.fn());

            expect(response.setHeader).toHaveBeenCalledWith(
                'Cache-Control',
                'no-cache',
            );
        });

        it('should set Cache-Control with must-revalidate', async () => {
            class TestController {
                @CacheControl({ mustRevalidate: true })
                handler() {}
            }

            const metadata = Reflect.getMetadata(
                'route_metadata',
                TestController.prototype.handler,
            );
            const middleware = metadata.middleware[0];

            const response = { setHeader: vi.fn() };
            await middleware({}, response, vi.fn());

            expect(response.setHeader).toHaveBeenCalledWith(
                'Cache-Control',
                'must-revalidate',
            );
        });

        it('should set Cache-Control with proxy-revalidate', async () => {
            class TestController {
                @CacheControl({ proxyRevalidate: true })
                handler() {}
            }

            const metadata = Reflect.getMetadata(
                'route_metadata',
                TestController.prototype.handler,
            );
            const middleware = metadata.middleware[0];

            const response = { setHeader: vi.fn() };
            await middleware({}, response, vi.fn());

            expect(response.setHeader).toHaveBeenCalledWith(
                'Cache-Control',
                'proxy-revalidate',
            );
        });

        it('should set Cache-Control with immutable', async () => {
            class TestController {
                @CacheControl({ immutable: true })
                handler() {}
            }

            const metadata = Reflect.getMetadata(
                'route_metadata',
                TestController.prototype.handler,
            );
            const middleware = metadata.middleware[0];

            const response = { setHeader: vi.fn() };
            await middleware({}, response, vi.fn());

            expect(response.setHeader).toHaveBeenCalledWith(
                'Cache-Control',
                'immutable',
            );
        });

        it('should set Cache-Control with max-age', async () => {
            class TestController {
                @CacheControl({ maxAge: 3600 })
                handler() {}
            }

            const metadata = Reflect.getMetadata(
                'route_metadata',
                TestController.prototype.handler,
            );
            const middleware = metadata.middleware[0];

            const response = { setHeader: vi.fn() };
            await middleware({}, response, vi.fn());

            expect(response.setHeader).toHaveBeenCalledWith(
                'Cache-Control',
                'max-age=3600',
            );
        });

        it('should set Cache-Control with s-maxage', async () => {
            class TestController {
                @CacheControl({ sMaxAge: 7200 })
                handler() {}
            }

            const metadata = Reflect.getMetadata(
                'route_metadata',
                TestController.prototype.handler,
            );
            const middleware = metadata.middleware[0];

            const response = { setHeader: vi.fn() };
            await middleware({}, response, vi.fn());

            expect(response.setHeader).toHaveBeenCalledWith(
                'Cache-Control',
                's-maxage=7200',
            );
        });

        it('should set Cache-Control with stale-while-revalidate', async () => {
            class TestController {
                @CacheControl({ staleWhileRevalidate: 60 })
                handler() {}
            }

            const metadata = Reflect.getMetadata(
                'route_metadata',
                TestController.prototype.handler,
            );
            const middleware = metadata.middleware[0];

            const response = { setHeader: vi.fn() };
            await middleware({}, response, vi.fn());

            expect(response.setHeader).toHaveBeenCalledWith(
                'Cache-Control',
                'stale-while-revalidate=60',
            );
        });

        it('should set Cache-Control with stale-if-error', async () => {
            class TestController {
                @CacheControl({ staleIfError: 120 })
                handler() {}
            }

            const metadata = Reflect.getMetadata(
                'route_metadata',
                TestController.prototype.handler,
            );
            const middleware = metadata.middleware[0];

            const response = { setHeader: vi.fn() };
            await middleware({}, response, vi.fn());

            expect(response.setHeader).toHaveBeenCalledWith(
                'Cache-Control',
                'stale-if-error=120',
            );
        });

        it('should combine multiple directives', async () => {
            class TestController {
                @CacheControl({
                    public: true,
                    maxAge: 3600,
                    mustRevalidate: true,
                })
                handler() {}
            }

            const metadata = Reflect.getMetadata(
                'route_metadata',
                TestController.prototype.handler,
            );
            const middleware = metadata.middleware[0];

            const response = { setHeader: vi.fn() };
            await middleware({}, response, vi.fn());

            expect(response.setHeader).toHaveBeenCalledWith(
                'Cache-Control',
                'public, must-revalidate, max-age=3600',
            );
        });

        it('should handle zero max-age', async () => {
            class TestController {
                @CacheControl({ maxAge: 0 })
                handler() {}
            }

            const metadata = Reflect.getMetadata(
                'route_metadata',
                TestController.prototype.handler,
            );
            const middleware = metadata.middleware[0];

            const response = { setHeader: vi.fn() };
            await middleware({}, response, vi.fn());

            expect(response.setHeader).toHaveBeenCalledWith(
                'Cache-Control',
                'max-age=0',
            );
        });

        it('should work without next function', async () => {
            class TestController {
                @CacheControl({ public: true })
                handler() {}
            }

            const metadata = Reflect.getMetadata(
                'route_metadata',
                TestController.prototype.handler,
            );
            const middleware = metadata.middleware[0];

            const response = { setHeader: vi.fn() };

            await expect(middleware({}, response)).resolves.not.toThrow();
        });
    });

    describe('ContentType', () => {
        it('should set Content-Type header', async () => {
            class TestController {
                @ContentType('application/json')
                handler() {}
            }

            const metadata = Reflect.getMetadata(
                'route_metadata',
                TestController.prototype.handler,
            );
            const middleware = metadata.middleware[0];

            const response = { setHeader: vi.fn() };
            const next = vi.fn();

            await middleware({}, response, next);

            expect(response.setHeader).toHaveBeenCalledWith(
                'Content-Type',
                'application/json',
            );
            expect(next).toHaveBeenCalled();
        });

        it('should set text/html content type', async () => {
            class TestController {
                @ContentType('text/html')
                handler() {}
            }

            const metadata = Reflect.getMetadata(
                'route_metadata',
                TestController.prototype.handler,
            );
            const middleware = metadata.middleware[0];

            const response = { setHeader: vi.fn() };
            await middleware({}, response, vi.fn());

            expect(response.setHeader).toHaveBeenCalledWith(
                'Content-Type',
                'text/html',
            );
        });

        it('should set content type with charset', async () => {
            class TestController {
                @ContentType('text/html; charset=utf-8')
                handler() {}
            }

            const metadata = Reflect.getMetadata(
                'route_metadata',
                TestController.prototype.handler,
            );
            const middleware = metadata.middleware[0];

            const response = { setHeader: vi.fn() };
            await middleware({}, response, vi.fn());

            expect(response.setHeader).toHaveBeenCalledWith(
                'Content-Type',
                'text/html; charset=utf-8',
            );
        });

        it('should set image content type', async () => {
            class TestController {
                @ContentType('image/png')
                handler() {}
            }

            const metadata = Reflect.getMetadata(
                'route_metadata',
                TestController.prototype.handler,
            );
            const middleware = metadata.middleware[0];

            const response = { setHeader: vi.fn() };
            await middleware({}, response, vi.fn());

            expect(response.setHeader).toHaveBeenCalledWith(
                'Content-Type',
                'image/png',
            );
        });
    });

    describe('Expires', () => {
        it('should set Expires header', async () => {
            class TestController {
                @Expires(3600)
                handler() {}
            }

            const metadata = Reflect.getMetadata(
                'route_metadata',
                TestController.prototype.handler,
            );
            const middleware = metadata.middleware[0];

            const response = { setHeader: vi.fn() };
            const next = vi.fn();

            await middleware({}, response, next);

            expect(response.setHeader).toHaveBeenCalledWith(
                'Expires',
                expect.any(String),
            );
            expect(next).toHaveBeenCalled();
        });

        it('should set future date for positive seconds', async () => {
            const now = Date.now();
            vi.spyOn(Date, 'now').mockReturnValue(now);

            class TestController {
                @Expires(3600)
                handler() {}
            }

            const metadata = Reflect.getMetadata(
                'route_metadata',
                TestController.prototype.handler,
            );
            const middleware = metadata.middleware[0];

            const response = { setHeader: vi.fn() };
            await middleware({}, response, vi.fn());

            const expectedDate = new Date(now + 3600 * 1000).toUTCString();
            expect(response.setHeader).toHaveBeenCalledWith(
                'Expires',
                expectedDate,
            );

            vi.restoreAllMocks();
        });

        it('should handle zero seconds', async () => {
            class TestController {
                @Expires(0)
                handler() {}
            }

            const metadata = Reflect.getMetadata(
                'route_metadata',
                TestController.prototype.handler,
            );
            const middleware = metadata.middleware[0];

            const response = { setHeader: vi.fn() };
            await middleware({}, response, vi.fn());

            expect(response.setHeader).toHaveBeenCalledWith(
                'Expires',
                expect.any(String),
            );
        });
    });

    describe('HttpCode', () => {
        it('should set HTTP status code', async () => {
            class TestController {
                @HttpCode(201)
                handler() {}
            }

            const metadata = Reflect.getMetadata(
                'route_metadata',
                TestController.prototype.handler,
            );
            const middleware = metadata.middleware[0];

            const response = { code: vi.fn() };
            const next = vi.fn();

            await middleware({}, response, next);

            expect(response.code).toHaveBeenCalledWith(201);
            expect(next).toHaveBeenCalled();
        });

        it('should set 200 OK', async () => {
            class TestController {
                @HttpCode(200)
                handler() {}
            }

            const metadata = Reflect.getMetadata(
                'route_metadata',
                TestController.prototype.handler,
            );
            const middleware = metadata.middleware[0];

            const response = { code: vi.fn() };
            await middleware({}, response, vi.fn());

            expect(response.code).toHaveBeenCalledWith(200);
        });

        it('should set 204 No Content', async () => {
            class TestController {
                @HttpCode(204)
                handler() {}
            }

            const metadata = Reflect.getMetadata(
                'route_metadata',
                TestController.prototype.handler,
            );
            const middleware = metadata.middleware[0];

            const response = { code: vi.fn() };
            await middleware({}, response, vi.fn());

            expect(response.code).toHaveBeenCalledWith(204);
        });

        it('should set 400 Bad Request', async () => {
            class TestController {
                @HttpCode(400)
                handler() {}
            }

            const metadata = Reflect.getMetadata(
                'route_metadata',
                TestController.prototype.handler,
            );
            const middleware = metadata.middleware[0];

            const response = { code: vi.fn() };
            await middleware({}, response, vi.fn());

            expect(response.code).toHaveBeenCalledWith(400);
        });

        it('should set 404 Not Found', async () => {
            class TestController {
                @HttpCode(404)
                handler() {}
            }

            const metadata = Reflect.getMetadata(
                'route_metadata',
                TestController.prototype.handler,
            );
            const middleware = metadata.middleware[0];

            const response = { code: vi.fn() };
            await middleware({}, response, vi.fn());

            expect(response.code).toHaveBeenCalledWith(404);
        });

        it('should set 500 Internal Server Error', async () => {
            class TestController {
                @HttpCode(500)
                handler() {}
            }

            const metadata = Reflect.getMetadata(
                'route_metadata',
                TestController.prototype.handler,
            );
            const middleware = metadata.middleware[0];

            const response = { code: vi.fn() };
            await middleware({}, response, vi.fn());

            expect(response.code).toHaveBeenCalledWith(500);
        });
    });

    describe('LastModified', () => {
        it('should set Last-Modified header with Date object', async () => {
            const date = new Date('2024-01-15T10:30:00Z');

            class TestController {
                @LastModified(date)
                handler() {}
            }

            const metadata = Reflect.getMetadata(
                'route_metadata',
                TestController.prototype.handler,
            );
            const middleware = metadata.middleware[0];

            const response = { setHeader: vi.fn() };
            const next = vi.fn();

            await middleware({}, response, next);

            expect(response.setHeader).toHaveBeenCalledWith(
                'Last-Modified',
                date.toUTCString(),
            );
            expect(next).toHaveBeenCalled();
        });

        it('should set Last-Modified header with timestamp number', async () => {
            const timestamp = 1705315800000; // 2024-01-15T10:30:00Z

            class TestController {
                @LastModified(timestamp)
                handler() {}
            }

            const metadata = Reflect.getMetadata(
                'route_metadata',
                TestController.prototype.handler,
            );
            const middleware = metadata.middleware[0];

            const response = { setHeader: vi.fn() };
            await middleware({}, response, vi.fn());

            expect(response.setHeader).toHaveBeenCalledWith(
                'Last-Modified',
                new Date(timestamp).toUTCString(),
            );
        });

        it('should handle epoch timestamp (0)', async () => {
            class TestController {
                @LastModified(0)
                handler() {}
            }

            const metadata = Reflect.getMetadata(
                'route_metadata',
                TestController.prototype.handler,
            );
            const middleware = metadata.middleware[0];

            const response = { setHeader: vi.fn() };
            await middleware({}, response, vi.fn());

            expect(response.setHeader).toHaveBeenCalledWith(
                'Last-Modified',
                new Date(0).toUTCString(),
            );
        });
    });

    describe('Redirect', () => {
        it('should redirect with 301 status', async () => {
            class TestController {
                @Redirect('https://example.com', 301)
                handler() {}
            }

            const metadata = Reflect.getMetadata(
                'route_metadata',
                TestController.prototype.handler,
            );
            const middleware = metadata.middleware[0];

            const response = {
                res: {
                    writeHead: vi.fn(),
                    end: vi.fn(),
                },
            };

            await middleware({}, response);

            expect(response.res.writeHead).toHaveBeenCalledWith(301, {
                Location: 'https://example.com',
            });
            expect(response.res.end).toHaveBeenCalled();
        });

        it('should redirect with 302 status', async () => {
            class TestController {
                @Redirect('/new-path', 302)
                handler() {}
            }

            const metadata = Reflect.getMetadata(
                'route_metadata',
                TestController.prototype.handler,
            );
            const middleware = metadata.middleware[0];

            const response = {
                res: {
                    writeHead: vi.fn(),
                    end: vi.fn(),
                },
            };

            await middleware({}, response);

            expect(response.res.writeHead).toHaveBeenCalledWith(302, {
                Location: '/new-path',
            });
        });

        it('should redirect with 307 status', async () => {
            class TestController {
                @Redirect('/temporary', 307)
                handler() {}
            }

            const metadata = Reflect.getMetadata(
                'route_metadata',
                TestController.prototype.handler,
            );
            const middleware = metadata.middleware[0];

            const response = {
                res: {
                    writeHead: vi.fn(),
                    end: vi.fn(),
                },
            };

            await middleware({}, response);

            expect(response.res.writeHead).toHaveBeenCalledWith(307, {
                Location: '/temporary',
            });
        });

        it('should redirect with 308 status', async () => {
            class TestController {
                @Redirect('/permanent', 308)
                handler() {}
            }

            const metadata = Reflect.getMetadata(
                'route_metadata',
                TestController.prototype.handler,
            );
            const middleware = metadata.middleware[0];

            const response = {
                res: {
                    writeHead: vi.fn(),
                    end: vi.fn(),
                },
            };

            await middleware({}, response);

            expect(response.res.writeHead).toHaveBeenCalledWith(308, {
                Location: '/permanent',
            });
        });

        it('should not redirect if response.res is undefined', async () => {
            class TestController {
                @Redirect('/path', 301)
                handler() {}
            }

            const metadata = Reflect.getMetadata(
                'route_metadata',
                TestController.prototype.handler,
            );
            const middleware = metadata.middleware[0];

            const response = {};

            await expect(middleware({}, response)).resolves.not.toThrow();
        });

        it('should handle external URLs', async () => {
            class TestController {
                @Redirect('https://external-site.com/page', 302)
                handler() {}
            }

            const metadata = Reflect.getMetadata(
                'route_metadata',
                TestController.prototype.handler,
            );
            const middleware = metadata.middleware[0];

            const response = {
                res: {
                    writeHead: vi.fn(),
                    end: vi.fn(),
                },
            };

            await middleware({}, response);

            expect(response.res.writeHead).toHaveBeenCalledWith(302, {
                Location: 'https://external-site.com/page',
            });
        });
    });

    describe('decorator combinations', () => {
        it('should allow multiple decorators on same method', () => {
            class TestController {
                @CacheControl({ public: true, maxAge: 3600 })
                @ContentType('application/json')
                @HttpCode(200)
                handler() {}
            }

            const metadata = Reflect.getMetadata(
                'route_metadata',
                TestController.prototype.handler,
            );

            expect(metadata.middleware).toHaveLength(3);
        });

        it('should execute all middleware in order', async () => {
            class TestController {
                @CacheControl({ public: true })
                @ContentType('text/plain')
                handler() {}
            }

            const metadata = Reflect.getMetadata(
                'route_metadata',
                TestController.prototype.handler,
            );

            const response = { setHeader: vi.fn() };
            const next = vi.fn();

            for (const middleware of metadata.middleware) {
                await middleware({}, response, next);
            }

            expect(response.setHeader).toHaveBeenCalledTimes(2);
            expect(next).toHaveBeenCalledTimes(2);
        });
    });
});
