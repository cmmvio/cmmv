import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';

// Mock node:fs before importing the module that uses it
vi.mock('node:fs', async (importOriginal) => {
    const actual = await importOriginal<typeof import('node:fs')>();
    return {
        ...actual,
        existsSync: vi.fn(),
        mkdirSync: vi.fn(),
        writeFileSync: vi.fn(),
    };
});

// Mock Logger to avoid circular dependency issues
vi.mock('../../lib/logger', () => ({
    Logger: class MockLogger {
        constructor(public name: string) {}
        log(...args: any[]) {}
        error(...args: any[]) {}
        warn(...args: any[]) {}
        debug(...args: any[]) {}
    },
}));

import * as fs from 'node:fs';
import { Compile } from '../../lib/compile';

describe('Compile', () => {
    let compile: Compile;

    beforeEach(() => {
        vi.clearAllMocks();
        // Reset singleton instance
        (Compile as any).instance = undefined;
        compile = Compile.getInstance();
    });

    afterEach(() => {
        vi.clearAllMocks();
    });

    describe('getInstance', () => {
        it('should return a singleton instance', () => {
            const instance1 = Compile.getInstance();
            const instance2 = Compile.getInstance();
            expect(instance1).toBe(instance2);
        });

        it('should create instance if not exists', () => {
            (Compile as any).instance = undefined;
            const instance = Compile.getInstance();
            expect(instance).toBeInstanceOf(Compile);
        });
    });

    describe('compileSchema', () => {
        it('should compile a valid schema and write to file', () => {
            const schema = {
                contractName: 'TestContract',
                controllerName: 'Test',
                fields: [
                    { propertyKey: 'id', protoType: 'string' },
                    { propertyKey: 'name', protoType: 'string' },
                ],
            };

            vi.mocked(fs.existsSync).mockReturnValue(true);

            const outputPath = '/output/test.contract.ts';
            const result = compile.compileSchema(schema, outputPath);

            expect(result).toBe(outputPath);
            expect(fs.writeFileSync).toHaveBeenCalled();
        });

        it('should create output directory if it does not exist', () => {
            const schema = {
                contractName: 'TestContract',
                controllerName: 'Test',
                fields: [{ propertyKey: 'id', protoType: 'string' }],
            };

            vi.mocked(fs.existsSync).mockReturnValue(false);

            compile.compileSchema(schema, '/new/dir/test.contract.ts');

            expect(fs.mkdirSync).toHaveBeenCalledWith('/new/dir', {
                recursive: true,
            });
        });

        it('should throw error if contractName is missing', () => {
            const schema = {
                controllerName: 'Test',
                fields: [],
            };

            expect(() =>
                compile.compileSchema(schema, '/output/test.ts'),
            ).toThrow('Schema must have a contractName property');
        });

        it('should throw error if controllerName is missing', () => {
            const schema = {
                contractName: 'TestContract',
                fields: [],
            };

            expect(() =>
                compile.compileSchema(schema, '/output/test.ts'),
            ).toThrow('Schema must have a controllerName property');
        });

        it('should throw error if fields is missing', () => {
            const schema = {
                contractName: 'TestContract',
                controllerName: 'Test',
            };

            expect(() =>
                compile.compileSchema(schema, '/output/test.ts'),
            ).toThrow('Schema must have a fields array property');
        });

        it('should throw error if fields is not an array', () => {
            const schema = {
                contractName: 'TestContract',
                controllerName: 'Test',
                fields: 'not an array',
            };

            expect(() =>
                compile.compileSchema(schema, '/output/test.ts'),
            ).toThrow('Schema must have a fields array property');
        });
    });

    describe('generateContractCode', () => {
        it('should generate contract code with namespace', () => {
            const schema = {
                contractName: 'TestContract',
                controllerName: 'Test',
                namespace: 'myapp',
                fields: [{ propertyKey: 'id', protoType: 'string' }],
            };

            vi.mocked(fs.existsSync).mockReturnValue(true);

            compile.compileSchema(schema, '/output/test.ts');

            const writtenCode = vi.mocked(fs.writeFileSync).mock
                .calls[0][1] as string;
            expect(writtenCode).toContain("namespace: 'myapp'");
        });

        it('should generate contract code with isPublic', () => {
            const schema = {
                contractName: 'TestContract',
                controllerName: 'Test',
                isPublic: true,
                fields: [{ propertyKey: 'id', protoType: 'string' }],
            };

            vi.mocked(fs.existsSync).mockReturnValue(true);

            compile.compileSchema(schema, '/output/test.ts');

            const writtenCode = vi.mocked(fs.writeFileSync).mock
                .calls[0][1] as string;
            expect(writtenCode).toContain('isPublic: true');
        });

        it('should generate contract code with protoPackage', () => {
            const schema = {
                contractName: 'TestContract',
                controllerName: 'Test',
                protoPackage: 'com.myapp.test',
                fields: [{ propertyKey: 'id', protoType: 'string' }],
            };

            vi.mocked(fs.existsSync).mockReturnValue(true);

            compile.compileSchema(schema, '/output/test.ts');

            const writtenCode = vi.mocked(fs.writeFileSync).mock
                .calls[0][1] as string;
            expect(writtenCode).toContain("protoPackage: 'com.myapp.test'");
        });

        it('should generate contract code with subPath', () => {
            const schema = {
                contractName: 'TestContract',
                controllerName: 'Test',
                subPath: 'api/v1',
                fields: [{ propertyKey: 'id', protoType: 'string' }],
            };

            vi.mocked(fs.existsSync).mockReturnValue(true);

            compile.compileSchema(schema, '/output/test.ts');

            const writtenCode = vi.mocked(fs.writeFileSync).mock
                .calls[0][1] as string;
            expect(writtenCode).toContain("subPath: 'api/v1'");
        });

        it('should generate contract code with generateController flag', () => {
            const schema = {
                contractName: 'TestContract',
                controllerName: 'Test',
                generateController: false,
                fields: [{ propertyKey: 'id', protoType: 'string' }],
            };

            vi.mocked(fs.existsSync).mockReturnValue(true);

            compile.compileSchema(schema, '/output/test.ts');

            const writtenCode = vi.mocked(fs.writeFileSync).mock
                .calls[0][1] as string;
            expect(writtenCode).toContain('generateController: false');
        });

        it('should generate contract code with generateEntities flag', () => {
            const schema = {
                contractName: 'TestContract',
                controllerName: 'Test',
                generateEntities: true,
                fields: [{ propertyKey: 'id', protoType: 'string' }],
            };

            vi.mocked(fs.existsSync).mockReturnValue(true);

            compile.compileSchema(schema, '/output/test.ts');

            const writtenCode = vi.mocked(fs.writeFileSync).mock
                .calls[0][1] as string;
            expect(writtenCode).toContain('generateEntities: true');
        });

        it('should generate contract code with auth flag', () => {
            const schema = {
                contractName: 'TestContract',
                controllerName: 'Test',
                auth: true,
                fields: [{ propertyKey: 'id', protoType: 'string' }],
            };

            vi.mocked(fs.existsSync).mockReturnValue(true);

            compile.compileSchema(schema, '/output/test.ts');

            const writtenCode = vi.mocked(fs.writeFileSync).mock
                .calls[0][1] as string;
            expect(writtenCode).toContain('auth: true');
        });

        it('should generate contract code with rootOnly flag', () => {
            const schema = {
                contractName: 'TestContract',
                controllerName: 'Test',
                rootOnly: true,
                fields: [{ propertyKey: 'id', protoType: 'string' }],
            };

            vi.mocked(fs.existsSync).mockReturnValue(true);

            compile.compileSchema(schema, '/output/test.ts');

            const writtenCode = vi.mocked(fs.writeFileSync).mock
                .calls[0][1] as string;
            expect(writtenCode).toContain('rootOnly: true');
        });

        it('should generate contract code with controllerCustomPath', () => {
            const schema = {
                contractName: 'TestContract',
                controllerName: 'Test',
                controllerCustomPath: '/custom/path',
                fields: [{ propertyKey: 'id', protoType: 'string' }],
            };

            vi.mocked(fs.existsSync).mockReturnValue(true);

            compile.compileSchema(schema, '/output/test.ts');

            const writtenCode = vi.mocked(fs.writeFileSync).mock
                .calls[0][1] as string;
            expect(writtenCode).toContain(
                "controllerCustomPath: '/custom/path'",
            );
        });
    });

    describe('generateImports', () => {
        it('should generate imports with messages', () => {
            const schema = {
                contractName: 'TestContract',
                controllerName: 'Test',
                fields: [{ propertyKey: 'id', protoType: 'string' }],
                messages: [{ name: 'TestMessage', propertyKey: 'testMsg' }],
            };

            vi.mocked(fs.existsSync).mockReturnValue(true);

            compile.compileSchema(schema, '/output/test.ts');

            const writtenCode = vi.mocked(fs.writeFileSync).mock
                .calls[0][1] as string;
            expect(writtenCode).toContain('ContractMessage');
        });

        it('should generate imports with services', () => {
            const schema = {
                contractName: 'TestContract',
                controllerName: 'Test',
                fields: [{ propertyKey: 'id', protoType: 'string' }],
                services: [{ name: 'getTest', path: '/test', method: 'GET' }],
            };

            vi.mocked(fs.existsSync).mockReturnValue(true);

            compile.compileSchema(schema, '/output/test.ts');

            const writtenCode = vi.mocked(fs.writeFileSync).mock
                .calls[0][1] as string;
            expect(writtenCode).toContain('ContractService');
        });

        it('should handle custom imports with braces', () => {
            const schema = {
                contractName: 'TestContract',
                controllerName: 'Test',
                fields: [{ propertyKey: 'id', protoType: 'string' }],
                imports: ['{ something } from somewhere'],
            };

            vi.mocked(fs.existsSync).mockReturnValue(true);

            compile.compileSchema(schema, '/output/test.ts');

            const writtenCode = vi.mocked(fs.writeFileSync).mock
                .calls[0][1] as string;
            expect(writtenCode).toContain('import { something } from somewhere');
        });
    });

    describe('generateContractField', () => {
        it('should generate field with string type', () => {
            const schema = {
                contractName: 'TestContract',
                controllerName: 'Test',
                fields: [{ propertyKey: 'name', protoType: 'string' }],
            };

            vi.mocked(fs.existsSync).mockReturnValue(true);

            compile.compileSchema(schema, '/output/test.ts');

            const writtenCode = vi.mocked(fs.writeFileSync).mock
                .calls[0][1] as string;
            expect(writtenCode).toContain('name: string');
            expect(writtenCode).toContain("protoType: 'string'");
        });

        it('should generate field with boolean type', () => {
            const schema = {
                contractName: 'TestContract',
                controllerName: 'Test',
                fields: [{ propertyKey: 'active', protoType: 'bool' }],
            };

            vi.mocked(fs.existsSync).mockReturnValue(true);

            compile.compileSchema(schema, '/output/test.ts');

            const writtenCode = vi.mocked(fs.writeFileSync).mock
                .calls[0][1] as string;
            expect(writtenCode).toContain('active: boolean');
        });

        it('should generate field with number types', () => {
            const schema = {
                contractName: 'TestContract',
                controllerName: 'Test',
                fields: [
                    { propertyKey: 'count', protoType: 'int32' },
                    { propertyKey: 'bigCount', protoType: 'int64' },
                    { propertyKey: 'price', protoType: 'float' },
                    { propertyKey: 'precise', protoType: 'double' },
                ],
            };

            vi.mocked(fs.existsSync).mockReturnValue(true);

            compile.compileSchema(schema, '/output/test.ts');

            const writtenCode = vi.mocked(fs.writeFileSync).mock
                .calls[0][1] as string;
            expect(writtenCode).toContain('count: number');
            expect(writtenCode).toContain('bigCount: number');
            expect(writtenCode).toContain('price: number');
            expect(writtenCode).toContain('precise: number');
        });

        it('should generate field with unique flag', () => {
            const schema = {
                contractName: 'TestContract',
                controllerName: 'Test',
                fields: [
                    { propertyKey: 'email', protoType: 'string', unique: true },
                ],
            };

            vi.mocked(fs.existsSync).mockReturnValue(true);

            compile.compileSchema(schema, '/output/test.ts');

            const writtenCode = vi.mocked(fs.writeFileSync).mock
                .calls[0][1] as string;
            expect(writtenCode).toContain('unique: true');
        });

        it('should generate field with nullable flag', () => {
            const schema = {
                contractName: 'TestContract',
                controllerName: 'Test',
                fields: [
                    {
                        propertyKey: 'description',
                        protoType: 'string',
                        nullable: true,
                    },
                ],
            };

            vi.mocked(fs.existsSync).mockReturnValue(true);

            compile.compileSchema(schema, '/output/test.ts');

            const writtenCode = vi.mocked(fs.writeFileSync).mock
                .calls[0][1] as string;
            expect(writtenCode).toContain('nullable: true');
            expect(writtenCode).toContain('description?: string');
        });

        it('should generate field with string defaultValue', () => {
            const schema = {
                contractName: 'TestContract',
                controllerName: 'Test',
                fields: [
                    {
                        propertyKey: 'status',
                        protoType: 'string',
                        defaultValue: 'active',
                    },
                ],
            };

            vi.mocked(fs.existsSync).mockReturnValue(true);

            compile.compileSchema(schema, '/output/test.ts');

            const writtenCode = vi.mocked(fs.writeFileSync).mock
                .calls[0][1] as string;
            expect(writtenCode).toContain("defaultValue: 'active'");
        });

        it('should generate field with numeric defaultValue', () => {
            const schema = {
                contractName: 'TestContract',
                controllerName: 'Test',
                fields: [
                    {
                        propertyKey: 'count',
                        protoType: 'int32',
                        defaultValue: 0,
                    },
                ],
            };

            vi.mocked(fs.existsSync).mockReturnValue(true);

            compile.compileSchema(schema, '/output/test.ts');

            const writtenCode = vi.mocked(fs.writeFileSync).mock
                .calls[0][1] as string;
            expect(writtenCode).toContain('defaultValue: 0');
        });

        it('should generate field with readOnly flag', () => {
            const schema = {
                contractName: 'TestContract',
                controllerName: 'Test',
                fields: [
                    { propertyKey: 'id', protoType: 'string', readOnly: true },
                ],
            };

            vi.mocked(fs.existsSync).mockReturnValue(true);

            compile.compileSchema(schema, '/output/test.ts');

            const writtenCode = vi.mocked(fs.writeFileSync).mock
                .calls[0][1] as string;
            expect(writtenCode).toContain('readOnly: true');
        });

        it('should generate field with index flag', () => {
            const schema = {
                contractName: 'TestContract',
                controllerName: 'Test',
                fields: [
                    { propertyKey: 'email', protoType: 'string', index: true },
                ],
            };

            vi.mocked(fs.existsSync).mockReturnValue(true);

            compile.compileSchema(schema, '/output/test.ts');

            const writtenCode = vi.mocked(fs.writeFileSync).mock
                .calls[0][1] as string;
            expect(writtenCode).toContain('index: true');
        });

        it('should generate field with validations', () => {
            const schema = {
                contractName: 'TestContract',
                controllerName: 'Test',
                fields: [
                    {
                        propertyKey: 'email',
                        protoType: 'string',
                        validations: [
                            { type: 'isEmail', message: 'Invalid email' },
                            {
                                type: 'minLength',
                                value: 5,
                                message: 'Too short',
                            },
                        ],
                    },
                ],
            };

            vi.mocked(fs.existsSync).mockReturnValue(true);

            compile.compileSchema(schema, '/output/test.ts');

            const writtenCode = vi.mocked(fs.writeFileSync).mock
                .calls[0][1] as string;
            expect(writtenCode).toContain("type: 'isEmail'");
            expect(writtenCode).toContain("message: 'Invalid email'");
            expect(writtenCode).toContain("type: 'minLength'");
            expect(writtenCode).toContain('value: 5');
        });

        it('should generate field with protoRepeated', () => {
            const schema = {
                contractName: 'TestContract',
                controllerName: 'Test',
                fields: [
                    {
                        propertyKey: 'tags',
                        protoType: 'string',
                        protoRepeated: true,
                    },
                ],
            };

            vi.mocked(fs.existsSync).mockReturnValue(true);

            compile.compileSchema(schema, '/output/test.ts');

            const writtenCode = vi.mocked(fs.writeFileSync).mock
                .calls[0][1] as string;
            expect(writtenCode).toContain('protoRepeated: true');
        });

        it('should generate field with exclude flag', () => {
            const schema = {
                contractName: 'TestContract',
                controllerName: 'Test',
                fields: [
                    {
                        propertyKey: 'password',
                        protoType: 'string',
                        exclude: true,
                    },
                ],
            };

            vi.mocked(fs.existsSync).mockReturnValue(true);

            compile.compileSchema(schema, '/output/test.ts');

            const writtenCode = vi.mocked(fs.writeFileSync).mock
                .calls[0][1] as string;
            expect(writtenCode).toContain('exclude: true');
        });

        it('should generate field with toPlainOnly flag', () => {
            const schema = {
                contractName: 'TestContract',
                controllerName: 'Test',
                fields: [
                    {
                        propertyKey: 'hash',
                        protoType: 'string',
                        toPlainOnly: true,
                    },
                ],
            };

            vi.mocked(fs.existsSync).mockReturnValue(true);

            compile.compileSchema(schema, '/output/test.ts');

            const writtenCode = vi.mocked(fs.writeFileSync).mock
                .calls[0][1] as string;
            expect(writtenCode).toContain('toPlainOnly: true');
        });

        it('should generate field with objectType', () => {
            const schema = {
                contractName: 'TestContract',
                controllerName: 'Test',
                fields: [
                    {
                        propertyKey: 'metadata',
                        protoType: 'bytes',
                        objectType: 'json',
                    },
                ],
            };

            vi.mocked(fs.existsSync).mockReturnValue(true);

            compile.compileSchema(schema, '/output/test.ts');

            const writtenCode = vi.mocked(fs.writeFileSync).mock
                .calls[0][1] as string;
            expect(writtenCode).toContain("objectType: 'json'");
        });

        it('should generate field with entityType', () => {
            const schema = {
                contractName: 'TestContract',
                controllerName: 'Test',
                fields: [
                    {
                        propertyKey: 'data',
                        protoType: 'bytes',
                        entityType: 'jsonb',
                    },
                ],
            };

            vi.mocked(fs.existsSync).mockReturnValue(true);

            compile.compileSchema(schema, '/output/test.ts');

            const writtenCode = vi.mocked(fs.writeFileSync).mock
                .calls[0][1] as string;
            expect(writtenCode).toContain("entityType: 'jsonb'");
        });

        it('should generate field with resolver', () => {
            const schema = {
                contractName: 'TestContract',
                controllerName: 'Test',
                fields: [
                    {
                        propertyKey: 'computed',
                        protoType: 'string',
                        resolver: 'computeValue',
                    },
                ],
            };

            vi.mocked(fs.existsSync).mockReturnValue(true);

            compile.compileSchema(schema, '/output/test.ts');

            const writtenCode = vi.mocked(fs.writeFileSync).mock
                .calls[0][1] as string;
            expect(writtenCode).toContain("resolver: 'computeValue'");
        });

        it('should generate field with link', () => {
            const schema = {
                contractName: 'TestContract',
                controllerName: 'Test',
                fields: [
                    {
                        propertyKey: 'userId',
                        protoType: 'string',
                        link: [
                            {
                                contract: 'UserContract',
                                entityName: 'User',
                                field: 'id',
                                createRelationship: true,
                                array: false,
                            },
                        ],
                    },
                ],
            };

            vi.mocked(fs.existsSync).mockReturnValue(true);

            compile.compileSchema(schema, '/output/test.ts');

            const writtenCode = vi.mocked(fs.writeFileSync).mock
                .calls[0][1] as string;
            expect(writtenCode).toContain('link: [');
            expect(writtenCode).toContain('createRelationship: true');
            expect(writtenCode).toContain("entityName: 'User'");
            expect(writtenCode).toContain("field: 'id'");
            expect(writtenCode).toContain('array: false');
        });
    });

    describe('generateContractMessage', () => {
        it('should generate message with properties', () => {
            const schema = {
                contractName: 'TestContract',
                controllerName: 'Test',
                fields: [{ propertyKey: 'id', protoType: 'string' }],
                messages: [
                    {
                        name: 'CreateRequest',
                        propertyKey: 'createRequest',
                        properties: {
                            name: { type: 'string', required: true },
                            count: { type: 'int32', required: false },
                        },
                    },
                ],
            };

            vi.mocked(fs.existsSync).mockReturnValue(true);

            compile.compileSchema(schema, '/output/test.ts');

            const writtenCode = vi.mocked(fs.writeFileSync).mock
                .calls[0][1] as string;
            expect(writtenCode).toContain("name: 'CreateRequest'");
            expect(writtenCode).toContain("type: 'string'");
            expect(writtenCode).toContain('required: true');
        });

        it('should generate message with simpleArray type', () => {
            const schema = {
                contractName: 'TestContract',
                controllerName: 'Test',
                fields: [{ propertyKey: 'id', protoType: 'string' }],
                messages: [
                    {
                        name: 'ListRequest',
                        propertyKey: 'listRequest',
                        properties: {
                            ids: { type: 'simpleArray', arrayType: 'string' },
                        },
                    },
                ],
            };

            vi.mocked(fs.existsSync).mockReturnValue(true);

            compile.compileSchema(schema, '/output/test.ts');

            const writtenCode = vi.mocked(fs.writeFileSync).mock
                .calls[0][1] as string;
            expect(writtenCode).toContain("type: 'simpleArray'");
            expect(writtenCode).toContain("arrayType: 'string'");
        });
    });

    describe('generateContractService', () => {
        it('should generate service with basic properties', () => {
            const schema = {
                contractName: 'TestContract',
                controllerName: 'Test',
                fields: [{ propertyKey: 'id', protoType: 'string' }],
                services: [
                    {
                        name: 'getAll',
                        path: '/all',
                        method: 'GET',
                        propertyKey: 'getAllItems',
                    },
                ],
            };

            vi.mocked(fs.existsSync).mockReturnValue(true);

            compile.compileSchema(schema, '/output/test.ts');

            const writtenCode = vi.mocked(fs.writeFileSync).mock
                .calls[0][1] as string;
            expect(writtenCode).toContain("name: 'getAll'");
            expect(writtenCode).toContain("path: '/all'");
            expect(writtenCode).toContain("method: 'GET'");
        });

        it('should generate service with auth flag', () => {
            const schema = {
                contractName: 'TestContract',
                controllerName: 'Test',
                fields: [{ propertyKey: 'id', protoType: 'string' }],
                services: [
                    {
                        name: 'secure',
                        path: '/secure',
                        method: 'POST',
                        auth: true,
                    },
                ],
            };

            vi.mocked(fs.existsSync).mockReturnValue(true);

            compile.compileSchema(schema, '/output/test.ts');

            const writtenCode = vi.mocked(fs.writeFileSync).mock
                .calls[0][1] as string;
            expect(writtenCode).toContain('auth: true');
        });

        it('should generate service with rootOnly flag', () => {
            const schema = {
                contractName: 'TestContract',
                controllerName: 'Test',
                fields: [{ propertyKey: 'id', protoType: 'string' }],
                services: [
                    {
                        name: 'admin',
                        path: '/admin',
                        method: 'DELETE',
                        rootOnly: true,
                    },
                ],
            };

            vi.mocked(fs.existsSync).mockReturnValue(true);

            compile.compileSchema(schema, '/output/test.ts');

            const writtenCode = vi.mocked(fs.writeFileSync).mock
                .calls[0][1] as string;
            expect(writtenCode).toContain('rootOnly: true');
        });

        it('should generate service with request and response', () => {
            const schema = {
                contractName: 'TestContract',
                controllerName: 'Test',
                fields: [{ propertyKey: 'id', protoType: 'string' }],
                services: [
                    {
                        name: 'create',
                        path: '/create',
                        method: 'POST',
                        request: 'CreateRequest',
                        response: 'CreateResponse',
                    },
                ],
            };

            vi.mocked(fs.existsSync).mockReturnValue(true);

            compile.compileSchema(schema, '/output/test.ts');

            const writtenCode = vi.mocked(fs.writeFileSync).mock
                .calls[0][1] as string;
            expect(writtenCode).toContain("request: 'CreateRequest'");
            expect(writtenCode).toContain("response: 'CreateResponse'");
        });

        it('should generate service with cache configuration', () => {
            const schema = {
                contractName: 'TestContract',
                controllerName: 'Test',
                fields: [{ propertyKey: 'id', protoType: 'string' }],
                services: [
                    {
                        name: 'cached',
                        path: '/cached',
                        method: 'GET',
                        cache: {
                            key: 'cache-key',
                            ttl: 3600,
                            compress: true,
                        },
                    },
                ],
            };

            vi.mocked(fs.existsSync).mockReturnValue(true);

            compile.compileSchema(schema, '/output/test.ts');

            const writtenCode = vi.mocked(fs.writeFileSync).mock
                .calls[0][1] as string;
            expect(writtenCode).toContain("key: 'cache-key'");
            expect(writtenCode).toContain('ttl: 3600');
            expect(writtenCode).toContain('compress: true');
        });

        it('should generate service with functionName', () => {
            const schema = {
                contractName: 'TestContract',
                controllerName: 'Test',
                fields: [{ propertyKey: 'id', protoType: 'string' }],
                services: [
                    {
                        name: 'custom',
                        path: '/custom',
                        method: 'GET',
                        functionName: 'customFunction',
                    },
                ],
            };

            vi.mocked(fs.existsSync).mockReturnValue(true);

            compile.compileSchema(schema, '/output/test.ts');

            const writtenCode = vi.mocked(fs.writeFileSync).mock
                .calls[0][1] as string;
            expect(writtenCode).toContain("functionName: 'customFunction'");
        });

        it('should generate service with createBoilerplate flag', () => {
            const schema = {
                contractName: 'TestContract',
                controllerName: 'Test',
                fields: [{ propertyKey: 'id', protoType: 'string' }],
                services: [
                    {
                        name: 'boilerplate',
                        path: '/boilerplate',
                        method: 'GET',
                        createBoilerplate: false,
                    },
                ],
            };

            vi.mocked(fs.existsSync).mockReturnValue(true);

            compile.compileSchema(schema, '/output/test.ts');

            const writtenCode = vi.mocked(fs.writeFileSync).mock
                .calls[0][1] as string;
            expect(writtenCode).toContain('createBoilerplate: false');
        });
    });

    describe('generateContractDecorator with indexes and cache', () => {
        it('should generate contract with indexes', () => {
            const schema = {
                contractName: 'TestContract',
                controllerName: 'Test',
                fields: [{ propertyKey: 'id', protoType: 'string' }],
                indexs: [
                    { name: 'idx_email', fields: ['email'] },
                    {
                        name: 'idx_name_age',
                        fields: [{ name: 'name' }, { name: 'age' }],
                    },
                ],
            };

            vi.mocked(fs.existsSync).mockReturnValue(true);

            compile.compileSchema(schema, '/output/test.ts');

            const writtenCode = vi.mocked(fs.writeFileSync).mock
                .calls[0][1] as string;
            expect(writtenCode).toContain("name: 'idx_email'");
            expect(writtenCode).toContain("'email'");
            expect(writtenCode).toContain("name: 'idx_name_age'");
        });

        it('should generate contract with cache configuration', () => {
            const schema = {
                contractName: 'TestContract',
                controllerName: 'Test',
                fields: [{ propertyKey: 'id', protoType: 'string' }],
                cache: {
                    key: 'test-cache',
                    ttl: 7200,
                    compress: false,
                },
            };

            vi.mocked(fs.existsSync).mockReturnValue(true);

            compile.compileSchema(schema, '/output/test.ts');

            const writtenCode = vi.mocked(fs.writeFileSync).mock
                .calls[0][1] as string;
            expect(writtenCode).toContain('cache: {');
            expect(writtenCode).toContain('key: "test-cache"');
            expect(writtenCode).toContain('ttl: 7200');
            expect(writtenCode).toContain('compress: false');
        });

        it('should generate contract with options', () => {
            const schema = {
                contractName: 'TestContract',
                controllerName: 'Test',
                fields: [{ propertyKey: 'id', protoType: 'string' }],
                options: {
                    tags: ['tag1', 'tag2'],
                    moduleContract: true,
                    databaseSchemaName: 'public',
                    databaseTimestamps: true,
                    databaseUserAction: true,
                    databaseFakeDelete: true,
                    description: 'Test contract',
                },
            };

            vi.mocked(fs.existsSync).mockReturnValue(true);

            compile.compileSchema(schema, '/output/test.ts');

            const writtenCode = vi.mocked(fs.writeFileSync).mock
                .calls[0][1] as string;
            expect(writtenCode).toContain('options: {');
            expect(writtenCode).toContain("tags: ['tag1', 'tag2']");
            expect(writtenCode).toContain('moduleContract: true');
            expect(writtenCode).toContain("databaseSchemaName: 'public'");
            expect(writtenCode).toContain('databaseTimestamps: true');
            expect(writtenCode).toContain('databaseUserAction: true');
            expect(writtenCode).toContain('databaseFakeDelete: true');
            expect(writtenCode).toContain("description: 'Test contract'");
        });

        it('should generate contract with single tag as string', () => {
            const schema = {
                contractName: 'TestContract',
                controllerName: 'Test',
                fields: [{ propertyKey: 'id', protoType: 'string' }],
                options: {
                    tags: 'single-tag',
                },
            };

            vi.mocked(fs.existsSync).mockReturnValue(true);

            compile.compileSchema(schema, '/output/test.ts');

            const writtenCode = vi.mocked(fs.writeFileSync).mock
                .calls[0][1] as string;
            expect(writtenCode).toContain("tags: ['single-tag']");
        });
    });

    describe('getContractClassName', () => {
        it('should return name as is if it ends with Contract', () => {
            const schema = {
                contractName: 'UserContract',
                controllerName: 'User',
                fields: [{ propertyKey: 'id', protoType: 'string' }],
            };

            vi.mocked(fs.existsSync).mockReturnValue(true);

            compile.compileSchema(schema, '/output/test.ts');

            const writtenCode = vi.mocked(fs.writeFileSync).mock
                .calls[0][1] as string;
            expect(writtenCode).toContain('export class UserContract');
        });

        it('should append Contract if name does not end with Contract', () => {
            const schema = {
                contractName: 'User',
                controllerName: 'User',
                fields: [{ propertyKey: 'id', protoType: 'string' }],
            };

            vi.mocked(fs.existsSync).mockReturnValue(true);

            compile.compileSchema(schema, '/output/test.ts');

            const writtenCode = vi.mocked(fs.writeFileSync).mock
                .calls[0][1] as string;
            expect(writtenCode).toContain('export class UserContract');
        });
    });
});
