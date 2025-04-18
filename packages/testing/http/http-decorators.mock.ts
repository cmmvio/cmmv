import { vi } from 'vitest';

// Helper to create mock decorator functions
const createMockDecorator = (name: string) => {
    const mockFn = vi.fn().mockImplementation((...args: any[]) => {
        return (...targetArgs: any[]) => {
            const [target, key, descriptor] = targetArgs;
            mockFn(args, target, key, descriptor);
            return descriptor;
        };
    });

    return mockFn;
};

// Helper to create mock parameter decorator functions
const createMockParamDecorator = (name: string) => {
    const mockFn = vi.fn().mockImplementation((...args: any[]) => {
        return (...targetArgs: any[]) => {
            const [target, key, paramIndex] = targetArgs;
            mockFn(args, target, key, paramIndex);
        };
    });

    return mockFn;
};

/**
 * Mock for route-middleware.util.ts
 */
export class MockRouteMiddlewareUtil {
    public static createRouteMiddleware = vi
        .fn()
        .mockImplementation((middleware: any, descriptor: any) => {
            const existingMiddleware = descriptor.middleware || [];
            descriptor.middleware = [...existingMiddleware, middleware];
            return descriptor;
        });

    public static reset(): void {
        MockRouteMiddlewareUtil.createRouteMiddleware.mockClear();
    }
}

/**
 * Mock for controller.decorator.ts
 */
export class MockControllerDecorator {
    public static Controller = createMockDecorator('Controller');
    public static Get = createMockDecorator('Get');
    public static Post = createMockDecorator('Post');
    public static Put = createMockDecorator('Put');
    public static Delete = createMockDecorator('Delete');
    public static Patch = createMockDecorator('Patch');

    // Parameter decorators
    public static Body = createMockParamDecorator('Body');
    public static Queries = createMockParamDecorator('Queries');
    public static Param = createMockParamDecorator('Param');
    public static Query = createMockParamDecorator('Query');
    public static Header = createMockParamDecorator('Header');
    public static Headers = createMockParamDecorator('Headers');
    public static Request = createMockParamDecorator('Request');
    public static Req = createMockParamDecorator('Req');
    public static Response = createMockParamDecorator('Response');
    public static Res = createMockParamDecorator('Res');
    public static Next = createMockParamDecorator('Next');
    public static Session = createMockParamDecorator('Session');
    public static User = createMockParamDecorator('User');
    public static Ip = createMockParamDecorator('Ip');
    public static HostParam = createMockParamDecorator('HostParam');

    // Enums
    public static RouterSchema = {
        GetAll: 0,
        GetByID: 1,
        GetIn: 2,
        Raw: 3,
        Insert: 4,
        Update: 5,
        Delete: 6,
        Import: 7,
        Export: 8,
    };

    public static reset(): void {
        MockControllerDecorator.Controller.mockClear();
        MockControllerDecorator.Get.mockClear();
        MockControllerDecorator.Post.mockClear();
        MockControllerDecorator.Put.mockClear();
        MockControllerDecorator.Delete.mockClear();
        MockControllerDecorator.Patch.mockClear();
        MockControllerDecorator.Body.mockClear();
        MockControllerDecorator.Queries.mockClear();
        MockControllerDecorator.Param.mockClear();
        MockControllerDecorator.Query.mockClear();
        MockControllerDecorator.Header.mockClear();
        MockControllerDecorator.Headers.mockClear();
        MockControllerDecorator.Request.mockClear();
        MockControllerDecorator.Req.mockClear();
        MockControllerDecorator.Response.mockClear();
        MockControllerDecorator.Res.mockClear();
        MockControllerDecorator.Next.mockClear();
        MockControllerDecorator.Session.mockClear();
        MockControllerDecorator.User.mockClear();
        MockControllerDecorator.Ip.mockClear();
        MockControllerDecorator.HostParam.mockClear();
    }
}

/**
 * Mock for cache-control.decorator.ts
 */
export class MockCacheControlDecorator {
    public static CacheControl = createMockDecorator('CacheControl');

    public static reset(): void {
        MockCacheControlDecorator.CacheControl.mockClear();
    }
}

/**
 * Mock for content-disposition.decorator.ts
 */
export class MockContentDispositionDecorator {
    public static ContentDisposition =
        createMockDecorator('ContentDisposition');

    public static reset(): void {
        MockContentDispositionDecorator.ContentDisposition.mockClear();
    }
}

/**
 * Mock for content-type.decorator.ts
 */
export class MockContentTypeDecorator {
    public static ContentType = createMockDecorator('ContentType');

    public static reset(): void {
        MockContentTypeDecorator.ContentType.mockClear();
    }
}

/**
 * Mock for expires.decorator.ts
 */
export class MockExpiresDecorator {
    public static Expires = createMockDecorator('Expires');

    public static reset(): void {
        MockExpiresDecorator.Expires.mockClear();
    }
}

/**
 * Mock for http-code.decorator.ts
 */
export class MockHttpCodeDecorator {
    public static HttpCode = createMockDecorator('HttpCode');

    public static reset(): void {
        MockHttpCodeDecorator.HttpCode.mockClear();
    }
}

/**
 * Mock for last-modified.decorator.ts
 */
export class MockLastModifiedDecorator {
    public static LastModified = createMockDecorator('LastModified');

    public static reset(): void {
        MockLastModifiedDecorator.LastModified.mockClear();
    }
}

/**
 * Mock for raw.decorator.ts
 */
export class MockRawDecorator {
    public static Raw = createMockDecorator('Raw');

    public static reset(): void {
        MockRawDecorator.Raw.mockClear();
    }
}

/**
 * Mock for redirect.decorator.ts
 */
export class MockRedirectDecorator {
    public static Redirect = createMockDecorator('Redirect');

    public static reset(): void {
        MockRedirectDecorator.Redirect.mockClear();
    }
}

/**
 * Centralized mock for HTTP decorators
 */
export class MockHttpDecorators {
    // Route middleware utils
    public static createRouteMiddleware =
        MockRouteMiddlewareUtil.createRouteMiddleware;

    // Controller decorators
    public static Controller = MockControllerDecorator.Controller;
    public static Get = MockControllerDecorator.Get;
    public static Post = MockControllerDecorator.Post;
    public static Put = MockControllerDecorator.Put;
    public static Delete = MockControllerDecorator.Delete;
    public static Patch = MockControllerDecorator.Patch;
    public static RouterSchema = MockControllerDecorator.RouterSchema;

    // Parameter decorators
    public static Body = MockControllerDecorator.Body;
    public static Queries = MockControllerDecorator.Queries;
    public static Param = MockControllerDecorator.Param;
    public static Query = MockControllerDecorator.Query;
    public static Header = MockControllerDecorator.Header;
    public static Headers = MockControllerDecorator.Headers;
    public static Request = MockControllerDecorator.Request;
    public static Req = MockControllerDecorator.Req;
    public static Response = MockControllerDecorator.Response;
    public static Res = MockControllerDecorator.Res;
    public static Next = MockControllerDecorator.Next;
    public static Session = MockControllerDecorator.Session;
    public static User = MockControllerDecorator.User;
    public static Ip = MockControllerDecorator.Ip;
    public static HostParam = MockControllerDecorator.HostParam;

    // Other decorators
    public static CacheControl = MockCacheControlDecorator.CacheControl;
    public static ContentDisposition =
        MockContentDispositionDecorator.ContentDisposition;
    public static ContentType = MockContentTypeDecorator.ContentType;
    public static Expires = MockExpiresDecorator.Expires;
    public static HttpCode = MockHttpCodeDecorator.HttpCode;
    public static LastModified = MockLastModifiedDecorator.LastModified;
    public static Raw = MockRawDecorator.Raw;
    public static Redirect = MockRedirectDecorator.Redirect;

    /**
     * Reset all decorator mocks
     */
    public static reset(): void {
        MockRouteMiddlewareUtil.reset();
        MockControllerDecorator.reset();
        MockCacheControlDecorator.reset();
        MockContentDispositionDecorator.reset();
        MockContentTypeDecorator.reset();
        MockExpiresDecorator.reset();
        MockHttpCodeDecorator.reset();
        MockLastModifiedDecorator.reset();
        MockRawDecorator.reset();
        MockRedirectDecorator.reset();
    }

    /**
     * Get mock module for all decorators
     */
    public static getMockModule() {
        return {
            // Route middleware utils
            createRouteMiddleware: MockHttpDecorators.createRouteMiddleware,

            // Controller decorators
            Controller: MockHttpDecorators.Controller,
            Get: MockHttpDecorators.Get,
            Post: MockHttpDecorators.Post,
            Put: MockHttpDecorators.Put,
            Delete: MockHttpDecorators.Delete,
            Patch: MockHttpDecorators.Patch,
            RouterSchema: MockHttpDecorators.RouterSchema,

            // Parameter decorators
            Body: MockHttpDecorators.Body,
            Queries: MockHttpDecorators.Queries,
            Param: MockHttpDecorators.Param,
            Query: MockHttpDecorators.Query,
            Header: MockHttpDecorators.Header,
            Headers: MockHttpDecorators.Headers,
            Request: MockHttpDecorators.Request,
            Req: MockHttpDecorators.Req,
            Response: MockHttpDecorators.Response,
            Res: MockHttpDecorators.Res,
            Next: MockHttpDecorators.Next,
            Session: MockHttpDecorators.Session,
            User: MockHttpDecorators.User,
            Ip: MockHttpDecorators.Ip,
            HostParam: MockHttpDecorators.HostParam,

            // Other decorators
            CacheControl: MockHttpDecorators.CacheControl,
            ContentDisposition: MockHttpDecorators.ContentDisposition,
            ContentType: MockHttpDecorators.ContentType,
            Expires: MockHttpDecorators.Expires,
            HttpCode: MockHttpDecorators.HttpCode,
            LastModified: MockHttpDecorators.LastModified,
            Raw: MockHttpDecorators.Raw,
            Redirect: MockHttpDecorators.Redirect,
        };
    }
}

/**
 * Centralized mock export for HTTP decorators
 */
export const mockHttpDecorators = MockHttpDecorators;

// Export all individual mocks with the same name as the original exports
export const {
    // Route middleware utils
    createRouteMiddleware,

    // Controller decorators
    Controller,
    Get,
    Post,
    Put,
    Delete,
    Patch,
    RouterSchema,

    // Parameter decorators
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

    // Other decorators
    CacheControl,
    ContentDisposition,
    ContentType,
    Expires,
    HttpCode,
    LastModified,
    Raw,
    Redirect,
} = MockHttpDecorators.getMockModule();
