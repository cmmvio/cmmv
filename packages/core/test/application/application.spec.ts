import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';

// Mock fs
vi.mock('node:fs', () => ({
    existsSync: vi.fn().mockReturnValue(true),
    mkdirSync: vi.fn(),
    writeFileSync: vi.fn(),
    readFileSync: vi.fn().mockReturnValue(''),
    default: {
        existsSync: vi.fn().mockReturnValue(true),
        mkdirSync: vi.fn(),
        writeFileSync: vi.fn(),
        readFileSync: vi.fn().mockReturnValue(''),
    },
}));

// Mock path
vi.mock('node:path', () => ({
    join: vi.fn((...args) => args.filter(Boolean).join('/')),
    resolve: vi.fn((...args) => args.filter(Boolean).join('/')),
    dirname: vi.fn((p) => p.split('/').slice(0, -1).join('/')),
    relative: vi.fn((from, to) => to),
    default: {
        join: vi.fn((...args) => args.filter(Boolean).join('/')),
        resolve: vi.fn((...args) => args.filter(Boolean).join('/')),
        dirname: vi.fn((p) => p.split('/').slice(0, -1).join('/')),
        relative: vi.fn((from, to) => to),
    },
}));

// Mock fast-glob
vi.mock('fast-glob', () => ({
    default: vi.fn().mockResolvedValue([]),
}));

// Mock terser
vi.mock('terser', () => ({
    minify: vi.fn().mockResolvedValue({ code: 'minified' }),
    default: {
        minify: vi.fn().mockResolvedValue({ code: 'minified' }),
    },
}));

// Mock process.cwd
vi.mock('node:process', () => ({
    cwd: vi.fn().mockReturnValue('/mock/cwd'),
}));

// Mock Logger
vi.mock('../../lib/logger', () => ({
    Logger: vi.fn().mockImplementation(() => ({
        log: vi.fn(),
        error: vi.fn(),
        warning: vi.fn(),
        verbose: vi.fn(),
    })),
}));

// Mock Config
vi.mock('../../lib/config', () => ({
    Config: {
        loadConfig: vi.fn().mockResolvedValue(undefined),
        get: vi.fn((key: string, defaultValue?: any) => {
            const configs: Record<string, any> = {
                'server.host': '0.0.0.0',
                'server.port': 3000,
                'app.sourceDir': 'src',
                env: 'dev',
            };
            return configs[key] ?? defaultValue;
        }),
        validateConfigs: vi.fn().mockResolvedValue(undefined),
    },
}));

// Mock Scope
vi.mock('../../lib/scope', () => ({
    Scope: {
        addToArray: vi.fn(),
        getArray: vi.fn(() => []),
        has: vi.fn(() => false),
        set: vi.fn(),
        get: vi.fn(),
    },
}));

// Mock Hooks
vi.mock('../../lib/hooks', () => ({
    Hooks: {
        execute: vi.fn().mockResolvedValue(undefined),
    },
    HooksType: {
        onPreInitialize: 'onPreInitialize',
        onInitialize: 'onInitialize',
        onListen: 'onListen',
        onError: 'onError',
        onHTTPServerInit: 'onHTTPServerInit',
    },
}));

// Mock Transpile
vi.mock('../../lib/transpile', () => ({
    Transpile: vi.fn().mockImplementation(() => ({
        transpile: vi.fn().mockResolvedValue(undefined),
    })),
}));

// Mock Module
vi.mock('../../lib/module', () => ({
    Module: class MockModule {
        static hasModule = vi.fn(() => false);
        devMode = false;
        getContractsCls() { return []; }
        getTranspilers() { return []; }
        getControllers() { return []; }
        getSubmodules() { return []; }
        getContracts() { return []; }
        getEntities() { return []; }
        getModels() { return []; }
        getConfigsSchemas() { return []; }
        getResolvers() { return []; }
        getProviders() { return []; }
    },
}));

// Mock transpilers
vi.mock('../../transpilers', () => ({
    ApplicationTranspile: class MockAppTranspile {
        run() {}
    },
    ContractsTranspile: class MockContractsTranspile {
        run() {}
    },
}));

// Mock decorators
vi.mock('../../decorators', () => ({
    NAMESPACE_METADATA: Symbol('NAMESPACE_METADATA'),
    CONTROLLER_NAME_METADATA: Symbol('CONTROLLER_NAME_METADATA'),
    FIELD_METADATA: Symbol('FIELD_METADATA'),
    MESSAGE_METADATA: Symbol('MESSAGE_METADATA'),
    SERVICE_METADATA: Symbol('SERVICE_METADATA'),
    PROTO_PATH_METADATA: Symbol('PROTO_PATH_METADATA'),
    DIRECTMESSAGE_METADATA: Symbol('DIRECTMESSAGE_METADATA'),
    PROTO_PACKAGE_METADATA: Symbol('PROTO_PACKAGE_METADATA'),
    GENERATE_CONTROLLER_METADATA: Symbol('GENERATE_CONTROLLER_METADATA'),
    GENERATE_ENTITIES_METADATA: Symbol('GENERATE_ENTITIES_METADATA'),
    GENERATE_BOILERPLATES_METADATA: Symbol('GENERATE_BOILERPLATES_METADATA'),
    AUTH_METADATA: Symbol('AUTH_METADATA'),
    ROOTONLY_METADATA: Symbol('ROOTONLY_METADATA'),
    CONTROLLER_CUSTOM_PATH_METADATA: Symbol('CONTROLLER_CUSTOM_PATH_METADATA'),
    CONTROLLER_IMPORTS: Symbol('CONTROLLER_IMPORTS'),
    CONTROLLER_INDEXS: Symbol('CONTROLLER_INDEXS'),
    CONTROLLER_CACHE: Symbol('CONTROLLER_CACHE'),
    CONTROLLER_OPTIONS: Symbol('CONTROLLER_OPTIONS'),
    CONTROLLER_VIEWFORM: Symbol('CONTROLLER_VIEWFORM'),
    CONTROLLER_VIEWPAGE: Symbol('CONTROLLER_VIEWPAGE'),
    SUB_PATH_METADATA: Symbol('SUB_PATH_METADATA'),
    PUBLIC_METADATA: Symbol('PUBLIC_METADATA'),
}));

import { Application, IApplicationSettings } from '../../application';
import { Config } from '../../lib/config';
import { Scope } from '../../lib/scope';
import { Hooks, HooksType } from '../../lib/hooks';
import { Module } from '../../lib/module';

describe('Application', () => {
    let originalInstance: Application | null;

    beforeEach(() => {
        vi.clearAllMocks();
        originalInstance = Application.instance;
        Application.instance = null as any;
        Application.contractsCls = [];
        Application.models.clear();
        Application.appModule = {
            controllers: [],
            providers: [],
            httpMiddlewares: [],
            httpInterceptors: [],
            httpAfterRender: [],
        };
    });

    afterEach(() => {
        vi.clearAllMocks();
        Application.instance = originalInstance as any;
    });

    describe('constructor', () => {
        it('should create an instance', () => {
            const settings: IApplicationSettings = {};
            const app = new Application(settings);

            expect(app).toBeDefined();
            expect(Application.instance).toBe(app);
        });

        it('should set compile flag', () => {
            const settings: IApplicationSettings = {};
            const app = new Application(settings, true);

            expect(app).toBeDefined();
        });

        it('should call preInitialize', () => {
            const settings: IApplicationSettings = {};
            new Application(settings);

            expect(Config.loadConfig).toHaveBeenCalled();
        });
    });

    describe('static create', () => {
        it('should create a new Application instance', () => {
            const settings: IApplicationSettings = {};
            const app = Application.create(settings);

            expect(app).toBeDefined();
            expect(app).toBeInstanceOf(Application);
        });
    });

    describe('static compile', () => {
        it('should create Application in compile mode', () => {
            const settings: IApplicationSettings = {};
            const app = Application.compile(settings);

            expect(app).toBeDefined();
            expect(app).toBeInstanceOf(Application);
        });
    });

    describe('static exec', () => {
        it('should execute the application process', () => {
            const settings: IApplicationSettings = {};
            const result = Application.exec(settings);

            expect(result).toBeDefined();
        });
    });

    describe('static awaitModule', () => {
        it('should execute callback if module exists', () => {
            vi.mocked(Module.hasModule).mockReturnValue(true);
            const callback = vi.fn();
            const context = {};

            Application.awaitModule('testModule', callback, context);

            expect(callback).toHaveBeenCalled();
        });

        it('should queue callback if module does not exist', () => {
            vi.mocked(Module.hasModule).mockReturnValue(false);
            const callback = vi.fn();
            const context = {};

            Application.awaitModule('testModule', callback, context);

            expect(Scope.addToArray).toHaveBeenCalledWith(
                '_await_module_testModule',
                { cb: callback, context }
            );
        });
    });

    describe('static awaitService', () => {
        it('should queue callback for service', () => {
            const callback = vi.fn();
            const context = {};

            Application.awaitService('testService', callback, context);

            expect(Scope.addToArray).toHaveBeenCalledWith(
                '_await_service_testService',
                { cb: callback, context }
            );
        });
    });

    describe('static getModel', () => {
        it('should return model if exists', () => {
            const mockModel = class TestModel {};
            Application.models.set('TestModel', mockModel);

            const result = Application.getModel('TestModel');

            expect(result).toBe(mockModel);
        });

        it('should throw error if model does not exist', () => {
            expect(() => Application.getModel('NonExistentModel')).toThrow(
                "Could not load model 'NonExistentModel'"
            );
        });
    });

    describe('static setHTTPMiddleware', () => {
        it('should add middleware to appModule', () => {
            const middleware = vi.fn();

            Application.setHTTPMiddleware(middleware);

            expect(Application.appModule.httpMiddlewares).toContain(middleware);
        });
    });

    describe('static setHTTPInterceptor', () => {
        it('should add interceptor to appModule', () => {
            const interceptor = vi.fn();

            Application.setHTTPInterceptor(interceptor);

            expect(Application.appModule.httpInterceptors).toContain(interceptor);
        });
    });

    describe('static setHTTPAfterRender', () => {
        it('should add after render callback to appModule', () => {
            const callback = vi.fn();

            Application.setHTTPAfterRender(callback);

            expect(Application.appModule.httpAfterRender).toContain(callback);
        });
    });

    describe('static getContract', () => {
        it('should return contract if exists', () => {
            class TestContract {}
            Application.contractsCls = [TestContract];

            const result = Application.getContract('TestContract');

            expect(result).toBe(TestContract);
        });

        it('should return undefined if contract does not exist', () => {
            Application.contractsCls = [];

            const result = Application.getContract('NonExistent');

            expect(result).toBeUndefined();
        });
    });

    describe('static getResolvers', () => {
        it('should return unique resolvers', () => {
            const settings: IApplicationSettings = {};
            const app = new Application(settings);
            (app as any).resolvers = [{ name: 'resolver1' }, { name: 'resolver2' }];
            Application.instance = app;

            const result = Application.getResolvers();

            expect(result).toHaveLength(2);
        });
    });

    describe('static getResolver', () => {
        it('should return matching resolver', () => {
            const settings: IApplicationSettings = {};
            const app = new Application(settings);
            const resolver = { name: 'TestResolver' };
            (app as any).resolvers = [resolver];
            Application.instance = app;

            const result = Application.getResolver('TestResolver');

            expect(result).toContain(resolver);
        });
    });

    describe('static resolveProvider', () => {
        it('should create provider instance with dependencies', () => {
            class TestProvider {
                constructor() {}
            }

            const settings: IApplicationSettings = {};
            const app = new Application(settings);
            Application.instance = app;

            const result = Application.resolveProvider(TestProvider);

            expect(result).toBeInstanceOf(TestProvider);
        });
    });

    describe('getHttpAdapter', () => {
        it('should return http adapter', () => {
            const settings: IApplicationSettings = {};
            const app = new Application(settings);
            (app as any).httpAdapter = { test: true };

            const result = app.getHttpAdapter();

            expect(result).toEqual({ test: true });
        });
    });

    describe('getWSServer', () => {
        it('should return WS server', () => {
            const settings: IApplicationSettings = {};
            const app = new Application(settings);
            (app as any).wsServer = { ws: true };

            const result = app.getWSServer();

            expect(result).toEqual({ ws: true });
        });
    });

    describe('restart', () => {
        it('should restart the application', async () => {
            const mockHttpAdapter = {
                close: vi.fn(),
                init: vi.fn().mockResolvedValue(undefined),
                listen: vi.fn().mockResolvedValue(undefined),
            };
            const mockWsAdapter = {
                close: vi.fn(),
            };

            const settings: IApplicationSettings = {};
            const app = new Application(settings);
            (app as any).httpAdapter = mockHttpAdapter;
            (app as any).wsAdapter = mockWsAdapter;

            const result = await app.restart();

            expect(result).toBe(true);
            expect(mockHttpAdapter.close).toHaveBeenCalled();
            expect(mockWsAdapter.close).toHaveBeenCalled();
        });

        it('should handle restart without adapters', async () => {
            const settings: IApplicationSettings = {};
            const app = new Application(settings);
            (app as any).httpAdapter = null;
            (app as any).wsAdapter = null;

            const result = await app.restart();

            expect(result).toBe(true);
        });
    });

    describe('appModule', () => {
        it('should have default empty arrays', () => {
            expect(Application.appModule.controllers).toEqual([]);
            expect(Application.appModule.providers).toEqual([]);
            expect(Application.appModule.httpMiddlewares).toEqual([]);
            expect(Application.appModule.httpInterceptors).toEqual([]);
            expect(Application.appModule.httpAfterRender).toEqual([]);
        });
    });

    describe('contractsCls', () => {
        it('should be an empty array by default', () => {
            Application.contractsCls = [];
            expect(Application.contractsCls).toEqual([]);
        });

        it('should store contract classes', () => {
            class Contract1 {}
            class Contract2 {}
            Application.contractsCls = [Contract1, Contract2];

            expect(Application.contractsCls).toHaveLength(2);
        });
    });

    describe('models', () => {
        it('should be a Map', () => {
            expect(Application.models).toBeInstanceOf(Map);
        });

        it('should store models', () => {
            class TestModel {}
            Application.models.set('Test', TestModel);

            expect(Application.models.get('Test')).toBe(TestModel);
        });
    });
});

describe('IApplicationSettings interface', () => {
    it('should accept minimal settings', () => {
        const settings: IApplicationSettings = {};
        expect(settings).toBeDefined();
    });

    it('should accept full settings', () => {
        const settings: IApplicationSettings = {
            httpOptions: {},
            httpMiddlewares: [],
            transpilers: [],
            modules: [],
            contracts: [],
            services: [],
            providers: [],
            resolvers: [],
        };
        expect(settings).toBeDefined();
    });
});
