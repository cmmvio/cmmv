import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import 'reflect-metadata';

// Mock dependencies
vi.mock('jsonwebtoken', () => ({
    default: {
        verify: vi.fn(),
    },
    verify: vi.fn(),
}));

vi.mock('@cmmv/core', () => ({
    Config: {
        get: vi.fn(),
    },
    Hooks: {
        execute: vi.fn(),
    },
    HooksType: {
        Log: 'log',
    },
    Logger: vi.fn().mockImplementation(() => ({
        warning: vi.fn(),
    })),
}));

vi.mock('@cmmv/http', () => ({
    generateFingerprint: vi.fn(),
}));

vi.mock('../services/sessions.service', () => ({
    AuthSessionsService: {
        validateRefreshToken: vi.fn(),
        validateSession: vi.fn(),
    },
}));

vi.mock('../lib/auth.utils', () => ({
    decryptJWTData: vi.fn((data) => data),
}));

import { Auth } from '../lib/auth.decorator';
import { Config, Hooks } from '@cmmv/core';
import * as jwt from 'jsonwebtoken';
import { AuthSessionsService } from '../services/sessions.service';

describe('Auth Decorator', () => {
    let mockRequest: any;
    let mockResponse: any;
    let mockNext: any;

    beforeEach(() => {
        vi.clearAllMocks();

        mockRequest = {
            cookies: { token: 'sessionId123', refreshToken: 'refreshToken123' },
            session: {
                get: vi.fn().mockResolvedValue({ user: { token: 'validToken' } }),
            },
            method: 'GET',
            path: '/test',
            req: {
                headers: { authorization: 'Bearer validToken', 'user-agent': 'test-agent' },
                socket: { remoteAddress: '127.0.0.1' },
            },
        };

        mockResponse = {
            code: vi.fn().mockReturnThis(),
            end: vi.fn().mockReturnThis(),
        };

        mockNext = vi.fn();

        // Default config mocks
        vi.mocked(Config.get).mockImplementation((key: string, defaultValue?: any) => {
            const configs: Record<string, any> = {
                'server.session.options.sessionCookieName': 'token',
                'server.session.enabled': true,
                'auth.refreshCookieName': 'refreshToken',
                'server.logging': 'all',
                'auth.jwtSecret': 'test-secret',
            };
            return configs[key] ?? defaultValue;
        });
    });

    afterEach(() => {
        vi.clearAllMocks();
    });

    describe('decorator application', () => {
        it('should create a method decorator', () => {
            const decorator = Auth();
            expect(typeof decorator).toBe('function');
        });

        it('should accept string array roles', () => {
            const decorator = Auth(['admin', 'user']);
            expect(typeof decorator).toBe('function');
        });

        it('should accept single string role', () => {
            const decorator = Auth('admin');
            expect(typeof decorator).toBe('function');
        });

        it('should accept settings object', () => {
            const decorator = Auth({ rootOnly: true });
            expect(typeof decorator).toBe('function');
        });

        it('should accept settings object with roles', () => {
            const decorator = Auth({ roles: ['admin', 'moderator'] });
            expect(typeof decorator).toBe('function');
        });
    });

    describe('middleware metadata', () => {
        it('should add middleware to route metadata', () => {
            const target = {};
            const descriptor = {
                value: function testMethod() {},
            };

            const decorator = Auth();
            decorator(target, 'testMethod', descriptor);

            const metadata = Reflect.getMetadata('route_metadata', descriptor.value);
            expect(metadata).toBeDefined();
            expect(metadata.middleware).toBeDefined();
            expect(metadata.middleware.length).toBeGreaterThan(0);
        });

        it('should append to existing middleware', () => {
            const target = {};
            const descriptor = {
                value: function testMethod() {},
            };

            // Add existing middleware
            Reflect.defineMetadata(
                'route_metadata',
                { middleware: [() => {}] },
                descriptor.value,
            );

            const decorator = Auth();
            decorator(target, 'testMethod', descriptor);

            const metadata = Reflect.getMetadata('route_metadata', descriptor.value);
            expect(metadata.middleware.length).toBe(2);
        });
    });

    describe('authentication flow', () => {
        it('should return 401 when no token is provided', async () => {
            const target = {};
            const descriptor = {
                value: function testMethod() {},
            };

            mockRequest.cookies = {};
            mockRequest.session = { get: vi.fn().mockResolvedValue(null) };
            mockRequest.req.headers = { 'user-agent': 'test-agent' };

            const decorator = Auth();
            decorator(target, 'testMethod', descriptor);

            const metadata = Reflect.getMetadata('route_metadata', descriptor.value);
            const middleware = metadata.middleware[0];

            await middleware(mockRequest, mockResponse, mockNext);

            expect(mockResponse.code).toHaveBeenCalledWith(401);
            expect(mockResponse.end).toHaveBeenCalledWith('Unauthorized');
            expect(mockNext).not.toHaveBeenCalled();
        });

        it('should handle token from authorization header', async () => {
            const target = {};
            const descriptor = {
                value: function testMethod() {},
            };

            mockRequest.cookies = {};
            mockRequest.session = { get: vi.fn().mockResolvedValue(null) };
            mockRequest.req.headers = {
                authorization: 'Bearer validToken',
                'user-agent': 'test-agent',
            };

            vi.mocked(jwt.verify).mockImplementation((token, secret, callback: any) => {
                callback(null, {
                    id: 'user-123',
                    username: 'testuser',
                    roles: ['user'],
                    root: false,
                });
            });

            vi.mocked(AuthSessionsService.validateSession).mockResolvedValue(true);

            const decorator = Auth();
            decorator(target, 'testMethod', descriptor);

            const metadata = Reflect.getMetadata('route_metadata', descriptor.value);
            const middleware = metadata.middleware[0];

            await middleware(mockRequest, mockResponse, mockNext);

            expect(jwt.verify).toHaveBeenCalled();
        });

        it('should reject null string tokens', async () => {
            const target = {};
            const descriptor = {
                value: function testMethod() {},
            };

            mockRequest.cookies = {};
            mockRequest.session = { get: vi.fn().mockResolvedValue(null) };
            mockRequest.req.headers = {
                authorization: 'Bearer null',
                'user-agent': 'test-agent',
            };

            const decorator = Auth();
            decorator(target, 'testMethod', descriptor);

            const metadata = Reflect.getMetadata('route_metadata', descriptor.value);
            const middleware = metadata.middleware[0];

            await middleware(mockRequest, mockResponse, mockNext);

            expect(mockResponse.code).toHaveBeenCalledWith(401);
        });

        it('should reject undefined string tokens', async () => {
            const target = {};
            const descriptor = {
                value: function testMethod() {},
            };

            mockRequest.cookies = {};
            mockRequest.session = { get: vi.fn().mockResolvedValue(null) };
            mockRequest.req.headers = {
                authorization: 'Bearer undefined',
                'user-agent': 'test-agent',
            };

            const decorator = Auth();
            decorator(target, 'testMethod', descriptor);

            const metadata = Reflect.getMetadata('route_metadata', descriptor.value);
            const middleware = metadata.middleware[0];

            await middleware(mockRequest, mockResponse, mockNext);

            expect(mockResponse.code).toHaveBeenCalledWith(401);
        });
    });

    describe('role-based access', () => {
        it('should allow root users to bypass role checks', async () => {
            const target = {};
            const descriptor = {
                value: function testMethod() {},
            };

            mockRequest.cookies = {};
            mockRequest.session = { get: vi.fn().mockResolvedValue(null) };
            mockRequest.req.headers = {
                authorization: 'Bearer validToken',
                'user-agent': 'test-agent',
            };

            vi.mocked(jwt.verify).mockImplementation((token, secret, callback: any) => {
                callback(null, {
                    id: 'admin-123',
                    username: 'admin',
                    roles: [],
                    root: true,
                });
            });

            const decorator = Auth(['admin']);
            decorator(target, 'testMethod', descriptor);

            const metadata = Reflect.getMetadata('route_metadata', descriptor.value);
            const middleware = metadata.middleware[0];

            await middleware(mockRequest, mockResponse, mockNext);

            expect(mockNext).toHaveBeenCalled();
        });

        it('should reject non-root users when rootOnly is set', async () => {
            const target = {};
            const descriptor = {
                value: function testMethod() {},
            };

            mockRequest.cookies = {};
            mockRequest.session = { get: vi.fn().mockResolvedValue(null) };
            mockRequest.req.headers = {
                authorization: 'Bearer validToken',
                'user-agent': 'test-agent',
            };

            vi.mocked(jwt.verify).mockImplementation((token, secret, callback: any) => {
                callback(null, {
                    id: 'user-123',
                    username: 'testuser',
                    roles: ['user'],
                    root: false,
                });
            });

            const decorator = Auth({ rootOnly: true });
            decorator(target, 'testMethod', descriptor);

            const metadata = Reflect.getMetadata('route_metadata', descriptor.value);
            const middleware = metadata.middleware[0];

            await middleware(mockRequest, mockResponse, mockNext);

            expect(mockResponse.code).toHaveBeenCalledWith(401);
        });
    });

    describe('session validation', () => {
        it('should get token from session when session is enabled', async () => {
            const target = {};
            const descriptor = {
                value: function testMethod() {},
            };

            mockRequest.cookies = { token: 'sessionId123' };
            mockRequest.session = {
                get: vi.fn().mockResolvedValue({ user: { token: 'sessionToken' } }),
            };

            vi.mocked(jwt.verify).mockImplementation((token, secret, callback: any) => {
                callback(null, {
                    id: 'user-123',
                    username: 'testuser',
                    roles: ['user'],
                    root: false,
                });
            });

            vi.mocked(AuthSessionsService.validateSession).mockResolvedValue(true);

            const decorator = Auth();
            decorator(target, 'testMethod', descriptor);

            const metadata = Reflect.getMetadata('route_metadata', descriptor.value);
            const middleware = metadata.middleware[0];

            await middleware(mockRequest, mockResponse, mockNext);

            expect(mockRequest.session.get).toHaveBeenCalledWith('sessionId123');
        });
    });

    describe('JWT verification', () => {
        it('should return 401 when JWT verification fails', async () => {
            const target = {};
            const descriptor = {
                value: function testMethod() {},
            };

            mockRequest.cookies = {};
            mockRequest.session = { get: vi.fn().mockResolvedValue(null) };
            mockRequest.req.headers = {
                authorization: 'Bearer invalidToken',
                'user-agent': 'test-agent',
            };

            vi.mocked(jwt.verify).mockImplementation((token, secret, callback: any) => {
                callback(new Error('Invalid token'), null);
            });

            vi.mocked(AuthSessionsService.validateRefreshToken).mockResolvedValue(false);

            const decorator = Auth();
            decorator(target, 'testMethod', descriptor);

            const metadata = Reflect.getMetadata('route_metadata', descriptor.value);
            const middleware = metadata.middleware[0];

            await middleware(mockRequest, mockResponse, mockNext);

            expect(mockResponse.code).toHaveBeenCalledWith(401);
        });

        it('should try refresh token when JWT is expired', async () => {
            const target = {};
            const descriptor = {
                value: function testMethod() {},
            };

            mockRequest.cookies = { refreshToken: 'validRefreshToken' };
            mockRequest.session = { get: vi.fn().mockResolvedValue(null) };
            mockRequest.req.headers = {
                authorization: 'Bearer expiredToken',
                'user-agent': 'test-agent',
            };

            vi.mocked(jwt.verify).mockImplementation((token, secret, callback: any) => {
                callback(new Error('Token expired'), null);
            });

            vi.mocked(AuthSessionsService.validateRefreshToken).mockResolvedValue(true);

            const decorator = Auth();
            decorator(target, 'testMethod', descriptor);

            const metadata = Reflect.getMetadata('route_metadata', descriptor.value);
            const middleware = metadata.middleware[0];

            await middleware(mockRequest, mockResponse, mockNext);

            expect(AuthSessionsService.validateRefreshToken).toHaveBeenCalledWith('validRefreshToken');
        });
    });

    describe('logging', () => {
        it('should execute log hooks on unauthorized access', async () => {
            const target = {};
            const descriptor = {
                value: function testMethod() {},
            };

            mockRequest.cookies = {};
            mockRequest.session = { get: vi.fn().mockResolvedValue(null) };
            mockRequest.req.headers = { 'user-agent': 'test-agent' };

            const decorator = Auth();
            decorator(target, 'testMethod', descriptor);

            const metadata = Reflect.getMetadata('route_metadata', descriptor.value);
            const middleware = metadata.middleware[0];

            await middleware(mockRequest, mockResponse, mockNext);

            expect(Hooks.execute).toHaveBeenCalled();
        });
    });
});
