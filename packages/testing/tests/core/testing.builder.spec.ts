import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';

// Mock @cmmv/core before imports
vi.mock('@cmmv/core', () => {
    class MockApplication {
        settings: any;
        modules: any[] = [];
        configs: any[] = [];

        constructor(settings?: any) {
            this.settings = settings || {};
        }

        static resolveProvider = vi.fn();
        static generateModule = vi.fn().mockResolvedValue(null);

        loadModules = vi.fn();
        processContracts = vi.fn();
        getHttpAdapter = vi.fn();
        close = vi.fn().mockResolvedValue(undefined);
    }

    return {
        Application: MockApplication,
        Module: class MockModule {
            constructor(public name: string, public options: any) {}
        },
        Config: {
            set: vi.fn(),
            get: vi.fn(),
            validateConfigs: vi.fn().mockResolvedValue(undefined),
        },
        Logger: vi.fn().mockImplementation(() => ({
            log: vi.fn(),
            error: vi.fn(),
            warn: vi.fn(),
        })),
        Scope: {
            set: vi.fn(),
            get: vi.fn(),
        },
        AbstractHttpAdapter: class {},
        IApplicationSettings: {},
        IModuleOptions: {},
    };
});

// Mock http.mock
vi.mock('../../http/http.mock', () => ({
    MockDefaultAdapter: class {
        init = vi.fn();
        registerControllers = vi.fn();
        close = vi.fn();
    },
}));

import { Test } from '../../core/testing.service';
import { TestingModuleBuilder } from '../../core/testing.builder';
import { TestingModule } from '../../core/testing.module';

describe('TestingModuleBuilder', () => {
    beforeEach(() => {
        vi.clearAllMocks();
    });

    afterEach(() => {
        vi.clearAllMocks();
    });

    describe('Test.createTestingModule', () => {
        it('should return a TestingModuleBuilder instance', () => {
            const builder = Test.createTestingModule();
            expect(builder).toBeInstanceOf(TestingModuleBuilder);
        });
    });

    describe('fluent API', () => {
        it('should allow chaining setSettings', () => {
            const builder = Test.createTestingModule();
            const result = builder.setSettings({ httpAdapter: null as any });
            expect(result).toBe(builder);
        });

        it('should allow chaining import', () => {
            const builder = Test.createTestingModule();
            const result = builder.import([]);
            expect(result).toBe(builder);
        });

        it('should allow chaining addControllers', () => {
            const builder = Test.createTestingModule();
            const result = builder.addControllers([]);
            expect(result).toBe(builder);
        });

        it('should allow chaining addProviders', () => {
            const builder = Test.createTestingModule();
            const result = builder.addProviders([]);
            expect(result).toBe(builder);
        });
    });

    describe('overrideProvider', () => {
        it('should return a provider override builder', () => {
            const builder = Test.createTestingModule();
            class TestService {}
            const overrideBuilder = builder.overrideProvider(TestService);
            expect(overrideBuilder).toBeDefined();
            expect(typeof overrideBuilder.useValue).toBe('function');
            expect(typeof overrideBuilder.useClass).toBe('function');
            expect(typeof overrideBuilder.useFactory).toBe('function');
        });

        it('should allow useValue override', () => {
            const builder = Test.createTestingModule();
            class TestService {}
            const mockValue = { test: 'mock' };
            const result = builder.overrideProvider(TestService).useValue(mockValue);
            expect(result).toBe(builder);
        });

        it('should allow useClass override', () => {
            const builder = Test.createTestingModule();
            class TestService {}
            class MockTestService {}
            const result = builder.overrideProvider(TestService).useClass(MockTestService);
            expect(result).toBe(builder);
        });

        it('should allow useFactory override', () => {
            const builder = Test.createTestingModule();
            class TestService {}
            const factory = () => ({ test: 'factory' });
            const result = builder.overrideProvider(TestService).useFactory(factory);
            expect(result).toBe(builder);
        });
    });

    describe('overrideGuard', () => {
        it('should return a guard override builder', () => {
            const builder = Test.createTestingModule();
            class TestGuard {}
            const overrideBuilder = builder.overrideGuard(TestGuard);
            expect(overrideBuilder).toBeDefined();
            expect(typeof overrideBuilder.useValue).toBe('function');
            expect(typeof overrideBuilder.useClass).toBe('function');
        });

        it('should allow useValue override', () => {
            const builder = Test.createTestingModule();
            class TestGuard {}
            const mockGuard = { canActivate: () => true };
            const result = builder.overrideGuard(TestGuard).useValue(mockGuard);
            expect(result).toBe(builder);
        });
    });

    describe('overrideInterceptor', () => {
        it('should return an interceptor override builder', () => {
            const builder = Test.createTestingModule();
            class TestInterceptor {}
            const overrideBuilder = builder.overrideInterceptor(TestInterceptor);
            expect(overrideBuilder).toBeDefined();
            expect(typeof overrideBuilder.useValue).toBe('function');
            expect(typeof overrideBuilder.useClass).toBe('function');
        });

        it('should allow useValue override', () => {
            const builder = Test.createTestingModule();
            class TestInterceptor {}
            const mockInterceptor = { intercept: vi.fn() };
            const result = builder.overrideInterceptor(TestInterceptor).useValue(mockInterceptor);
            expect(result).toBe(builder);
        });
    });

    describe('compile', () => {
        it('should return a TestingModule', async () => {
            const builder = Test.createTestingModule();
            const module = await builder.compile();
            expect(module).toBeInstanceOf(TestingModule);
        });

        it('should compile with providers', async () => {
            class TestService {
                getValue() {
                    return 'original';
                }
            }

            const module = await Test.createTestingModule()
                .addProviders([TestService])
                .compile();

            expect(module).toBeInstanceOf(TestingModule);
        });

        it('should compile with provider overrides', async () => {
            class TestService {
                getValue() {
                    return 'original';
                }
            }

            const mockService = { getValue: () => 'mocked' };

            const module = await Test.createTestingModule()
                .addProviders([TestService])
                .overrideProvider(TestService)
                .useValue(mockService)
                .compile();

            const service = module.get(TestService);
            expect(service.getValue()).toBe('mocked');
        });
    });
});

describe('TestingModule', () => {
    describe('get', () => {
        it('should return overridden provider', async () => {
            class TestService {}
            const mockValue = { test: 'mock' };

            const module = await Test.createTestingModule()
                .addProviders([TestService])
                .overrideProvider(TestService)
                .useValue(mockValue)
                .compile();

            const result = module.get(TestService);
            expect(result).toBe(mockValue);
        });

        it('should return null/undefined for unknown provider', async () => {
            class UnknownService {}

            const module = await Test.createTestingModule().compile();

            const result = module.get(UnknownService);
            // Result can be null or undefined depending on how Application.resolveProvider behaves
            expect(result == null).toBe(true);
        });
    });

    describe('resolve', () => {
        it('should resolve provider', async () => {
            class TestService {}
            const mockValue = { test: 'mock' };

            const module = await Test.createTestingModule()
                .addProviders([TestService])
                .overrideProvider(TestService)
                .useValue(mockValue)
                .compile();

            const result = await module.resolve(TestService);
            expect(result).toBe(mockValue);
        });
    });

    describe('getController', () => {
        it('should return registered controller', async () => {
            class TestController {}

            const module = await Test.createTestingModule()
                .addControllers([TestController])
                .compile();

            const controller = module.getController(TestController);
            expect(controller).toBeInstanceOf(TestController);
        });

        it('should return null for unregistered controller', async () => {
            class UnknownController {}

            const module = await Test.createTestingModule().compile();

            const controller = module.getController(UnknownController);
            expect(controller).toBeNull();
        });
    });

    describe('close', () => {
        it('should clean up resources', async () => {
            const module = await Test.createTestingModule().compile();

            await expect(module.close()).resolves.not.toThrow();
        });
    });
});
