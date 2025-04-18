import { describe, it, expect, beforeEach, vi } from 'vitest';
import {
    mockHttpDecorators,
    MockHttpDecorators,
    MockControllerDecorator,
    MockCacheControlDecorator,
    MockContentDispositionDecorator,
    MockContentTypeDecorator,
    MockExpiresDecorator,
    MockHttpCodeDecorator,
    MockLastModifiedDecorator,
    MockRawDecorator,
    MockRedirectDecorator,
    MockRouteMiddlewareUtil,

    // Individual decorators
    Controller,
    Get,
    Post,
    Put,
    Delete,
    Patch,
    RouterSchema,
    Body,
    Queries,
    Param,
    Query,
    Header,
    Headers,
    Request,
    Req,
    Response,
    Res,
    Next,
    Session,
    User,
    Ip,
    HostParam,
    CacheControl,
    ContentDisposition,
    ContentType,
    Expires,
    HttpCode,
    LastModified,
    Raw,
    Redirect,
    createRouteMiddleware,
} from '../../http/http-decorators.mock';

describe('HTTP Decorators Mocks', () => {
    beforeEach(() => {
        MockHttpDecorators.reset();
        vi.clearAllMocks();
    });

    describe('Route Middleware Utility', () => {
        it('should mock createRouteMiddleware function', () => {
            const descriptor: { value: () => void; middleware?: any[] } = {
                value: () => {},
            };
            const middleware = (req: any, res: any, next: any) => {
                next();
            };

            createRouteMiddleware(middleware, descriptor);

            expect(createRouteMiddleware).toHaveBeenCalledWith(
                middleware,
                descriptor,
            );
            expect(descriptor).toHaveProperty('middleware');
            expect(descriptor.middleware).toContain(middleware);
        });

        it('should append new middleware to existing ones', () => {
            const descriptor: { value: () => void; middleware: any[] } = {
                value: () => {},
                middleware: [() => {}],
            };
            const existingMiddlewareCount = descriptor.middleware.length;
            const middleware = (req: any, res: any, next: any) => {
                next();
            };

            createRouteMiddleware(middleware, descriptor);

            expect(descriptor.middleware.length).toBe(
                existingMiddlewareCount + 1,
            );
            expect(descriptor.middleware).toContain(middleware);
        });
    });

    describe('Controller Decorators', () => {
        it('should mock Controller decorator', () => {
            class TestController {}

            const decorated = Controller('api')(TestController);

            expect(Controller).toHaveBeenCalledWith('api');
        });

        it('should mock HTTP method decorators', () => {
            class TestController {
                testGet() {}
                testPost() {}
                testPut() {}
                testDelete() {}
                testPatch() {}
            }

            const descriptor = { value: TestController.prototype.testGet };

            Get('users')(TestController.prototype, 'testGet', descriptor);
            Post('users')(TestController.prototype, 'testPost', descriptor);
            Put('users/:id')(TestController.prototype, 'testPut', descriptor);
            Delete('users/:id')(
                TestController.prototype,
                'testDelete',
                descriptor,
            );
            Patch('users/:id')(
                TestController.prototype,
                'testPatch',
                descriptor,
            );

            expect(Get).toHaveBeenCalledWith('users');
            expect(Post).toHaveBeenCalledWith('users');
            expect(Put).toHaveBeenCalledWith('users/:id');
            expect(Delete).toHaveBeenCalledWith('users/:id');
            expect(Patch).toHaveBeenCalledWith('users/:id');
        });

        it('should mock parameter decorators', () => {
            class TestController {
                testMethod(
                    bodyParam: any,
                    queryParam: string,
                    pathParam: number,
                    req: any,
                    res: any,
                ) {}
            }

            Body()(TestController.prototype, 'testMethod', 0);
            Query('filter')(TestController.prototype, 'testMethod', 1);
            Param('id')(TestController.prototype, 'testMethod', 2);
            Request()(TestController.prototype, 'testMethod', 3);
            Response()(TestController.prototype, 'testMethod', 4);

            expect(Body).toHaveBeenCalled();
            expect(Query).toHaveBeenCalledWith('filter');
            expect(Param).toHaveBeenCalledWith('id');
            expect(Request).toHaveBeenCalled();
            expect(Response).toHaveBeenCalled();
        });

        it('should expose RouterSchema enum', () => {
            expect(RouterSchema).toBeDefined();
            expect(RouterSchema.GetAll).toBe(0);
            expect(RouterSchema.Update).toBe(5);
            expect(RouterSchema.Export).toBe(8);
        });
    });

    describe('HTTP Response Decorators', () => {
        it('should mock CacheControl decorator', () => {
            class TestController {
                testMethod() {}
            }

            const descriptor = { value: TestController.prototype.testMethod };

            CacheControl({ maxAge: 3600, public: true })(
                TestController.prototype,
                'testMethod',
                descriptor,
            );

            expect(CacheControl).toHaveBeenCalledWith({
                maxAge: 3600,
                public: true,
            });
        });

        it('should mock ContentDisposition decorator', () => {
            class TestController {
                testMethod() {}
            }

            const descriptor = { value: TestController.prototype.testMethod };

            ContentDisposition('attachment; filename="file.pdf"')(
                TestController.prototype,
                'testMethod',
                descriptor,
            );

            expect(ContentDisposition).toHaveBeenCalledWith(
                'attachment; filename="file.pdf"',
            );
        });

        it('should mock ContentType decorator', () => {
            class TestController {
                testMethod() {}
            }

            const descriptor = { value: TestController.prototype.testMethod };

            ContentType('application/json')(
                TestController.prototype,
                'testMethod',
                descriptor,
            );

            expect(ContentType).toHaveBeenCalledWith('application/json');
        });

        it('should mock Expires decorator', () => {
            class TestController {
                testMethod() {}
            }

            const descriptor = { value: TestController.prototype.testMethod };

            Expires(3600)(TestController.prototype, 'testMethod', descriptor);

            expect(Expires).toHaveBeenCalledWith(3600);
        });

        it('should mock HttpCode decorator', () => {
            class TestController {
                testMethod() {}
            }

            const descriptor = { value: TestController.prototype.testMethod };

            HttpCode(201)(TestController.prototype, 'testMethod', descriptor);

            expect(HttpCode).toHaveBeenCalledWith(201);
        });

        it('should mock LastModified decorator', () => {
            class TestController {
                testMethod() {}
            }

            const descriptor = { value: TestController.prototype.testMethod };
            const date = new Date();

            LastModified(date)(
                TestController.prototype,
                'testMethod',
                descriptor,
            );

            expect(LastModified).toHaveBeenCalledWith(date);
        });

        it('should mock Raw decorator', () => {
            class TestController {
                testMethod() {}
            }

            const descriptor = { value: TestController.prototype.testMethod };

            Raw()(TestController.prototype, 'testMethod', descriptor);

            expect(Raw).toHaveBeenCalled();
        });

        it('should mock Redirect decorator', () => {
            class TestController {
                testMethod() {}
            }

            const descriptor = { value: TestController.prototype.testMethod };

            Redirect('/login', 302)(
                TestController.prototype,
                'testMethod',
                descriptor,
            );

            expect(Redirect).toHaveBeenCalledWith('/login', 302);
        });
    });

    describe('Reset functionality', () => {
        it('should reset all decorator mocks', () => {
            // Call some decorators
            Controller('api');
            Get('users');
            CacheControl({ maxAge: 3600 });

            // Verify they were called
            expect(Controller).toHaveBeenCalled();
            expect(Get).toHaveBeenCalled();
            expect(CacheControl).toHaveBeenCalled();

            // Reset all mocks
            MockHttpDecorators.reset();

            // Verify call count has been reset
            expect(Controller).toHaveBeenCalledTimes(0);
            expect(Get).toHaveBeenCalledTimes(0);
            expect(CacheControl).toHaveBeenCalledTimes(0);
        });

        it('should reset individual decorator groups', () => {
            // Call some decorators
            Controller('api');
            CacheControl({ maxAge: 3600 });

            // Reset only controller decorators
            MockControllerDecorator.reset();

            // Verify only controller decorators were reset
            expect(Controller).toHaveBeenCalledTimes(0);
            expect(CacheControl).toHaveBeenCalledTimes(1);
        });
    });

    describe('Central module exports', () => {
        it('should export mockHttpDecorators as alias for MockHttpDecorators', () => {
            expect(mockHttpDecorators).toBe(MockHttpDecorators);
        });

        it('should provide getMockModule method that returns all decorators', () => {
            const mockModule = MockHttpDecorators.getMockModule();

            expect(mockModule).toHaveProperty('Controller');
            expect(mockModule).toHaveProperty('Get');
            expect(mockModule).toHaveProperty('CacheControl');
            expect(mockModule).toHaveProperty('createRouteMiddleware');
            expect(mockModule).toHaveProperty('Body');
            expect(mockModule).toHaveProperty('RouterSchema');
        });
    });
});
