import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import * as fs from 'node:fs';
import * as path from 'node:path';

// Mock node:fs
vi.mock('node:fs', () => ({
    writeFileSync: vi.fn(),
    existsSync: vi.fn().mockReturnValue(true),
    mkdirSync: vi.fn(),
    appendFileSync: vi.fn(),
    default: {
        writeFileSync: vi.fn(),
        existsSync: vi.fn().mockReturnValue(true),
        mkdirSync: vi.fn(),
    },
}));

// Mock node:path
vi.mock('node:path', () => ({
    join: vi.fn((...args) => args.filter(Boolean).join('/')),
    resolve: vi.fn((...args) => args.filter(Boolean).join('/')),
    dirname: vi.fn((p) => p.split('/').slice(0, -1).join('/')),
    default: {
        join: vi.fn((...args) => args.filter(Boolean).join('/')),
        resolve: vi.fn((...args) => args.filter(Boolean).join('/')),
        dirname: vi.fn((p) => p.split('/').slice(0, -1).join('/')),
    },
}));

// Mock @cmmv/core lib
vi.mock('../../lib', () => ({
    AbstractTranspile: class MockAbstractTranspile {
        getGeneratedPath(contract: any, type: string) {
            return `generated/${type}`;
        }
        getRootPath(contract: any, type: string) {
            return `src/${type}`;
        }
        getImportPath() {
            return '@import/path';
        }
        getImportPathRelative() {
            return '../relative/path';
        }
        removeExtraSpaces(text: string) {
            return text.replace(/\n\s*\n\s*\n/g, '\n\n');
        }
        mapToTsType(protoType: string) {
            const mapping: Record<string, string> = {
                string: 'string',
                boolean: 'boolean',
                int32: 'number',
                float: 'number',
                date: 'string | Date',
                json: 'any',
            };
            return mapping[protoType] || 'any';
        }
    },
    Config: {
        get: vi.fn((key: string, defaultValue?: any) => {
            if (key === 'repository.type') return 'postgres';
            return defaultValue;
        }),
    },
    Scope: {
        getArray: vi.fn(() => []),
    },
    Module: {
        hasModule: vi.fn(() => false),
    },
    ITranspile: Symbol('ITranspile'),
}));

// Mock decorators
vi.mock('../../decorators', () => ({
    CONTROLLER_NAME_METADATA: Symbol('CONTROLLER_NAME_METADATA'),
}));

import { ApplicationTranspile } from '../../transpilers/application.transpile';
import { Config, Scope, Module } from '../../lib';

describe('ApplicationTranspile', () => {
    let transpile: ApplicationTranspile;

    beforeEach(() => {
        vi.clearAllMocks();
        transpile = new ApplicationTranspile();
    });

    afterEach(() => {
        vi.clearAllMocks();
    });

    describe('constructor', () => {
        it('should create an instance', () => {
            expect(transpile).toBeDefined();
            expect(transpile).toBeInstanceOf(ApplicationTranspile);
        });
    });

    describe('run', () => {
        it('should process contracts from scope', () => {
            const mockContract = {
                controllerName: 'User',
                fields: [
                    { propertyKey: 'name', protoType: 'string', nullable: false },
                ],
                options: { moduleContract: false },
                messages: {},
            };

            vi.mocked(Scope.getArray).mockReturnValue([mockContract]);

            transpile.run();

            expect(Scope.getArray).toHaveBeenCalledWith('__contracts');
        });

        it('should skip contracts without controllerName', () => {
            const mockContract = {
                controllerName: null,
                fields: [],
                options: {},
                messages: {},
            };

            vi.mocked(Scope.getArray).mockReturnValue([mockContract]);

            transpile.run();

            expect(fs.writeFileSync).not.toHaveBeenCalled();
        });

        it('should handle empty contracts array', () => {
            vi.mocked(Scope.getArray).mockReturnValue([]);

            transpile.run();

            expect(fs.writeFileSync).not.toHaveBeenCalled();
        });

        it('should handle undefined contracts', () => {
            vi.mocked(Scope.getArray).mockReturnValue(undefined);

            expect(() => transpile.run()).not.toThrow();
        });
    });

    describe('generateModel', () => {
        const createMockContract = (overrides = {}) => ({
            controllerName: 'User',
            fields: [
                {
                    propertyKey: 'name',
                    protoType: 'string',
                    nullable: false,
                },
                {
                    propertyKey: 'email',
                    protoType: 'string',
                    nullable: true,
                },
                {
                    propertyKey: 'age',
                    protoType: 'int32',
                    nullable: true,
                },
            ],
            options: { moduleContract: false },
            messages: {},
            ...overrides,
        });

        it('should generate model file with correct content', () => {
            const mockContract = createMockContract();
            vi.mocked(Scope.getArray).mockReturnValue([mockContract]);

            transpile.run();

            expect(fs.writeFileSync).toHaveBeenCalled();
            const callArgs = vi.mocked(fs.writeFileSync).mock.calls[0];
            const fileContent = callArgs[1] as string;

            expect(fileContent).toContain('export interface IUser');
            expect(fileContent).toContain('export class User extends AbstractModel');
            expect(fileContent).toContain('name: string');
            expect(fileContent).toContain('email?: string');
        });

        it('should use generated path for module contracts', () => {
            const mockContract = createMockContract({
                options: { moduleContract: true },
            });
            vi.mocked(Scope.getArray).mockReturnValue([mockContract]);

            transpile.run();

            const callArgs = vi.mocked(fs.writeFileSync).mock.calls[0];
            expect(callArgs[0]).toContain('generated');
        });

        it('should use root path for non-module contracts', () => {
            const mockContract = createMockContract({
                options: { moduleContract: false },
            });
            vi.mocked(Scope.getArray).mockReturnValue([mockContract]);

            transpile.run();

            const callArgs = vi.mocked(fs.writeFileSync).mock.calls[0];
            expect(callArgs[0]).toContain('src');
        });

        it('should generate interface with optional fields', () => {
            const mockContract = createMockContract({
                fields: [
                    { propertyKey: 'required', protoType: 'string', nullable: false },
                    { propertyKey: 'optional', protoType: 'string', nullable: true },
                ],
            });
            vi.mocked(Scope.getArray).mockReturnValue([mockContract]);

            transpile.run();

            const callArgs = vi.mocked(fs.writeFileSync).mock.calls[0];
            const fileContent = callArgs[1] as string;

            expect(fileContent).toContain('required: string');
            expect(fileContent).toContain('optional?: string');
        });

        it('should handle date fields', () => {
            const mockContract = createMockContract({
                fields: [
                    { propertyKey: 'createdAt', protoType: 'date', nullable: false },
                ],
            });
            vi.mocked(Scope.getArray).mockReturnValue([mockContract]);

            transpile.run();

            const callArgs = vi.mocked(fs.writeFileSync).mock.calls[0];
            const fileContent = callArgs[1] as string;

            expect(fileContent).toContain('createdAt');
            expect(fileContent).toContain('string | Date');
        });

        it('should handle array fields', () => {
            const mockContract = createMockContract({
                fields: [
                    {
                        propertyKey: 'tags',
                        protoType: 'string',
                        nullable: true,
                        protoRepeated: true,
                    },
                ],
            });
            vi.mocked(Scope.getArray).mockReturnValue([mockContract]);

            transpile.run();

            const callArgs = vi.mocked(fs.writeFileSync).mock.calls[0];
            const fileContent = callArgs[1] as string;

            expect(fileContent).toContain('tags');
            expect(fileContent).toContain('[]');
        });

        it('should include ObjectId import for MongoDB', () => {
            vi.mocked(Config.get).mockImplementation((key: string) => {
                if (key === 'repository.type') return 'mongodb';
                return undefined;
            });

            const mockContract = createMockContract();
            vi.mocked(Scope.getArray).mockReturnValue([mockContract]);

            transpile.run();

            const callArgs = vi.mocked(fs.writeFileSync).mock.calls[0];
            const fileContent = callArgs[1] as string;

            expect(fileContent).toContain('ObjectId');
        });

        it('should not include ObjectId for SQL databases', () => {
            vi.mocked(Config.get).mockImplementation((key: string) => {
                if (key === 'repository.type') return 'postgres';
                return undefined;
            });

            const mockContract = createMockContract();
            vi.mocked(Scope.getArray).mockReturnValue([mockContract]);

            transpile.run();

            const callArgs = vi.mocked(fs.writeFileSync).mock.calls[0];
            const fileContent = callArgs[1] as string;

            expect(fileContent).toContain('id?: any');
        });

        it('should handle fields with default values', () => {
            const mockContract = createMockContract({
                fields: [
                    {
                        propertyKey: 'status',
                        protoType: 'string',
                        nullable: false,
                        defaultValue: 'active',
                    },
                ],
            });
            vi.mocked(Scope.getArray).mockReturnValue([mockContract]);

            transpile.run();

            const callArgs = vi.mocked(fs.writeFileSync).mock.calls[0];
            const fileContent = callArgs[1] as string;

            expect(fileContent).toContain('status');
            expect(fileContent).toContain('"active"');
        });

        it('should handle read-only fields', () => {
            const mockContract = createMockContract({
                fields: [
                    {
                        propertyKey: 'createdAt',
                        protoType: 'date',
                        nullable: false,
                        readOnly: true,
                    },
                ],
            });
            vi.mocked(Scope.getArray).mockReturnValue([mockContract]);

            transpile.run();

            const callArgs = vi.mocked(fs.writeFileSync).mock.calls[0];
            const fileContent = callArgs[1] as string;

            expect(fileContent).toContain('readonly createdAt');
        });

        it('should skip WsCall and WsError interfaces for id generation', () => {
            const mockContract = createMockContract({
                controllerName: 'WsCall',
            });
            vi.mocked(Scope.getArray).mockReturnValue([mockContract]);

            transpile.run();

            const callArgs = vi.mocked(fs.writeFileSync).mock.calls[0];
            const fileContent = callArgs[1] as string;

            // WsCall should not have _id or id field in interface
            expect(fileContent).not.toContain('_id?: ObjectId');
        });

        it('should generate JSON schema for model', () => {
            const mockContract = createMockContract();
            vi.mocked(Scope.getArray).mockReturnValue([mockContract]);

            transpile.run();

            const callArgs = vi.mocked(fs.writeFileSync).mock.calls[0];
            const fileContent = callArgs[1] as string;

            expect(fileContent).toContain('UserFastSchemaStructure');
            expect(fileContent).toContain('UserFastSchema');
            expect(fileContent).toContain('type: "object"');
            expect(fileContent).toContain('properties:');
        });

        it('should generate fromPartial and fromEntity methods', () => {
            const mockContract = createMockContract();
            vi.mocked(Scope.getArray).mockReturnValue([mockContract]);

            transpile.run();

            const callArgs = vi.mocked(fs.writeFileSync).mock.calls[0];
            const fileContent = callArgs[1] as string;

            expect(fileContent).toContain('public static fromPartial');
            expect(fileContent).toContain('public static fromEntity');
            expect(fileContent).toContain('plainToInstance');
        });

        it('should not write file for undefined controller name', () => {
            const mockContract = createMockContract({
                controllerName: undefined,
            });
            vi.mocked(Scope.getArray).mockReturnValue([mockContract]);

            transpile.run();

            // Should not write a file with "undefined.model.ts"
            const calls = vi.mocked(fs.writeFileSync).mock.calls;
            const hasUndefinedFile = calls.some((call) =>
                String(call[0]).includes('undefined.model.ts'),
            );
            expect(hasUndefinedFile).toBe(false);
        });
    });

    describe('field validations', () => {
        it('should include validation decorators', () => {
            const mockContract = {
                controllerName: 'User',
                fields: [
                    {
                        propertyKey: 'email',
                        protoType: 'string',
                        nullable: false,
                        validations: [
                            { type: 'IsEmail', message: 'Invalid email' },
                        ],
                    },
                ],
                options: { moduleContract: false },
                messages: {},
            };
            vi.mocked(Scope.getArray).mockReturnValue([mockContract]);

            transpile.run();

            const callArgs = vi.mocked(fs.writeFileSync).mock.calls[0];
            const fileContent = callArgs[1] as string;

            expect(fileContent).toContain('@IsEmail');
            expect(fileContent).toContain('IsEmail');
        });

        it('should include IsNotEmpty for non-nullable fields', () => {
            const mockContract = {
                controllerName: 'User',
                fields: [
                    {
                        propertyKey: 'name',
                        protoType: 'string',
                        nullable: false,
                    },
                ],
                options: { moduleContract: false },
                messages: {},
            };
            vi.mocked(Scope.getArray).mockReturnValue([mockContract]);

            transpile.run();

            const callArgs = vi.mocked(fs.writeFileSync).mock.calls[0];
            const fileContent = callArgs[1] as string;

            expect(fileContent).toContain('@IsNotEmpty');
        });

        it('should handle excluded fields', () => {
            const mockContract = {
                controllerName: 'User',
                fields: [
                    {
                        propertyKey: 'password',
                        protoType: 'string',
                        nullable: false,
                        exclude: true,
                    },
                ],
                options: { moduleContract: false },
                messages: {},
            };
            vi.mocked(Scope.getArray).mockReturnValue([mockContract]);

            transpile.run();

            const callArgs = vi.mocked(fs.writeFileSync).mock.calls[0];
            const fileContent = callArgs[1] as string;

            expect(fileContent).toContain('@Exclude');
        });
    });

    describe('OpenAPI integration', () => {
        beforeEach(() => {
            vi.mocked(Module.hasModule).mockImplementation((name: string) => {
                return name === 'openapi';
            });
        });

        it('should include OpenAPI decorators when module is present', () => {
            const mockContract = {
                controllerName: 'User',
                fields: [
                    {
                        propertyKey: 'name',
                        protoType: 'string',
                        nullable: false,
                    },
                ],
                options: { moduleContract: false },
                messages: {},
            };
            vi.mocked(Scope.getArray).mockReturnValue([mockContract]);

            transpile.run();

            const callArgs = vi.mocked(fs.writeFileSync).mock.calls[0];
            const fileContent = callArgs[1] as string;

            expect(fileContent).toContain('@ApiSchema');
            expect(fileContent).toContain('@ApiProperty');
        });

        it('should use ApiPropertyOptional for nullable fields', () => {
            const mockContract = {
                controllerName: 'User',
                fields: [
                    {
                        propertyKey: 'nickname',
                        protoType: 'string',
                        nullable: true,
                    },
                ],
                options: { moduleContract: false },
                messages: {},
            };
            vi.mocked(Scope.getArray).mockReturnValue([mockContract]);

            transpile.run();

            const callArgs = vi.mocked(fs.writeFileSync).mock.calls[0];
            const fileContent = callArgs[1] as string;

            expect(fileContent).toContain('@ApiPropertyOptional');
        });

        it('should hide excluded fields from API', () => {
            const mockContract = {
                controllerName: 'User',
                fields: [
                    {
                        propertyKey: 'secret',
                        protoType: 'string',
                        nullable: false,
                        exclude: true,
                    },
                ],
                options: { moduleContract: false },
                messages: {},
            };
            vi.mocked(Scope.getArray).mockReturnValue([mockContract]);

            transpile.run();

            const callArgs = vi.mocked(fs.writeFileSync).mock.calls[0];
            const fileContent = callArgs[1] as string;

            expect(fileContent).toContain('@ApiHideProperty');
        });
    });

    describe('GraphQL integration', () => {
        beforeEach(() => {
            vi.mocked(Module.hasModule).mockImplementation((name: string) => {
                return name === 'graphql';
            });
        });

        it('should include GraphQL decorators when module is present', () => {
            const mockContract = {
                controllerName: 'User',
                fields: [
                    {
                        propertyKey: 'name',
                        protoType: 'string',
                        nullable: false,
                    },
                ],
                options: { moduleContract: false },
                messages: {},
            };
            vi.mocked(Scope.getArray).mockReturnValue([mockContract]);

            transpile.run();

            const callArgs = vi.mocked(fs.writeFileSync).mock.calls[0];
            const fileContent = callArgs[1] as string;

            expect(fileContent).toContain('@ObjectType');
            expect(fileContent).toContain('@Field');
        });
    });

    describe('DTOs generation', () => {
        it('should generate DTOs from messages', () => {
            const mockContract = {
                controllerName: 'User',
                fields: [
                    { propertyKey: 'name', protoType: 'string', nullable: false },
                ],
                options: { moduleContract: false },
                messages: {
                    CreateUser: {
                        name: 'CreateUser',
                        properties: {
                            name: { type: 'string', required: true },
                            email: { type: 'string', required: true },
                        },
                    },
                },
            };
            vi.mocked(Scope.getArray).mockReturnValue([mockContract]);

            transpile.run();

            const callArgs = vi.mocked(fs.writeFileSync).mock.calls[0];
            const fileContent = callArgs[1] as string;

            expect(fileContent).toContain('// DTOs');
            expect(fileContent).toContain('export interface CreateUser');
            expect(fileContent).toContain('export class CreateUserDTO');
        });

        it('should generate DTO with optional properties', () => {
            const mockContract = {
                controllerName: 'User',
                fields: [
                    { propertyKey: 'name', protoType: 'string', nullable: false },
                ],
                options: { moduleContract: false },
                messages: {
                    UpdateUser: {
                        name: 'UpdateUser',
                        properties: {
                            name: { type: 'string', required: false },
                        },
                    },
                },
            };
            vi.mocked(Scope.getArray).mockReturnValue([mockContract]);

            transpile.run();

            const callArgs = vi.mocked(fs.writeFileSync).mock.calls[0];
            const fileContent = callArgs[1] as string;

            expect(fileContent).toContain('name?: string');
        });
    });

    describe('type mappings', () => {
        it('should map proto types to TypeScript types', () => {
            const mockContract = {
                controllerName: 'Types',
                fields: [
                    { propertyKey: 'text', protoType: 'string', nullable: false },
                    { propertyKey: 'flag', protoType: 'boolean', nullable: false },
                    { propertyKey: 'count', protoType: 'int32', nullable: false },
                    { propertyKey: 'price', protoType: 'float', nullable: false },
                    { propertyKey: 'data', protoType: 'json', nullable: false },
                ],
                options: { moduleContract: false },
                messages: {},
            };
            vi.mocked(Scope.getArray).mockReturnValue([mockContract]);

            transpile.run();

            const callArgs = vi.mocked(fs.writeFileSync).mock.calls[0];
            const fileContent = callArgs[1] as string;

            expect(fileContent).toContain('text: string');
            expect(fileContent).toContain('flag: boolean');
            expect(fileContent).toContain('count: number');
            expect(fileContent).toContain('price: number');
            expect(fileContent).toContain('data: any');
        });

        it('should map types for JSON schema', () => {
            const mockContract = {
                controllerName: 'Types',
                fields: [
                    { propertyKey: 'text', protoType: 'string', nullable: false },
                    { propertyKey: 'count', protoType: 'int32', nullable: false },
                ],
                options: { moduleContract: false },
                messages: {},
            };
            vi.mocked(Scope.getArray).mockReturnValue([mockContract]);

            transpile.run();

            const callArgs = vi.mocked(fs.writeFileSync).mock.calls[0];
            const fileContent = callArgs[1] as string;

            expect(fileContent).toContain('type: "string"');
            expect(fileContent).toContain('type: "integer"');
        });
    });

    describe('transform functions', () => {
        it('should handle transform decorators', () => {
            const mockContract = {
                controllerName: 'User',
                fields: [
                    {
                        propertyKey: 'name',
                        protoType: 'string',
                        nullable: false,
                        transform: function (value: string) {
                            return value.toLowerCase();
                        },
                    },
                ],
                options: { moduleContract: false },
                messages: {},
            };
            vi.mocked(Scope.getArray).mockReturnValue([mockContract]);
            vi.mocked(Module.hasModule).mockReturnValue(true);

            transpile.run();

            const callArgs = vi.mocked(fs.writeFileSync).mock.calls[0];
            const fileContent = callArgs[1] as string;

            expect(fileContent).toContain('@Transform');
        });

        it('should handle afterValidation hooks', () => {
            const mockContract = {
                controllerName: 'User',
                fields: [
                    {
                        propertyKey: 'name',
                        protoType: 'string',
                        nullable: false,
                        afterValidation: function (value: string) {
                            return value.trim();
                        },
                    },
                ],
                options: { moduleContract: false },
                messages: {},
            };
            vi.mocked(Scope.getArray).mockReturnValue([mockContract]);

            transpile.run();

            const callArgs = vi.mocked(fs.writeFileSync).mock.calls[0];
            const fileContent = callArgs[1] as string;

            expect(fileContent).toContain('afterValidation');
        });
    });

    describe('custom decorators', () => {
        it('should handle custom decorators from @cmmv/core', () => {
            const mockContract = {
                controllerName: 'User',
                fields: [
                    {
                        propertyKey: 'email',
                        protoType: 'string',
                        nullable: false,
                        customDecorator: {
                            CustomValidator: {
                                import: '@cmmv/core',
                                options: { strict: true },
                            },
                        },
                    },
                ],
                options: { moduleContract: false },
                messages: {},
            };
            vi.mocked(Scope.getArray).mockReturnValue([mockContract]);

            transpile.run();

            const callArgs = vi.mocked(fs.writeFileSync).mock.calls[0];
            const fileContent = callArgs[1] as string;

            expect(fileContent).toContain('@CustomValidator');
        });

        it('should handle custom decorators from external packages', () => {
            const mockContract = {
                controllerName: 'User',
                fields: [
                    {
                        propertyKey: 'email',
                        protoType: 'string',
                        nullable: false,
                        customDecorator: {
                            ExternalValidator: {
                                import: 'external-package',
                                options: {},
                            },
                        },
                    },
                ],
                options: { moduleContract: false },
                messages: {},
            };
            vi.mocked(Scope.getArray).mockReturnValue([mockContract]);

            transpile.run();

            const callArgs = vi.mocked(fs.writeFileSync).mock.calls[0];
            const fileContent = callArgs[1] as string;

            expect(fileContent).toContain('import { ExternalValidator }');
            expect(fileContent).toContain('external-package');
        });
    });

    describe('imports generation', () => {
        it('should include custom module imports', () => {
            const mockContract = {
                controllerName: 'User',
                fields: [
                    { propertyKey: 'name', protoType: 'string', nullable: false },
                ],
                options: { moduleContract: false },
                messages: {},
                imports: ['lodash', 'dayjs'],
            };
            vi.mocked(Scope.getArray).mockReturnValue([mockContract]);

            transpile.run();

            const callArgs = vi.mocked(fs.writeFileSync).mock.calls[0];
            const fileContent = callArgs[1] as string;

            expect(fileContent).toContain('import * as lodash from "lodash"');
            expect(fileContent).toContain('import * as dayjs from "dayjs"');
        });

        it('should include Transform import when needed', () => {
            const mockContract = {
                controllerName: 'User',
                fields: [
                    {
                        propertyKey: 'name',
                        protoType: 'string',
                        nullable: false,
                        transform: (v: string) => v.toLowerCase(),
                    },
                ],
                options: { moduleContract: false },
                messages: {},
            };
            vi.mocked(Scope.getArray).mockReturnValue([mockContract]);

            transpile.run();

            const callArgs = vi.mocked(fs.writeFileSync).mock.calls[0];
            const fileContent = callArgs[1] as string;

            expect(fileContent).toContain('Transform');
        });
    });

    describe('edge cases', () => {
        it('should handle empty fields array', () => {
            const mockContract = {
                controllerName: 'Empty',
                fields: [],
                options: { moduleContract: false },
                messages: {},
            };
            vi.mocked(Scope.getArray).mockReturnValue([mockContract]);

            expect(() => transpile.run()).not.toThrow();

            const callArgs = vi.mocked(fs.writeFileSync).mock.calls[0];
            const fileContent = callArgs[1] as string;

            expect(fileContent).toContain('export interface IEmpty');
            expect(fileContent).toContain('export class Empty');
        });

        it('should handle multiple contracts', () => {
            const contracts = [
                {
                    controllerName: 'User',
                    fields: [{ propertyKey: 'name', protoType: 'string', nullable: false }],
                    options: { moduleContract: false },
                    messages: {},
                },
                {
                    controllerName: 'Post',
                    fields: [{ propertyKey: 'title', protoType: 'string', nullable: false }],
                    options: { moduleContract: false },
                    messages: {},
                },
            ];
            vi.mocked(Scope.getArray).mockReturnValue(contracts);

            transpile.run();

            expect(fs.writeFileSync).toHaveBeenCalledTimes(2);

            const calls = vi.mocked(fs.writeFileSync).mock.calls;
            expect(String(calls[0][0])).toContain('user.model.ts');
            expect(String(calls[1][0])).toContain('post.model.ts');
        });

        it('should handle fields with objectType', () => {
            const mockContract = {
                controllerName: 'User',
                fields: [
                    {
                        propertyKey: 'settings',
                        protoType: 'json',
                        nullable: true,
                        objectType: 'UserSettings',
                    },
                ],
                options: { moduleContract: false },
                messages: {},
            };
            vi.mocked(Scope.getArray).mockReturnValue([mockContract]);

            transpile.run();

            const callArgs = vi.mocked(fs.writeFileSync).mock.calls[0];
            const fileContent = callArgs[1] as string;

            expect(fileContent).toContain('settings?: UserSettings');
        });
    });
});
