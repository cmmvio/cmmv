import { describe, it, expect, beforeEach, vi, afterEach } from 'vitest';
import * as fs from 'node:fs';
import * as path from 'node:path';

vi.mock('node:fs', () => ({
    existsSync: vi.fn().mockReturnValue(true),
    mkdirSync: vi.fn(),
    writeFileSync: vi.fn(),
}));

vi.mock('js-yaml', () => ({
    dump: vi.fn().mockReturnValue('yaml-content'),
}));

vi.mock('@cmmv/core', async (importOriginal) => {
    const actual = await importOriginal();
    return {
        ...(actual as any),
        Config: {
            get: vi.fn(),
        },
        Scope: {
            getArray: vi.fn().mockReturnValue([]),
        },
        Service: () => (target: any) => target,
        Hook: () => () => {},
        HooksType: { onInitialize: 'onInitialize' },
    };
});

vi.mock('@cmmv/http', () => ({
    ControllerRegistry: {
        getControllers: vi.fn().mockReturnValue([]),
    },
    RouterSchema: {
        GetAll: 'GetAll',
        GetByID: 'GetByID',
        Insert: 'Insert',
        Update: 'Update',
        Delete: 'Delete',
        Raw: 'Raw',
    },
}));

vi.mock('../lib/openapi.registry', () => ({
    OpenAPIRegistry: {
        getControllers: vi.fn().mockReturnValue(new Map()),
    },
}));

vi.mock('../lib/openapi.schemas', () => ({
    SchemaGetAll: [],
}));

import { OpenAPIService } from '../lib/openapi.service';
import { Config, Scope } from '@cmmv/core';
import { ControllerRegistry, RouterSchema } from '@cmmv/http';
import { OpenAPIRegistry } from '../lib/openapi.registry';

describe('OpenAPIService', () => {
    let service: OpenAPIService;

    beforeEach(() => {
        vi.clearAllMocks();
        service = new OpenAPIService();
    });

    describe('processOpenAPI', () => {
        it('should generate OpenAPI schema with basic structure', async () => {
            vi.mocked(Config.get).mockReturnValue({
                openapi: '3.0.0',
                info: { title: 'Test API', version: '1.0.0' },
            });

            await service.processOpenAPI();

            expect(fs.writeFileSync).toHaveBeenCalledTimes(2);
        });

        it('should add Catch schema to components', async () => {
            vi.mocked(Config.get).mockReturnValue({});
            let savedSchema: any;
            vi.mocked(fs.writeFileSync).mockImplementation(
                (path: any, content: any) => {
                    if (path.includes('.json')) {
                        savedSchema = JSON.parse(content);
                    }
                },
            );

            await service.processOpenAPI();

            expect(savedSchema.components.schemas.Catch).toBeDefined();
            expect(
                savedSchema.components.schemas.Catch.properties.status,
            ).toBeDefined();
            expect(
                savedSchema.components.schemas.Catch.properties.message,
            ).toBeDefined();
        });

        it('should process schema type controllers', async () => {
            const mockControllers = new Map();
            mockControllers.set('TestSchema', {
                options: { apiType: 'schema', name: 'TestSchema' },
                properties: {
                    id: { type: 'string', required: true },
                    name: { type: 'string', required: false },
                },
            });
            vi.mocked(OpenAPIRegistry.getControllers).mockReturnValue(
                mockControllers,
            );
            vi.mocked(Config.get).mockReturnValue({});

            let savedSchema: any;
            vi.mocked(fs.writeFileSync).mockImplementation(
                (path: any, content: any) => {
                    if (path.includes('.json')) {
                        savedSchema = JSON.parse(content);
                    }
                },
            );

            await service.processOpenAPI();

            expect(savedSchema.components.schemas.TestSchema).toBeDefined();
            expect(
                savedSchema.components.schemas.TestSchema.properties.id,
            ).toBeDefined();
            expect(
                savedSchema.components.schemas.TestSchema.required,
            ).toContain('id');
        });

        it('should process HTTP controllers and routes', async () => {
            const mockRoutes = [
                {
                    method: 'GET',
                    path: 'users',
                    metadata: { summary: 'Get all users' },
                    middlewares: [],
                },
                {
                    method: 'POST',
                    path: 'users',
                    metadata: { summary: 'Create user' },
                    middlewares: [],
                },
            ];
            vi.mocked(ControllerRegistry.getControllers).mockReturnValue([
                [
                    { name: 'UserController' },
                    { prefix: 'api', routes: mockRoutes },
                ],
            ]);
            vi.mocked(Config.get).mockReturnValue({});

            let savedSchema: any;
            vi.mocked(fs.writeFileSync).mockImplementation(
                (path: any, content: any) => {
                    if (path.includes('.json')) {
                        savedSchema = JSON.parse(content);
                    }
                },
            );

            await service.processOpenAPI();

            expect(savedSchema.paths['/api/users']).toBeDefined();
            expect(savedSchema.paths['/api/users'].get).toBeDefined();
            expect(savedSchema.paths['/api/users'].post).toBeDefined();
        });

        it('should add security for authenticated routes', async () => {
            const mockRoutes = [
                {
                    method: 'GET',
                    path: 'protected',
                    metadata: {},
                    middlewares: [{ name: 'middlewareAuth' }],
                },
            ];
            vi.mocked(ControllerRegistry.getControllers).mockReturnValue([
                [
                    { name: 'ProtectedController' },
                    { prefix: 'api', routes: mockRoutes },
                ],
            ]);
            vi.mocked(Config.get).mockReturnValue({});

            let savedSchema: any;
            vi.mocked(fs.writeFileSync).mockImplementation(
                (path: any, content: any) => {
                    if (path.includes('.json')) {
                        savedSchema = JSON.parse(content);
                    }
                },
            );

            await service.processOpenAPI();

            expect(
                savedSchema.paths['/api/protected'].get.security,
            ).toContainEqual({ BearerAuth: [] });
            expect(
                savedSchema.paths['/api/protected'].get.responses['401'],
            ).toBeDefined();
            expect(
                savedSchema.paths['/api/protected'].get.responses['403'],
            ).toBeDefined();
        });

        it('should exclude routes with exclude flag', async () => {
            const mockRoutes = [
                {
                    method: 'GET',
                    path: 'internal',
                    metadata: { exclude: true },
                    middlewares: [],
                },
            ];
            vi.mocked(ControllerRegistry.getControllers).mockReturnValue([
                [
                    { name: 'InternalController' },
                    { prefix: 'api', routes: mockRoutes },
                ],
            ]);
            vi.mocked(Config.get).mockReturnValue({});

            let savedSchema: any;
            vi.mocked(fs.writeFileSync).mockImplementation(
                (path: any, content: any) => {
                    if (path.includes('.json')) {
                        savedSchema = JSON.parse(content);
                    }
                },
            );

            await service.processOpenAPI();

            expect(savedSchema.paths['/api/internal']).toBeUndefined();
        });

        it('should handle path parameters correctly', async () => {
            const mockRoutes = [
                {
                    method: 'GET',
                    path: ':id',
                    metadata: {},
                    middlewares: [],
                },
            ];
            vi.mocked(ControllerRegistry.getControllers).mockReturnValue([
                [
                    { name: 'ResourceController' },
                    { prefix: 'resources', routes: mockRoutes },
                ],
            ]);
            vi.mocked(Config.get).mockReturnValue({});

            let savedSchema: any;
            vi.mocked(fs.writeFileSync).mockImplementation(
                (path: any, content: any) => {
                    if (path.includes('.json')) {
                        savedSchema = JSON.parse(content);
                    }
                },
            );

            await service.processOpenAPI();

            expect(savedSchema.paths['/resources/{id}']).toBeDefined();
            expect(
                savedSchema.paths['/resources/{id}'].get.parameters,
            ).toContainEqual(
                expect.objectContaining({
                    name: 'id',
                    in: 'path',
                    required: true,
                }),
            );
        });

        it('should create directory if not exists', async () => {
            vi.mocked(fs.existsSync).mockReturnValue(false);
            vi.mocked(Config.get).mockReturnValue({});

            await service.processOpenAPI();

            expect(fs.mkdirSync).toHaveBeenCalledWith(expect.any(String), {
                recursive: true,
            });
        });

        it('should write both JSON and YAML files', async () => {
            vi.mocked(Config.get).mockReturnValue({});

            await service.processOpenAPI();

            const calls = vi.mocked(fs.writeFileSync).mock.calls;
            expect(calls.some((call: any) => call[0].includes('.json'))).toBe(
                true,
            );
            expect(calls.some((call: any) => call[0].includes('.yml'))).toBe(
                true,
            );
        });

        it('should add custom return and body from route metadata', async () => {
            const mockRoutes = [
                {
                    method: 'POST',
                    path: 'custom',
                    metadata: {
                        docs: {
                            body: {
                                content: {
                                    'application/json': {
                                        schema: { type: 'object' },
                                    },
                                },
                            },
                            return: { description: 'Custom response' },
                        },
                    },
                    middlewares: [],
                },
            ];
            vi.mocked(ControllerRegistry.getControllers).mockReturnValue([
                [
                    { name: 'CustomController' },
                    { prefix: 'api', routes: mockRoutes },
                ],
            ]);
            vi.mocked(Config.get).mockReturnValue({});

            let savedSchema: any;
            vi.mocked(fs.writeFileSync).mockImplementation(
                (path: any, content: any) => {
                    if (path.includes('.json')) {
                        savedSchema = JSON.parse(content);
                    }
                },
            );

            await service.processOpenAPI();

            expect(
                savedSchema.paths['/api/custom'].post.requestBody,
            ).toBeDefined();
            expect(
                savedSchema.paths['/api/custom'].post.responses['200'],
            ).toEqual({ description: 'Custom response' });
        });
    });

    describe('findContract', () => {
        it('should find contract by name', () => {
            const mockContracts = [
                { contractName: 'User' },
                { contractName: 'Post' },
            ];
            vi.mocked(Scope.getArray).mockReturnValue(mockContracts);

            const result = service.findContract('User');

            expect(result).toEqual({ contractName: 'User' });
        });

        it('should return undefined if contract not found', () => {
            vi.mocked(Scope.getArray).mockReturnValue([]);

            const result = service.findContract('NonExistent');

            expect(result).toBeUndefined();
        });
    });

    describe('getRequestResponse', () => {
        it('should return empty values when no contract found', () => {
            vi.mocked(Scope.getArray).mockReturnValue([]);

            const result = service.getRequestResponse({
                metadata: { contract: { name: 'Unknown' } },
            });

            expect(result).toEqual({
                request: null,
                response: null,
                parameters: [],
            });
        });

        it('should generate GetAll response schema', () => {
            const mockContract = {
                contractName: 'User',
                controllerName: 'User',
                fields: {
                    name: {
                        propertyKey: 'name',
                        protoType: 'string',
                        nullable: false,
                        exclude: false,
                    },
                },
            };
            vi.mocked(Scope.getArray).mockReturnValue([mockContract]);

            const result = service.getRequestResponse({
                metadata: {
                    schema: RouterSchema.GetAll,
                    contract: { name: 'User' },
                    exposeFilters: true,
                },
            });

            expect(result.response).toBeDefined();
            expect(result.response['200']).toBeDefined();
        });

        it('should generate Insert request schema', () => {
            const mockContract = {
                contractName: 'User',
                controllerName: 'User',
                fields: {
                    name: {
                        propertyKey: 'name',
                        protoType: 'string',
                        nullable: false,
                        exclude: false,
                    },
                },
            };
            vi.mocked(Scope.getArray).mockReturnValue([mockContract]);

            const result = service.getRequestResponse({
                metadata: {
                    schema: RouterSchema.Insert,
                    contract: { name: 'User' },
                },
            });

            expect(result.request).toBeDefined();
            expect(result.request.content['application/json']).toBeDefined();
        });

        it('should generate Update response and request schema', () => {
            const mockContract = {
                contractName: 'User',
                controllerName: 'User',
                fields: {
                    name: {
                        propertyKey: 'name',
                        protoType: 'string',
                        nullable: false,
                        exclude: false,
                    },
                },
            };
            vi.mocked(Scope.getArray).mockReturnValue([mockContract]);

            const result = service.getRequestResponse({
                metadata: {
                    schema: RouterSchema.Update,
                    contract: { name: 'User' },
                    exposeFilters: true,
                },
            });

            expect(result.response).toBeDefined();
            expect(
                result.response['200'].content['application/json'].schema
                    .properties.success,
            ).toBeDefined();
            expect(result.request).toBeDefined();
        });

        it('should generate Delete response schema', () => {
            const mockContract = {
                contractName: 'User',
                controllerName: 'User',
                fields: {},
            };
            vi.mocked(Scope.getArray).mockReturnValue([mockContract]);

            const result = service.getRequestResponse({
                metadata: {
                    schema: RouterSchema.Delete,
                    contract: { name: 'User' },
                },
            });

            expect(result.response).toBeDefined();
            expect(
                result.response['200'].content['application/json'].schema
                    .properties.success,
            ).toBeDefined();
            expect(
                result.response['200'].content['application/json'].schema
                    .properties.affected,
            ).toBeDefined();
        });

        it('should handle protoRepeated fields', () => {
            const mockContract = {
                contractName: 'User',
                controllerName: 'User',
                fields: {
                    tags: {
                        propertyKey: 'tags',
                        protoType: 'string',
                        protoRepeated: true,
                        nullable: false,
                        exclude: false,
                    },
                },
            };
            vi.mocked(Scope.getArray).mockReturnValue([mockContract]);

            const result = service.getRequestResponse({
                metadata: {
                    schema: RouterSchema.Insert,
                    contract: { name: 'User' },
                },
            });

            expect(
                result.request.content['application/json'].schema.properties
                    .tags.type,
            ).toBe('array');
        });

        it('should handle unique and default values', () => {
            const mockContract = {
                contractName: 'User',
                controllerName: 'User',
                fields: {
                    email: {
                        propertyKey: 'email',
                        protoType: 'string',
                        unique: true,
                        defaultValue: 'test@example.com',
                        nullable: false,
                        exclude: false,
                    },
                },
            };
            vi.mocked(Scope.getArray).mockReturnValue([mockContract]);

            const result = service.getRequestResponse({
                metadata: {
                    schema: RouterSchema.Insert,
                    contract: { name: 'User' },
                },
            });

            const emailProp =
                result.request.content['application/json'].schema.properties
                    .email;
            expect(emailProp.uniqueItems).toBe(true);
            expect(emailProp.default).toBe('test@example.com');
        });

        it('should exclude readOnly fields from update properties', () => {
            const mockContract = {
                contractName: 'User',
                controllerName: 'User',
                fields: {
                    id: {
                        propertyKey: 'id',
                        protoType: 'string',
                        readOnly: true,
                        nullable: false,
                        exclude: false,
                    },
                    name: {
                        propertyKey: 'name',
                        protoType: 'string',
                        nullable: false,
                        exclude: false,
                    },
                },
            };
            vi.mocked(Scope.getArray).mockReturnValue([mockContract]);

            const result = service.getRequestResponse({
                metadata: {
                    schema: RouterSchema.Update,
                    contract: { name: 'User' },
                    exposeFilters: true,
                },
            });

            const updateProps =
                result.request.content['application/json'].schema.properties;
            expect(updateProps.id).toBeUndefined();
            expect(updateProps.name).toBeDefined();
        });
    });
});
