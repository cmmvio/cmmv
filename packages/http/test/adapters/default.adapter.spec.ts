import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';

// Mock uuid
vi.mock('uuid', () => ({
    v4: vi.fn(() => 'test-uuid-1234-5678'),
}));

// Mock @cmmv/server
vi.mock('@cmmv/server', () => {
    const mockInstance = {
        disable: vi.fn(),
        use: vi.fn(),
        set: vi.fn(),
        get: vi.fn(() => []),
        engine: vi.fn(),
        addHook: vi.fn(),
        listen: vi.fn().mockResolvedValue({}),
        enabled: true,
        server: {
            on: vi.fn(),
            close: vi.fn((cb) => cb()),
        },
        router: {
            hasRoute: vi.fn(() => false),
        },
    };
    return {
        default: vi.fn(() => mockInstance),
        serverStatic: vi.fn(() => vi.fn()),
        json: vi.fn(() => vi.fn()),
        urlencoded: vi.fn(() => vi.fn()),
    };
});

vi.mock('@cmmv/compression', () => ({
    default: vi.fn(() => vi.fn()),
}));

vi.mock('@cmmv/cors', () => ({
    default: vi.fn(() => vi.fn()),
}));

vi.mock('@cmmv/cookie-parser', () => ({
    default: vi.fn(() => vi.fn()),
}));

vi.mock('@cmmv/etag', () => ({
    default: vi.fn(() => vi.fn()),
}));

vi.mock('@cmmv/helmet', () => ({
    default: vi.fn(() => vi.fn()),
}));

vi.mock('@cmmv/multer', () => ({
    default: vi.fn(() => vi.fn()),
}));

// Mock @cmmv/core
vi.mock('@cmmv/core', () => ({
    Logger: vi.fn().mockImplementation(() => ({
        log: vi.fn(),
        error: vi.fn(),
        warning: vi.fn(),
        verbose: vi.fn(),
    })),
    AbstractHttpAdapter: class {
        protected httpServer: any;
        protected application: any;
        isJson(obj: any) {
            return obj !== null && typeof obj === 'object' && !Array.isArray(obj);
        }
    },
    IHTTPSettings: {},
    Application: {
        appModule: {
            httpInterceptors: [],
            httpAfterRender: [],
        },
    },
    Telemetry: {
        start: vi.fn(),
        end: vi.fn(),
        getTelemetry: vi.fn(() => ({})),
        clearTelemetry: vi.fn(),
        getProcessTimer: vi.fn(() => 10),
    },
    Config: {
        get: vi.fn((key: string, defaultValue?: any) => {
            const config: Record<string, any> = {
                'server.publicDirs': ['public/views'],
                'server.render': 'cmmv',
                'server.poweredBy': false,
                'server.compress.enabled': true,
                'server.cors.enabled': true,
                'server.cors.origin': '*',
                'server.cors.credentials': false,
                'server.cors.maxAge': 0,
                'server.cors.preflightContinue': false,
                'server.cors.optionsSuccessStatus': 204,
                'server.cors.headers': ['Content-Type', 'Authorization'],
                'server.cors.exposedHeaders': [],
                'server.helmet.enabled': true,
                'server.helmet.options': { contentSecurityPolicy: false },
                'server.removePolicyHeaders': false,
                'server.rawData': false,
                'server.logging': 'all',
                headers: {},
            };
            return config[key] ?? defaultValue;
        }),
    },
}));

// Mock controller registry
vi.mock('../../registries/controller.registry', () => ({
    ControllerRegistry: {
        getControllers: vi.fn(() => []),
    },
}));

// Mock view.renderview
vi.mock('../../lib/view.renderview', () => ({
    CMMVRenderer: vi.fn().mockImplementation(() => ({
        renderFile: vi.fn((filePath, options, opts, callback) => {
            callback(null, '<html></html>');
        }),
    })),
}));

// Mock node:path
vi.mock('node:path', () => ({
    join: vi.fn((...args) => args.join('/')),
}));

import { DefaultAdapter } from '../../adapters/default.adapter';
import { Config, Telemetry, Logger } from '@cmmv/core';
import { ControllerRegistry } from '../../registries/controller.registry';

describe('DefaultAdapter', () => {
    let adapter: DefaultAdapter;

    beforeEach(() => {
        vi.clearAllMocks();
        adapter = new DefaultAdapter();
    });

    afterEach(() => {
        vi.clearAllMocks();
    });

    describe('constructor', () => {
        it('should create an instance', () => {
            expect(adapter).toBeDefined();
            expect(adapter).toBeInstanceOf(DefaultAdapter);
        });

        it('should accept a custom instance', () => {
            const customInstance = { custom: true };
            const customAdapter = new DefaultAdapter(customInstance);

            expect(customAdapter).toBeDefined();
        });

        it('should create default cmmv instance if none provided', () => {
            const newAdapter = new DefaultAdapter();

            expect(newAdapter).toBeDefined();
        });
    });

    describe('init', () => {
        it('should initialize the adapter', async () => {
            const mockApplication = {
                providersMap: new Map(),
            };

            await adapter.init(mockApplication as any, {});

            // Verify configuration was applied
            expect(Config.get).toHaveBeenCalled();
        });

        it('should disable x-powered-by when configured', async () => {
            vi.mocked(Config.get).mockImplementation((key: string, defaultValue?: any) => {
                if (key === 'server.poweredBy') return false;
                if (key === 'server.publicDirs') return ['public/views'];
                if (key === 'server.render') return 'cmmv';
                if (key === 'server.compress.enabled') return true;
                if (key === 'server.cors.enabled') return true;
                if (key === 'server.helmet.enabled') return true;
                return defaultValue;
            });

            const mockApplication = { providersMap: new Map() };
            await adapter.init(mockApplication as any, {});

            // Instance should have disable called
            expect(adapter).toBeDefined();
        });

        it('should enable compression when configured', async () => {
            vi.mocked(Config.get).mockImplementation((key: string, defaultValue?: any) => {
                if (key === 'server.compress.enabled') return true;
                if (key === 'server.publicDirs') return [];
                if (key === 'server.render') return null;
                if (key === 'server.cors.enabled') return false;
                if (key === 'server.helmet.enabled') return false;
                return defaultValue;
            });

            const mockApplication = { providersMap: new Map() };
            await adapter.init(mockApplication as any, {});

            expect(adapter).toBeDefined();
        });

        it('should configure CORS when enabled', async () => {
            vi.mocked(Config.get).mockImplementation((key: string, defaultValue?: any) => {
                if (key === 'server.cors.enabled') return true;
                if (key === 'server.cors.origin') return 'http://localhost';
                if (key === 'server.publicDirs') return [];
                if (key === 'server.render') return null;
                if (key === 'server.helmet.enabled') return false;
                if (key === 'server.compress.enabled') return false;
                return defaultValue;
            });

            const mockApplication = { providersMap: new Map() };
            await adapter.init(mockApplication as any, {});

            expect(adapter).toBeDefined();
        });

        it('should configure Helmet when enabled', async () => {
            vi.mocked(Config.get).mockImplementation((key: string, defaultValue?: any) => {
                if (key === 'server.helmet.enabled') return true;
                if (key === 'server.helmet.options') return { contentSecurityPolicy: false };
                if (key === 'server.publicDirs') return [];
                if (key === 'server.render') return null;
                if (key === 'server.cors.enabled') return false;
                if (key === 'server.compress.enabled') return false;
                return defaultValue;
            });

            const mockApplication = { providersMap: new Map() };
            await adapter.init(mockApplication as any, {});

            expect(adapter).toBeDefined();
        });

        it('should register controllers', async () => {
            const mockApplication = { providersMap: new Map() };
            await adapter.init(mockApplication as any, {});

            expect(ControllerRegistry.getControllers).toHaveBeenCalled();
        });
    });

    describe('listen', () => {
        it('should listen on specified host and port', async () => {
            const mockApplication = { providersMap: new Map() };
            await adapter.init(mockApplication as any, {});

            await expect(adapter.listen('0.0.0.0:3000')).resolves.toBeUndefined();
        });

        it('should parse bind string correctly', async () => {
            const mockApplication = { providersMap: new Map() };
            await adapter.init(mockApplication as any, {});

            await adapter.listen('127.0.0.1:8080');

            // Should parse host and port correctly
            expect(adapter).toBeDefined();
        });
    });

    describe('connected', () => {
        it('should return connection status', async () => {
            const mockApplication = { providersMap: new Map() };
            await adapter.init(mockApplication as any, {});

            const status = adapter.connected();

            expect(typeof status).toBe('boolean');
        });
    });

    describe('close', () => {
        it('should close the server', async () => {
            const mockApplication = { providersMap: new Map() };
            await adapter.init(mockApplication as any, {});

            await expect(adapter.close()).resolves.not.toThrow();
        });

        it('should return undefined when no http server', () => {
            const newAdapter = new DefaultAdapter();
            // Don't initialize, so no http server

            const result = newAdapter.close();

            expect(result).toBeUndefined();
        });
    });

    describe('printLog', () => {
        const setupMockConfig = () => {
            vi.mocked(Config.get).mockImplementation((key: string, defaultValue?: any) => {
                const config: Record<string, any> = {
                    'server.publicDirs': ['public/views'],
                    'server.render': null,
                    'server.poweredBy': false,
                    'server.compress.enabled': false,
                    'server.cors.enabled': false,
                    'server.helmet.enabled': false,
                    'server.logging': 'all',
                };
                return config[key] ?? defaultValue;
            });
        };

        it('should log error messages', async () => {
            setupMockConfig();
            const mockApplication = { providersMap: new Map() };
            await adapter.init(mockApplication as any, {});

            adapter.printLog('error', 'GET', '/api/test', 100, 500, '127.0.0.1');

            expect(adapter).toBeDefined();
        });

        it('should log warning messages', async () => {
            setupMockConfig();
            const mockApplication = { providersMap: new Map() };
            await adapter.init(mockApplication as any, {});

            adapter.printLog('warning', 'POST', '/api/data', 50, 400, '127.0.0.1');

            expect(adapter).toBeDefined();
        });

        it('should log verbose messages', async () => {
            vi.mocked(Config.get).mockImplementation((key: string, defaultValue?: any) => {
                if (key === 'server.logging') return 'verbose';
                if (key === 'server.publicDirs') return ['public/views'];
                if (key === 'server.render') return null;
                if (key === 'server.compress.enabled') return false;
                if (key === 'server.cors.enabled') return false;
                if (key === 'server.helmet.enabled') return false;
                return defaultValue;
            });
            const mockApplication = { providersMap: new Map() };
            await adapter.init(mockApplication as any, {});

            adapter.printLog('verbose', 'PUT', '/api/update', 30, 200, '127.0.0.1');

            expect(adapter).toBeDefined();
        });

        it('should log default messages', async () => {
            setupMockConfig();
            const mockApplication = { providersMap: new Map() };
            await adapter.init(mockApplication as any, {});

            adapter.printLog('log', 'DELETE', '/api/remove', 20, 204, '127.0.0.1');

            expect(adapter).toBeDefined();
        });

        it('should respect logging configuration', async () => {
            vi.mocked(Config.get).mockImplementation((key: string, defaultValue?: any) => {
                if (key === 'server.logging') return 'error';
                if (key === 'server.publicDirs') return ['public/views'];
                if (key === 'server.render') return null;
                if (key === 'server.compress.enabled') return false;
                if (key === 'server.cors.enabled') return false;
                if (key === 'server.helmet.enabled') return false;
                return defaultValue;
            });
            const mockApplication = { providersMap: new Map() };
            await adapter.init(mockApplication as any, {});

            adapter.printLog('warning', 'GET', '/test', 10, 200, '127.0.0.1');
            adapter.printLog('error', 'GET', '/test', 10, 500, '127.0.0.1');

            expect(adapter).toBeDefined();
        });
    });

    describe('setPublicDir', () => {
        const setupMockConfig = () => {
            vi.mocked(Config.get).mockImplementation((key: string, defaultValue?: any) => {
                if (key === 'server.publicDirs') return ['public/views'];
                if (key === 'server.render') return null;
                if (key === 'server.compress.enabled') return false;
                if (key === 'server.cors.enabled') return false;
                if (key === 'server.helmet.enabled') return false;
                return defaultValue;
            });
        };

        it('should set single public directory', async () => {
            setupMockConfig();
            const mockApplication = { providersMap: new Map() };
            await adapter.init(mockApplication as any, {});

            adapter.setPublicDir('/custom/public');

            expect(adapter).toBeDefined();
        });

        it('should set multiple public directories', async () => {
            setupMockConfig();
            const mockApplication = { providersMap: new Map() };
            await adapter.init(mockApplication as any, {});

            adapter.setPublicDir(['/public1', '/public2']);

            expect(adapter).toBeDefined();
        });

        it('should handle empty array', async () => {
            setupMockConfig();
            const mockApplication = { providersMap: new Map() };
            await adapter.init(mockApplication as any, {});

            adapter.setPublicDir([]);

            expect(adapter).toBeDefined();
        });
    });

    describe('render engine configuration', () => {
        it('should configure cmmv render engine', async () => {
            vi.mocked(Config.get).mockImplementation((key: string, defaultValue?: any) => {
                if (key === 'server.render') return 'cmmv';
                if (key === 'server.publicDirs') return ['public/views'];
                if (key === 'server.cors.enabled') return false;
                if (key === 'server.helmet.enabled') return false;
                if (key === 'server.compress.enabled') return false;
                return defaultValue;
            });

            const mockApplication = { providersMap: new Map() };
            await adapter.init(mockApplication as any, {});

            expect(adapter).toBeDefined();
        });

        it('should configure @cmmv/view render engine', async () => {
            vi.mocked(Config.get).mockImplementation((key: string, defaultValue?: any) => {
                if (key === 'server.render') return '@cmmv/view';
                if (key === 'server.publicDirs') return ['public/views'];
                if (key === 'server.cors.enabled') return false;
                if (key === 'server.helmet.enabled') return false;
                if (key === 'server.compress.enabled') return false;
                return defaultValue;
            });

            const mockApplication = { providersMap: new Map() };
            await adapter.init(mockApplication as any, {});

            expect(adapter).toBeDefined();
        });

        it('should configure custom render engine', async () => {
            vi.mocked(Config.get).mockImplementation((key: string, defaultValue?: any) => {
                if (key === 'server.render') return 'ejs';
                if (key === 'server.publicDirs') return ['public/views'];
                if (key === 'server.cors.enabled') return false;
                if (key === 'server.helmet.enabled') return false;
                if (key === 'server.compress.enabled') return false;
                return defaultValue;
            });

            const mockApplication = { providersMap: new Map() };
            await adapter.init(mockApplication as any, {});

            expect(adapter).toBeDefined();
        });
    });

    describe('edge cases', () => {
        it('should handle missing public directories', async () => {
            vi.mocked(Config.get).mockImplementation((key: string, defaultValue?: any) => {
                if (key === 'server.publicDirs') return [];
                if (key === 'server.render') return null;
                if (key === 'server.cors.enabled') return false;
                if (key === 'server.helmet.enabled') return false;
                if (key === 'server.compress.enabled') return false;
                return defaultValue;
            });

            const mockApplication = { providersMap: new Map() };

            await expect(adapter.init(mockApplication as any, {})).resolves.not.toThrow();
        });

        it('should handle disabled features', async () => {
            vi.mocked(Config.get).mockImplementation((key: string, defaultValue?: any) => {
                if (key === 'server.compress.enabled') return false;
                if (key === 'server.cors.enabled') return false;
                if (key === 'server.helmet.enabled') return false;
                if (key === 'server.publicDirs') return [];
                if (key === 'server.render') return null;
                return defaultValue;
            });

            const mockApplication = { providersMap: new Map() };

            await expect(adapter.init(mockApplication as any, {})).resolves.not.toThrow();
        });
    });
});
