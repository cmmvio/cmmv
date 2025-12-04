import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';


// Mock node:fs
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

// Mock node:path
vi.mock('node:path', () => ({
    join: vi.fn((...args) => args.join('/')),
    default: {
        join: vi.fn((...args) => args.join('/')),
    },
}));

// Mock node:process
vi.mock('node:process', () => ({
    cwd: vi.fn(() => '/mock/cwd'),
}));

// Mock type-graphql
vi.mock('type-graphql', () => ({
    buildSchema: vi.fn().mockResolvedValue({}),
}));

// Mock graphql-type-json
vi.mock('graphql-type-json', () => ({
    default: {},
}));

// Mock @cmmv/core
vi.mock('@cmmv/core', () => ({
    Application: {
        getResolvers: vi.fn().mockReturnValue([]),
    },
    AbstractTranspile: class MockAbstractTranspile {
        getImportPath = vi.fn((contract, type, name, defaultPath) => `${defaultPath}/${name}`);
        getGeneratedPath = vi.fn((contract, type) => `/mock/cwd/.generated/${type}`);
    },
    Config: {
        get: vi.fn((key: string, defaultValue?: any) => {
            const configs: Record<string, any> = {
                'app.sourceDir': 'src',
                'graphql.generateResolvers': true,
            };
            return configs[key] ?? defaultValue;
        }),
    },
    Scope: {
        getArray: vi.fn().mockReturnValue([]),
    },
    CONTROLLER_NAME_METADATA: 'controller:name',
    SUB_PATH_METADATA: 'controller:subPath',
}));

// Mock auth-checker
vi.mock('../lib/auth-checker', () => ({
    authChecker: vi.fn(),
}));

import { GraphQLTranspile } from '../lib/graphql.transpiler';
import { Config, Scope, Application } from '@cmmv/core';
import * as fs from 'node:fs';

describe('GraphQLTranspile', () => {
    let transpiler: GraphQLTranspile;

    beforeEach(() => {
        vi.clearAllMocks();
        transpiler = new GraphQLTranspile();
    });

    afterEach(() => {
        vi.clearAllMocks();
    });

    // Note: The run() method tests are skipped because fast-glob mocking with
    // namespace imports (import * as fg) is problematic in vitest.
    // The helper methods below cover the core transpiler logic.

    describe('helper methods', () => {
        describe('mapTypeToGraphQL', () => {
            it('should map string type', () => {
                const result = transpiler['mapTypeToGraphQL']('string');
                expect(result).toBe('String');
            });

            it('should map number type', () => {
                const result = transpiler['mapTypeToGraphQL']('number');
                expect(result).toBe('Float');
            });

            it('should map int type', () => {
                const result = transpiler['mapTypeToGraphQL']('int');
                expect(result).toBe('Int');
            });

            it('should map boolean type', () => {
                const result = transpiler['mapTypeToGraphQL']('boolean');
                expect(result).toBe('Boolean');
            });

            it('should map date type', () => {
                const result = transpiler['mapTypeToGraphQL']('date');
                expect(result).toBe('Date');
            });

            it('should map any type to JSON', () => {
                const result = transpiler['mapTypeToGraphQL']('any');
                expect(result).toBe('JSON');
            });

            it('should map object type to JSON', () => {
                const result = transpiler['mapTypeToGraphQL']('object');
                expect(result).toBe('JSON');
            });

            it('should map void type to Boolean', () => {
                const result = transpiler['mapTypeToGraphQL']('void');
                expect(result).toBe('Boolean');
            });

            it('should return JSON for unknown types', () => {
                const result = transpiler['mapTypeToGraphQL']('unknown');
                expect(result).toBe('JSON');
            });

            it('should return Boolean for null type', () => {
                const result = transpiler['mapTypeToGraphQL'](null as any);
                expect(result).toBe('Boolean');
            });
        });

        describe('mapToTsType', () => {
            it('should map string proto type', () => {
                const result = transpiler['mapToTsType']('string');
                expect(result).toBe('string');
            });

            it('should map boolean proto type', () => {
                const result = transpiler['mapToTsType']('boolean');
                expect(result).toBe('boolean');
            });

            it('should map bool proto type', () => {
                const result = transpiler['mapToTsType']('bool');
                expect(result).toBe('boolean');
            });

            it('should map int32 proto type', () => {
                const result = transpiler['mapToTsType']('int32');
                expect(result).toBe('number');
            });

            it('should map float proto type', () => {
                const result = transpiler['mapToTsType']('float');
                expect(result).toBe('number');
            });

            it('should map double proto type', () => {
                const result = transpiler['mapToTsType']('double');
                expect(result).toBe('number');
            });

            it('should map bytes proto type', () => {
                const result = transpiler['mapToTsType']('bytes');
                expect(result).toBe('Uint8Array');
            });

            it('should map timestamp proto type', () => {
                const result = transpiler['mapToTsType']('timestamp');
                expect(result).toBe('string');
            });

            it('should map json proto type', () => {
                const result = transpiler['mapToTsType']('json');
                expect(result).toBe('any');
            });

            it('should map jsonb proto type', () => {
                const result = transpiler['mapToTsType']('jsonb');
                expect(result).toBe('any');
            });

            it('should map simpleArray proto type', () => {
                const result = transpiler['mapToTsType']('simpleArray');
                expect(result).toBe('string[]');
            });

            it('should map bigint proto type', () => {
                const result = transpiler['mapToTsType']('bigint');
                expect(result).toBe('bigint');
            });

            it('should map unknown type to any', () => {
                const result = transpiler['mapToTsType']('unknown');
                expect(result).toBe('any');
            });
        });

        describe('mapToTsTypeUpper', () => {
            it('should map any to Any', () => {
                const result = transpiler['mapToTsTypeUpper']('any');
                expect(result).toBe('Any');
            });

            it('should map number types to Number', () => {
                expect(transpiler['mapToTsTypeUpper']('int')).toBe('Number');
                expect(transpiler['mapToTsTypeUpper']('int32')).toBe('Number');
                expect(transpiler['mapToTsTypeUpper']('float')).toBe('Number');
                expect(transpiler['mapToTsTypeUpper']('number')).toBe('Number');
            });

            it('should map string to String', () => {
                const result = transpiler['mapToTsTypeUpper']('string');
                expect(result).toBe('String');
            });

            it('should map boolean to Boolean', () => {
                const result = transpiler['mapToTsTypeUpper']('boolean');
                expect(result).toBe('Boolean');
            });

            it('should map bytes to Uint8Array', () => {
                const result = transpiler['mapToTsTypeUpper']('bytes');
                expect(result).toBe('Uint8Array');
            });

            it('should return undefined for simpleArray (maps to string[] which is not in switch)', () => {
                // mapToTsTypeUpper first calls mapToTsType('simpleArray') which returns 'string[]'
                // Since 'string[]' is not in the switch, it returns undefined
                const result = transpiler['mapToTsTypeUpper']('simpleArray');
                expect(result).toBeUndefined();
            });
        });

        describe('getGraphQLMethodType', () => {
            it('should return Query for GET method', () => {
                const result = transpiler['getGraphQLMethodType']('GET');
                expect(result).toBe('Query');
            });

            it('should return Query for get method (lowercase)', () => {
                const result = transpiler['getGraphQLMethodType']('get');
                expect(result).toBe('Query');
            });

            it('should return Mutation for POST method', () => {
                const result = transpiler['getGraphQLMethodType']('POST');
                expect(result).toBe('Mutation');
            });

            it('should return Mutation for PUT method', () => {
                const result = transpiler['getGraphQLMethodType']('PUT');
                expect(result).toBe('Mutation');
            });

            it('should return Mutation for DELETE method', () => {
                const result = transpiler['getGraphQLMethodType']('DELETE');
                expect(result).toBe('Mutation');
            });

            it('should return Mutation for PATCH method', () => {
                const result = transpiler['getGraphQLMethodType']('PATCH');
                expect(result).toBe('Mutation');
            });
        });

        describe('formatSubPath', () => {
            it('should return empty string for empty subPath', () => {
                const result = transpiler['formatSubPath']('');
                expect(result).toBe('');
            });

            it('should return empty string for null/undefined subPath', () => {
                const result = transpiler['formatSubPath'](null as any);
                expect(result).toBe('');
            });

            it('should add leading slash if missing', () => {
                const result = transpiler['formatSubPath']('api/v1');
                expect(result).toBe('/api/v1');
            });

            it('should keep leading slash if present', () => {
                const result = transpiler['formatSubPath']('/api/v1');
                expect(result).toBe('/api/v1');
            });
        });

        describe('findMessageByName', () => {
            it('should find message by name', () => {
                const messages = [
                    { name: 'User', properties: {} },
                    { name: 'Product', properties: {} },
                ];
                const result = transpiler['findMessageByName'](messages, 'User');
                expect(result).toEqual({ name: 'User', properties: {} });
            });

            it('should return null if message not found', () => {
                const messages = [{ name: 'User', properties: {} }];
                const result = transpiler['findMessageByName'](messages, 'NotFound');
                expect(result).toBeUndefined();
            });

            it('should return null for empty messages array', () => {
                const result = transpiler['findMessageByName']([], 'User');
                expect(result).toBeUndefined();
            });

            it('should return null for null messages', () => {
                const result = transpiler['findMessageByName'](null, 'User');
                expect(result).toBeNull();
            });

            it('should return null for null name', () => {
                const messages = [{ name: 'User', properties: {} }];
                const result = transpiler['findMessageByName'](messages, null);
                expect(result).toBeNull();
            });
        });

        describe('determineReturnType', () => {
            it('should handle array response with Array<> syntax', () => {
                const service = { response: 'Array<User>' };
                const messages = [{ name: 'User', properties: {} }];

                const result = transpiler['determineReturnType'](service, 'Product', messages);

                expect(result.isArray).toBe(true);
                expect(result.type).toBe('[UserGraphQLDTO]');
            });

            it('should handle array response with [] syntax', () => {
                const service = { response: 'User[]' };
                const messages = [{ name: 'User', properties: {} }];

                const result = transpiler['determineReturnType'](service, 'Product', messages);

                expect(result.isArray).toBe(true);
            });

            it('should handle entity return type', () => {
                const service = { response: 'Product' };
                const messages: any[] = [];

                const result = transpiler['determineReturnType'](service, 'Product', messages);

                expect(result.type).toBe('Product');
            });

            it('should handle primitive return types', () => {
                const service = { response: 'string' };
                const messages: any[] = [];

                const result = transpiler['determineReturnType'](service, 'Product', messages);

                expect(result.type).toBe('String');
            });

            it('should handle DTO response type', () => {
                const service = { response: 'UserResponse' };
                const messages = [{ name: 'UserResponse', properties: {} }];

                const result = transpiler['determineReturnType'](service, 'Product', messages);

                expect(result.type).toBe('UserResponseGraphQLDTO');
            });
        });
    });

    describe('getControllerDecorators', () => {
        it('should return empty string when authRouter is false', () => {
            const result = transpiler['getControllerDecorators'](
                { authRouter: false, rootOnlyRouter: false, contract: { controllerName: 'User' } },
                'get',
            );
            expect(result).toBe('');
        });

        it('should return Authorized decorator with role when authRouter is true', () => {
            const result = transpiler['getControllerDecorators'](
                { authRouter: true, rootOnlyRouter: false, contract: { controllerName: 'User' } },
                'get',
            );
            expect(result).toContain('@Authorized');
            expect(result).toContain('user:get');
        });

        it('should return rootOnly Authorized decorator when rootOnlyRouter is true', () => {
            const result = transpiler['getControllerDecorators'](
                { authRouter: true, rootOnlyRouter: true, contract: { controllerName: 'User' } },
                'get',
            );
            expect(result).toContain('@Authorized');
            expect(result).toContain('rootOnly: true');
        });
    });

    describe('generateClassField', () => {
        it('should generate field with correct type', () => {
            const field = {
                propertyKey: 'name',
                protoType: 'string',
                nullable: true,
            };

            const result = transpiler['generateClassField'](field);

            expect(result).toContain('@Field');
            expect(result).toContain('name:');
            expect(result).toContain('String');
        });

        it('should handle nullable fields', () => {
            const field = {
                propertyKey: 'age',
                protoType: 'int32',
                nullable: false,
            };

            const result = transpiler['generateClassField'](field);

            expect(result).toContain('nullable: false');
        });

        it('should return empty string for null field', () => {
            const result = transpiler['generateClassField'](null);
            expect(result).toBe('');
        });
    });

    describe('prepareCustomServices', () => {
        it('should return empty values for contract without services', () => {
            const contract = { services: [] };

            const result = transpiler['prepareCustomServices'](contract as any);

            expect(result.imports).toBe('');
            expect(result.properties).toBe('');
            expect(result.initializations).toBe('');
            expect(result.serviceMethodMap.size).toBe(0);
        });

        it('should prepare imports for custom services', () => {
            const contract = {
                services: [
                    {
                        module: '@cmmv/auth',
                        serviceName: 'AuthService',
                        functionName: 'login',
                    },
                ],
            };

            const result = transpiler['prepareCustomServices'](contract as any);

            expect(result.imports).toContain('import { AuthService }');
            expect(result.imports).toContain('@cmmv/auth');
        });

        it('should prepare properties for custom services', () => {
            const contract = {
                services: [
                    {
                        module: '@cmmv/auth',
                        serviceName: 'AuthService',
                        functionName: 'login',
                    },
                ],
            };

            const result = transpiler['prepareCustomServices'](contract as any);

            expect(result.properties).toContain('private readonly');
            expect(result.properties).toContain('authService');
        });

        it('should prepare initializations for custom services', () => {
            const contract = {
                services: [
                    {
                        module: '@cmmv/auth',
                        serviceName: 'AuthService',
                        functionName: 'login',
                    },
                ],
            };

            const result = transpiler['prepareCustomServices'](contract as any);

            expect(result.initializations).toContain('this.authService');
            expect(result.initializations).toContain('Application.resolveProvider');
        });

        it('should map service methods correctly', () => {
            const contract = {
                services: [
                    {
                        module: '@cmmv/auth',
                        serviceName: 'AuthService',
                        functionName: 'login',
                    },
                ],
            };

            const result = transpiler['prepareCustomServices'](contract as any);

            expect(result.serviceMethodMap.get('login')).toBe('authService');
        });
    });

    describe('generateCustomMethods', () => {
        it('should return empty string for contract without services', () => {
            const result = transpiler['generateCustomMethods'](
                { services: [] } as any,
                new Map(),
                'UserService',
                'User',
                false,
                false,
            );
            expect(result).toBe('');
        });

        it('should generate method with correct type', () => {
            const contract = {
                services: [
                    {
                        method: 'GET',
                        functionName: 'getUsers',
                        name: 'GetUsers',
                        request: 'void',
                    },
                ],
            };

            const result = transpiler['generateCustomMethods'](
                contract as any,
                new Map(),
                'UserService',
                'User',
                false,
                false,
            );

            expect(result).toContain('@Query');
            expect(result).toContain('getUsers');
        });

        it('should generate mutation for POST method', () => {
            const contract = {
                services: [
                    {
                        method: 'POST',
                        functionName: 'createUser',
                        name: 'CreateUser',
                        request: 'void',
                    },
                ],
            };

            const result = transpiler['generateCustomMethods'](
                contract as any,
                new Map(),
                'UserService',
                'User',
                false,
                false,
            );

            expect(result).toContain('@Mutation');
            expect(result).toContain('createUser');
        });
    });
});
