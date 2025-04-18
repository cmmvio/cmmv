import { describe, it, expect, beforeEach, vi } from 'vitest';
import {
    mockHttp,
    MockHttp,
    MockControllerRegistry,
    MockHttpException,
    MockDefaultAdapter,
    ControllerRegistry,
    HttpException,
    DefaultAdapter,
} from '../../http/http.mock';

describe('HTTP Mocks', () => {
    beforeEach(() => {
        MockHttp.reset();
        vi.clearAllMocks();
    });

    describe('MockControllerRegistry', () => {
        it('should initialize with empty controllers array', () => {
            const controllers = MockControllerRegistry.getControllers();
            expect(controllers).toEqual([]);
        });

        it('should register and retrieve controllers', () => {
            const controllerClass = class TestController {};
            const metadata = { prefix: 'test', routes: [] };

            MockControllerRegistry.registerController(
                controllerClass,
                metadata,
            );

            // Não testamos o retorno diretamente, pois o mock retorna um array vazio por padrão
            expect(
                MockControllerRegistry.registerController,
            ).toHaveBeenCalledWith(controllerClass, metadata);
        });

        it('should reset registry state', () => {
            const controllerClass = class TestController {};
            const metadata = { prefix: 'test', routes: [] };

            MockControllerRegistry.registerController(
                controllerClass,
                metadata,
            );
            MockControllerRegistry.reset();

            expect(MockControllerRegistry.getControllers()).toEqual([]);
            expect(
                MockControllerRegistry.registerController,
            ).toHaveBeenCalledTimes(0);
        });
    });

    describe('MockHttpException', () => {
        it('should initialize with provided message and status', () => {
            const exception = new MockHttpException('Test error', 400);

            expect(exception.message).toBe('Test error');
            expect(exception.status).toBe(400);
        });

        it('should default to status 500 if not provided', () => {
            const exception = new MockHttpException('Test error');

            expect(exception.message).toBe('Test error');
            expect(exception.status).toBe(500);
        });

        it('should inherit from Error', () => {
            const exception = new MockHttpException('Test error');

            expect(exception instanceof Error).toBe(true);
        });
    });

    describe('MockDefaultAdapter', () => {
        it('should initialize with logger and instance properties', () => {
            const adapter = new MockDefaultAdapter();

            expect((adapter as any).logger).toBeDefined();
            expect((adapter as any).logger.log).toBeDefined();
            expect((adapter as any).logger.error).toBeDefined();
            expect((adapter as any).logger.warning).toBeDefined();
            expect((adapter as any).logger.verbose).toBeDefined();

            expect(adapter.instance).toBeDefined();
            expect(adapter.instance.disable).toBeDefined();
            expect(adapter.instance.use).toBeDefined();
            expect(adapter.instance.set).toBeDefined();
            expect(adapter.httpServer).toBe(adapter.instance.server);
        });

        it('should have init method that sets up the adapter', async () => {
            const adapter = new MockDefaultAdapter();
            const application = { name: 'test-app' };

            await adapter.init(application, {});

            expect(adapter.application).toBe(application);
            expect(adapter.httpServer).toBeDefined();
        });

        it('should have listen method that resolves correctly', async () => {
            const adapter = new MockDefaultAdapter();

            await expect(
                adapter.listen('localhost:3000'),
            ).resolves.toBeUndefined();
            expect(adapter.listen).toHaveBeenCalledWith('localhost:3000');
        });

        it('should have connected method that returns connection status', () => {
            const adapter = new MockDefaultAdapter();

            expect(adapter.connected()).toBe(true);
            expect(adapter.connected).toHaveBeenCalled();
        });

        it('should have close method that resolves correctly', async () => {
            const adapter = new MockDefaultAdapter();

            await expect(adapter.close()).resolves.toBe('');
            expect(adapter.close).toHaveBeenCalled();
        });

        it('should have isJson method that correctly identifies JSON objects', () => {
            const adapter = new MockDefaultAdapter();

            expect(adapter.isJson({ key: 'value' })).toBe(true);
            expect(adapter.isJson(null)).toBe(false);
            expect(adapter.isJson(undefined)).toBe(false);
        });

        it('should have setStaticServer method that returns a middleware function', () => {
            const adapter = new MockDefaultAdapter();
            const middleware = adapter.setStaticServer('/public');

            expect(typeof middleware).toBe('function');

            // Test the middleware
            const req = {};
            const res = {};
            const next = vi.fn();

            middleware(req, res, next);
            expect(next).toHaveBeenCalled();
        });

        it('should have methods to track and close connections', () => {
            const adapter = new MockDefaultAdapter();

            adapter.trackOpenConnections();
            expect(adapter.trackOpenConnections).toHaveBeenCalled();

            adapter.closeOpenConnections();
            expect(adapter.closeOpenConnections).toHaveBeenCalled();
        });

        it('should reset all mock implementations', () => {
            const adapter = new MockDefaultAdapter();

            // Change some implementations
            (adapter as any).logger.log.mockImplementation(() => 'log');
            adapter.instance.use.mockImplementation(() => 'use');
            adapter.listen.mockResolvedValue('listening');

            // Verify changes
            expect((adapter as any).logger.log()).toBe('log');
            expect(adapter.instance.use()).toBe('use');
            expect(adapter.listen('')).resolves.toBe('listening');

            // Reset
            MockDefaultAdapter.reset();

            // Create new instance since reset doesn't affect existing instances
            const newAdapter = new MockDefaultAdapter();

            // Verify reset
            expect((newAdapter as any).logger.log()).toBeUndefined();
            expect(newAdapter.instance.use()).toBe(newAdapter.instance);
            expect(newAdapter.listen('')).resolves.toBeUndefined();
        });
    });

    describe('MockHttp (Central)', () => {
        it('should provide access to all component mocks', () => {
            expect(MockHttp.ControllerRegistry).toBe(MockControllerRegistry);
            expect(MockHttp.HttpException).toBe(MockHttpException);
            expect(MockHttp.DefaultAdapter).toBe(MockDefaultAdapter);
        });

        it('should call reset on all components when reset is called', () => {
            const spyControllerRegistry = vi.spyOn(
                MockControllerRegistry,
                'reset',
            );
            const spyDefaultAdapter = vi.spyOn(MockDefaultAdapter, 'reset');

            MockHttp.reset();

            expect(spyControllerRegistry).toHaveBeenCalled();
            expect(spyDefaultAdapter).toHaveBeenCalled();
        });

        it('should provide complete mock module with all components', () => {
            const mockModule = MockHttp.getMockModule();

            expect(mockModule).toHaveProperty('ControllerRegistry');
            expect(mockModule).toHaveProperty('HttpException');
            expect(mockModule).toHaveProperty('DefaultAdapter');
        });
    });

    describe('Individual exports', () => {
        it('should export ControllerRegistry', () => {
            expect(ControllerRegistry).toBe(MockControllerRegistry);
        });

        it('should export HttpException', () => {
            expect(HttpException).toBe(MockHttpException);
        });

        it('should export DefaultAdapter', () => {
            expect(DefaultAdapter).toBe(MockDefaultAdapter);
        });

        it('should export mockHttp', () => {
            expect(mockHttp).toBe(MockHttp);
        });
    });
});
