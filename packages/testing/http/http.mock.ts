import { vi } from 'vitest';
import { Duplex } from 'node:stream';

/**
 * Mock para ControllerRegistry
 */
export class MockControllerRegistry {
    private static controllers: Array<[any, any]> = [];

    public static registerController = vi
        .fn()
        .mockImplementation((controllerClass: any, metadata: any) => {
            MockControllerRegistry.controllers.push([
                controllerClass,
                metadata,
            ]);
        });

    public static getControllers = vi.fn().mockReturnValue([]);

    public static reset(): void {
        MockControllerRegistry.controllers = [];
        MockControllerRegistry.registerController.mockClear();
        MockControllerRegistry.getControllers.mockReset();
        MockControllerRegistry.getControllers.mockReturnValue([]);
    }

    public static getMockModule() {
        return {
            ControllerRegistry: {
                registerController: MockControllerRegistry.registerController,
                getControllers: MockControllerRegistry.getControllers,
            },
        };
    }
}

/**
 * Mock para HttpException
 */
export class MockHttpException extends Error {
    constructor(
        public readonly message: string,
        public readonly status: number = 500,
    ) {
        super(message);
    }

    public static getMockModule() {
        return {
            HttpException: MockHttpException,
        };
    }
}

/**
 * Mock para DefaultAdapter
 */
export class MockDefaultAdapter {
    protected readonly openConnections = new Set<Duplex>();
    protected readonly logger = {
        log: vi.fn(),
        error: vi.fn(),
        warning: vi.fn(),
        verbose: vi.fn(),
    };

    public application: any = {};
    public instance: any = {
        disable: vi.fn(),
        use: vi.fn().mockReturnThis(),
        set: vi.fn(),
        engine: vi.fn(),
        addHook: vi.fn(),
        get: vi.fn().mockReturnValue([]),
        server: {
            on: vi.fn(),
            close: vi.fn().mockImplementation((cb) => cb && cb()),
        },
        router: {
            hasRoute: vi.fn().mockReturnValue(false),
        },
        listen: vi.fn().mockResolvedValue({}),
        enabled: true,
    };
    public httpServer: any = null;

    // Propriedade para armazenar manipuladores de rota para testes (por instância)
    public routeHandlers: Record<
        string,
        { handler: Function; instance: any; route: any }
    > = {};

    // Propriedade estática para armazenar manipuladores de rota para testes (compartilhada)
    public static routeHandlers: Record<
        string,
        { handler: Function; instance: any; route: any }
    > = {};

    constructor(protected instanceToUse?: any) {
        this.instance = instanceToUse || this.instance;
        this.httpServer = this.instance.server;
    }

    public init = vi
        .fn()
        .mockImplementation(async (application: any, settings?: any) => {
            this.application = application;
            this.instance.server = this.instance.server || {};
            this.httpServer = this.instance.server;
            return Promise.resolve();
        });

    public setMiddleware = vi.fn();

    public registerControllers = vi.fn().mockImplementation(() => {
        const controllers = MockControllerRegistry.getControllers();

        // Copiar handlers estáticos para a instância atual
        this.routeHandlers = { ...MockDefaultAdapter.routeHandlers };

        return controllers;
    });

    public buildRouteArgs = vi
        .fn()
        .mockImplementation((req: any, res: any, next: any, params: any[]) => {
            const args: any[] = [];
            return args;
        });

    public listen = vi
        .fn()
        .mockImplementation((bind: string): Promise<void> => {
            const [host, port] = bind.split(':');
            return Promise.resolve();
        });

    public connected = vi.fn().mockReturnValue(true);

    public close = vi.fn().mockResolvedValue('');

    public printLog = vi.fn();

    public setPublicDir = vi.fn();

    public isJson = vi.fn().mockImplementation((object: any) => {
        try {
            if (object === null || object === undefined) return false;
            if (typeof object === 'object') return true;
            JSON.parse(object);
            return true;
        } catch (e) {
            return false;
        }
    });

    // Métodos internos mockados
    public setStaticServer = vi.fn().mockImplementation((publicDir: string) => {
        return (req: any, res: any, next: any) => next();
    });

    public trackOpenConnections = vi.fn();

    public closeOpenConnections = vi.fn();

    public static reset(): void {
        const instance = new MockDefaultAdapter();

        // Limpar handlers estáticos
        MockDefaultAdapter.routeHandlers = {};

        // Reset logger
        instance.logger.log.mockReset();
        instance.logger.error.mockReset();
        instance.logger.warning.mockReset();
        instance.logger.verbose.mockReset();

        // Reset instance methods
        instance.instance.disable.mockReset();
        instance.instance.use.mockReset();
        instance.instance.set.mockReset();
        instance.instance.engine.mockReset();
        instance.instance.addHook.mockReset();
        instance.instance.get.mockReset();
        instance.instance.server.on.mockReset();
        instance.instance.server.close.mockReset();
        instance.instance.router.hasRoute.mockReset();
        instance.instance.listen.mockReset();

        // Reset main methods
        instance.init.mockReset();
        instance.setMiddleware.mockReset();
        instance.registerControllers.mockReset();
        instance.buildRouteArgs.mockReset();
        instance.listen.mockReset();
        instance.connected.mockReset();
        instance.close.mockReset();
        instance.printLog.mockReset();
        instance.setPublicDir.mockReset();
        instance.isJson.mockReset();
        instance.setStaticServer.mockReset();
        instance.trackOpenConnections.mockReset();
        instance.closeOpenConnections.mockReset();

        // Restore default implementations
        instance.instance.use.mockReturnThis();
        instance.instance.get.mockReturnValue([]);
        instance.instance.server.close.mockImplementation((cb) => cb && cb());
        instance.instance.router.hasRoute.mockReturnValue(false);
        instance.instance.listen.mockResolvedValue({});
        instance.instance.enabled = true;

        instance.init.mockImplementation(
            async (application: any, settings?: any) => {
                instance.application = application;
                instance.instance.server = instance.instance.server || {};
                instance.httpServer = instance.instance.server;
                return Promise.resolve();
            },
        );

        instance.connected.mockReturnValue(true);
        instance.close.mockResolvedValue('');

        instance.isJson.mockImplementation((object: any) => {
            try {
                if (object === null || object === undefined) return false;
                if (typeof object === 'object') return true;
                JSON.parse(object);
                return true;
            } catch (e) {
                return false;
            }
        });

        instance.setStaticServer.mockImplementation((publicDir: string) => {
            return (req: any, res: any, next: any) => next();
        });
    }

    public static getMockModule() {
        return {
            DefaultAdapter: MockDefaultAdapter,
        };
    }
}

/**
 * Centralized mock for HTTP components
 */
export class MockHttp {
    public static ControllerRegistry = MockControllerRegistry;
    public static HttpException = MockHttpException;
    public static DefaultAdapter = MockDefaultAdapter;

    /**
     * Reset all HTTP mocks
     */
    public static reset(): void {
        MockControllerRegistry.reset();
        MockDefaultAdapter.reset();
    }

    /**
     * Get a complete mock of the HTTP module
     */
    public static getMockModule() {
        return {
            ...MockControllerRegistry.getMockModule(),
            ...MockHttpException.getMockModule(),
            ...MockDefaultAdapter.getMockModule(),
        };
    }
}

/**
 * Centralized mock export for HTTP
 */
export const mockHttp = MockHttp;

// Export individual components
export const ControllerRegistry = MockControllerRegistry;
export const HttpException = MockHttpException;
export const DefaultAdapter = MockDefaultAdapter;
