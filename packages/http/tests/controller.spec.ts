import { describe, it, expect, beforeEach } from 'vitest';

import {
    Controller,
    Get,
    Post,
    Put,
    Delete,
    Patch,
    Body,
    Param,
    Query,
    Header,
    Request,
    Response,
    Proxy,
    UploadedFile,
    UploadedFiles,
} from '../decorators';

import { ControllerRegistry } from '../registries/controller.registry';

describe('Controller Decorators', () => {
    beforeEach(() => {
        ControllerRegistry.clear();
    });

    it('should register a controller with a given prefix', () => {
        @Controller('/test')
        class TestController {}

        const controllers = ControllerRegistry.getControllers();
        expect(controllers.length).toBe(1);
        expect(controllers[0][1].prefix).toBe('/test');
    });

    it('should register a controller with an empty prefix by default', () => {
        @Controller()
        class TestController {}

        const controllers = ControllerRegistry.getControllers();
        expect(controllers.length).toBe(1);
        expect(controllers[0][1].prefix).toBe('');
    });

    it('should register a GET route', () => {
        @Controller()
        class TestController {
            @Get('/test-get')
            getTest() {}
        }

        const routes = ControllerRegistry.getRoutes(TestController);
        expect(routes.length).toBe(1);
        expect(routes[0].method).toBe('get');
        expect(routes[0].path).toBe('/test-get');
    });

    it('should register a POST route', () => {
        @Controller()
        class TestController {
            @Post('/test-post')
            postTest() {}
        }

        const routes = ControllerRegistry.getRoutes(TestController);
        expect(routes.length).toBe(1);
        expect(routes[0].method).toBe('post');
        expect(routes[0].path).toBe('/test-post');
    });

    it('should register a PUT route', () => {
        @Controller()
        class TestController {
            @Put('/test-put')
            putTest() {}
        }

        const routes = ControllerRegistry.getRoutes(TestController);
        expect(routes.length).toBe(1);
        expect(routes[0].method).toBe('put');
        expect(routes[0].path).toBe('/test-put');
    });

    it('should register a DELETE route', () => {
        @Controller()
        class TestController {
            @Delete('/test-delete')
            deleteTest() {}
        }

        const routes = ControllerRegistry.getRoutes(TestController);
        expect(routes.length).toBe(1);
        expect(routes[0].method).toBe('delete');
        expect(routes[0].path).toBe('/test-delete');
    });

    it('should register a PATCH route', () => {
        @Controller()
        class TestController {
            @Patch('/test-patch')
            patchTest() {}
        }

        const routes = ControllerRegistry.getRoutes(TestController);
        expect(routes.length).toBe(1);
        expect(routes[0].method).toBe('patch');
        expect(routes[0].path).toBe('/test-patch');
    });

    it('should register a method with a Body parameter', () => {
        @Controller()
        class TestController {
            test(@Body() body: any) {}
        }

        const params = ControllerRegistry.getParams(
            TestController.prototype,
            'test',
        );
        expect(params.length).toBe(1);
        expect(params[0].paramType).toBe('body');
    });

    it('should register a method with a Param parameter', () => {
        @Controller()
        class TestController {
            test(@Param('id') id: string) {}
        }

        const params = ControllerRegistry.getParams(
            TestController.prototype,
            'test',
        );
        expect(params.length).toBe(1);
        expect(params[0].paramType).toBe('param:id');
        expect(params[0].paramName).toBe('id');
    });

    it('should register a method with a Query parameter', () => {
        @Controller()
        class TestController {
            test(@Query('search') search: string) {}
        }

        const params = ControllerRegistry.getParams(
            TestController.prototype,
            'test',
        );
        expect(params.length).toBe(1);
        expect(params[0].paramType).toBe('query:search');
        expect(params[0].paramName).toBe('search');
    });

    it('should register a method with a Header parameter', () => {
        @Controller()
        class TestController {
            test(@Header('authorization') auth: string) {}
        }

        const params = ControllerRegistry.getParams(
            TestController.prototype,
            'test',
        );
        expect(params.length).toBe(1);
        expect(params[0].paramType).toBe('header:authorization');
        expect(params[0].paramName).toBe('authorization');
    });

    it('should register a method with a Request parameter', () => {
        @Controller()
        class TestController {
            test(@Request() req: any) {}
        }

        const params = ControllerRegistry.getParams(
            TestController.prototype,
            'test',
        );
        expect(params.length).toBe(1);
        expect(params[0].paramType).toBe('request');
    });

    it('should register a method with a Response parameter', () => {
        @Controller()
        class TestController {
            test(@Response() res: any) {}
        }

        const params = ControllerRegistry.getParams(
            TestController.prototype,
            'test',
        );
        expect(params.length).toBe(1);
        expect(params[0].paramType).toBe('response');
    });

    it('should register proxy middleware for a route', () => {
        @Controller()
        class TestController {
            @Get('/proxy')
            @Proxy({ target: 'http://example.com' })
            test() {}
        }

        const routes = ControllerRegistry.getRoutes(TestController);
        expect(routes[0].middlewares?.[0]).toBeInstanceOf(Function);
    });

    it('should register UploadedFile parameter', () => {
        @Controller()
        class TestController {
            test(@UploadedFile('avatar') file: any) {}
        }

        const params = ControllerRegistry.getParams(
            TestController.prototype,
            'test',
        );
        expect(params[0].paramType).toBe('file:avatar');
    });

    it('should register UploadedFiles parameter', () => {
        @Controller()
        class TestController {
            test(@UploadedFiles() files: any) {}
        }

        const params = ControllerRegistry.getParams(
            TestController.prototype,
            'test',
        );
        expect(params[0].paramType).toBe('files');
    });
});
