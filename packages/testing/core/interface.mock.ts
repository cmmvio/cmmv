import { vi } from 'vitest';

/**
 * Mock for ConfigSchema interfaces
 */
export class MockConfigSchema {
    public static createConfigSchema(): Record<string, any> {
        return {
            required: true,
            type: 'string',
            default: 'mockDefault',
            properties: {},
        };
    }

    public static createConfigSubPropsSchemas(): Record<string, any> {
        return {
            mockProp: {
                required: true,
                type: 'string',
                default: 'mockValue',
            },
        };
    }

    public static getMockModule() {
        return {
            ConfigSchema: MockConfigSchema.createConfigSchema(),
            ConfigSubPropsSchemas:
                MockConfigSchema.createConfigSubPropsSchemas(),
        };
    }
}

/**
 * Mock for Contract interfaces
 */
export class MockContractInterface {
    public static createContract(): Record<string, any> {
        return {
            namespace: 'mock',
            isPublic: true,
            contractName: 'MockContract',
            controllerName: 'MockController',
            subPath: '/mock',
            protoPath: './mock.proto',
            protoPackage: 'mock',
            fields: [],
            messages: [],
            services: [],
            directMessage: false,
            generateController: true,
            generateEntities: true,
            generateBoilerplates: true,
            auth: false,
            rootOnly: false,
            controllerCustomPath: '/custom',
            imports: [],
            indexs: [],
            cache: { ttl: 60 },
            options: {},
            tags: ['mock'],
        };
    }

    public static createContractField(): Record<string, any> {
        return {
            propertyKey: 'mockField',
            protoType: 'string',
            array: false,
            defaultValue: 'mock',
            index: false,
            unique: false,
            exclude: false,
            nullable: false,
            toClassOnly: false,
            toPlainOnly: false,
        };
    }

    public static createContractMessage(): Record<string, any> {
        return {
            propertyKey: 'mockMessage',
            name: 'MockMessage',
            properties: {
                field1: { type: 'string' },
            },
        };
    }

    public static createContractService(): Record<string, any> {
        return {
            propertyKey: 'mockService',
            name: 'MockService',
            path: '/mock',
            method: 'GET',
            auth: false,
            rootOnly: false,
            request: 'MockRequest',
            response: 'MockResponse',
            createBoilerplate: true,
        };
    }

    public static createContractIndex(): Record<string, any> {
        return {
            name: 'mockIndex',
            fields: ['field1', 'field2'],
            options: { unique: true },
        };
    }

    public static getMockModule() {
        return {
            IContract: MockContractInterface.createContract(),
            IContractField: MockContractInterface.createContractField(),
            IContractMessage: MockContractInterface.createContractMessage(),
            IContractService: MockContractInterface.createContractService(),
            IContractIndex: MockContractInterface.createContractIndex(),
        };
    }
}

/**
 * Mock for HttpServer interface
 */
export class MockHttpServerInterface {
    public static createRequestHandler(): Function {
        return vi.fn().mockImplementation((req, res, next) => {
            if (next) next();
            return { status: 200, data: 'mock' };
        });
    }

    public static createHttpServer(): Record<string, any> {
        return {
            use: vi.fn().mockReturnThis(),
            get: vi.fn().mockReturnThis(),
            post: vi.fn().mockReturnThis(),
            head: vi.fn().mockReturnThis(),
            delete: vi.fn().mockReturnThis(),
            put: vi.fn().mockReturnThis(),
            patch: vi.fn().mockReturnThis(),
            all: vi.fn().mockReturnThis(),
            options: vi.fn().mockReturnThis(),
            listen: vi.fn().mockResolvedValue(undefined),
            getHttpServer: vi.fn().mockReturnValue({}),
        };
    }

    public static reset(): void {
        const httpServer = MockHttpServerInterface.createHttpServer();
        Object.keys(httpServer).forEach((key) => {
            if (
                httpServer[key] &&
                typeof httpServer[key].mockReset === 'function'
            ) {
                httpServer[key].mockReset();

                // Reset default implementations
                if (key === 'listen') {
                    httpServer[key].mockResolvedValue(undefined);
                } else if (key === 'getHttpServer') {
                    httpServer[key].mockReturnValue({});
                } else {
                    httpServer[key].mockReturnThis();
                }
            }
        });
    }

    public static getMockModule() {
        return {
            RequestHandler: MockHttpServerInterface.createRequestHandler,
            HttpServer: MockHttpServerInterface.createHttpServer(),
        };
    }
}

/**
 * Mock for HttpSettings interface
 */
export class MockHttpSettingsInterface {
    public static createHttpSettings(): Record<string, any> {
        return {
            port: 3000,
            host: 'localhost',
            cors: true,
            bodyParser: true,
            compression: true,
        };
    }

    public static getMockModule() {
        return {
            IHTTPSettings: MockHttpSettingsInterface.createHttpSettings(),
        };
    }
}

/**
 * Mock for Plugin interfaces
 */
export class MockPluginInterface {
    public static PluginClientSupport = {
        VUE: 'vue',
        REACT: 'react',
        ANGULAR: 'angular',
        SVELTE: 'svelte',
        SOLID: 'solid',
        QWIK: 'qwik',
        SOLIDJS: 'solidjs',
    };

    public static PluginAPISupport = {
        GRAPHQL: 'graphql',
        REST: 'rest',
        RPC: 'rpc',
    };

    public static createPlugin(): Record<string, any> {
        return {
            name: 'MockPlugin',
            version: '1.0.0',
            description: 'Mock plugin for testing',
            api: function MockApi() {},
            admin: MockPluginInterface.createPluginAdmin(),
            clients: MockPluginInterface.createPluginClient(),
            contracts: {},
            dependencies: [],
            clientSupport: [MockPluginInterface.PluginClientSupport.VUE],
            apiSupport: [MockPluginInterface.PluginAPISupport.REST],
        };
    }

    public static createPluginContract(): Record<string, any> {
        return {
            MockContract: function MockContract() {},
        };
    }

    public static createPluginClient(): Record<string, any> {
        return {
            vue: {},
            react: null,
            angular: null,
            svelte: null,
            solid: null,
            qwik: null,
            solidjs: null,
        };
    }

    public static createPluginAdmin(): Record<string, any> {
        return {
            navbav: {
                mockNav: MockPluginInterface.createNavbarItem(),
            },
        };
    }

    public static createNavbarItem(): Record<string, any> {
        return {
            route: '/mock',
            contract: 'MockContract',
            view: 'MockView',
        };
    }

    public static getMockModule() {
        return {
            PluginClientSupport: MockPluginInterface.PluginClientSupport,
            PluginAPISupport: MockPluginInterface.PluginAPISupport,
            IPlugin: MockPluginInterface.createPlugin(),
            IPluginContract: MockPluginInterface.createPluginContract(),
            IPluginClient: MockPluginInterface.createPluginClient(),
            IPluginAdmin: MockPluginInterface.createPluginAdmin(),
            INavbarItem: MockPluginInterface.createNavbarItem(),
        };
    }
}

/**
 * Mock for Scheduling Enum
 */
export class MockSchedulingEnum {
    public static CronExpression = {
        EVERY_SECOND: '* * * * * *',
        EVERY_5_SECONDS: '*/5 * * * * *',
        EVERY_10_SECONDS: '*/10 * * * * *',
        EVERY_30_SECONDS: '*/30 * * * * *',
        EVERY_MINUTE: '*/1 * * * *',
        EVERY_5_MINUTES: '0 */5 * * * *',
        EVERY_10_MINUTES: '0 */10 * * * *',
        EVERY_30_MINUTES: '0 */30 * * * *',
        EVERY_HOUR: '0 0-23/1 * * *',
        EVERY_DAY_AT_MIDNIGHT: '0 0 * * *',
        EVERY_WEEK: '0 0 * * 0',
        EVERY_MONTH: '0 0 1 * *',
        EVERY_YEAR: '0 0 1 1 *',
    };

    public static getMockModule() {
        return {
            CronExpression: MockSchedulingEnum.CronExpression,
        };
    }
}

/**
 * Centralized mock for all Core interfaces
 */
export class MockInterfaces {
    public static ConfigSchema = MockConfigSchema;
    public static ContractInterface = MockContractInterface;
    public static HttpServerInterface = MockHttpServerInterface;
    public static HttpSettingsInterface = MockHttpSettingsInterface;
    public static PluginInterface = MockPluginInterface;
    public static SchedulingEnum = MockSchedulingEnum;

    public static reset(): void {
        MockHttpServerInterface.reset();
    }

    public static getMockModule() {
        return {
            ...MockConfigSchema.getMockModule(),
            ...MockContractInterface.getMockModule(),
            ...MockHttpServerInterface.getMockModule(),
            ...MockHttpSettingsInterface.getMockModule(),
            ...MockPluginInterface.getMockModule(),
            ...MockSchedulingEnum.getMockModule(),
        };
    }
}

/**
 * Centralized mock export for interfaces
 */
export const mockInterfaces = MockInterfaces;
