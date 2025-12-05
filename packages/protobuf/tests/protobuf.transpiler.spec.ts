import { describe, it, expect, beforeEach, vi, afterEach } from 'vitest';
import * as fs from 'node:fs';
import * as path from 'node:path';

vi.mock('node:fs', () => ({
    existsSync: vi.fn().mockReturnValue(true),
    mkdirSync: vi.fn(),
    writeFileSync: vi.fn(),
}));

vi.mock('uglify-js', () => ({
    minify: vi.fn().mockImplementation((code) => ({ code: code })),
}));

vi.mock('protobufjs', () => ({
    Root: vi.fn().mockImplementation(() => ({
        define: vi.fn().mockReturnThis(),
        add: vi.fn(),
        toJSON: vi.fn().mockReturnValue({ nested: {} }),
        nestedArray: [],
    })),
    Type: vi.fn().mockImplementation((name) => ({
        name,
        add: vi.fn().mockReturnThis(),
    })),
    Field: vi.fn().mockImplementation((name, id, type) => ({
        name,
        id,
        type,
    })),
    parse: vi.fn().mockReturnValue({
        root: {
            define: vi.fn().mockReturnThis(),
            add: vi.fn(),
        },
    }),
}));

vi.mock('@cmmv/core', async (importOriginal) => {
    const actual = await importOriginal();
    return {
        ...(actual as any),
        Logger: vi.fn().mockImplementation(() => ({
            log: vi.fn(),
            error: vi.fn(),
        })),
        Scope: {
            getArray: vi.fn().mockReturnValue([]),
        },
        CONTROLLER_NAME_METADATA: 'CONTROLLER_NAME_METADATA',
        AbstractTranspile: class {
            getGeneratedPath(contract: any, type: string) {
                return `.generated/${type}`;
            }
            getImportPathRelative() {
                return null;
            }
            removeExtraSpaces(content: string) {
                return content.trim();
            }
        },
    };
});

vi.mock('../lib/protobuf.registry', () => ({
    ProtoRegistry: {
        load: vi.fn().mockResolvedValue(undefined),
        retrieveAll: vi.fn().mockReturnValue({}),
        retrieve: vi.fn(),
        retrieveByIndex: vi.fn(),
        retrieveTypes: vi.fn(),
    },
}));

import { ProtobufTranspile } from '../lib/protobuf.transpiler';
import { Scope } from '@cmmv/core';
import { ProtoRegistry } from '../lib/protobuf.registry';

describe('ProtobufTranspile', () => {
    let transpiler: ProtobufTranspile;

    beforeEach(() => {
        vi.clearAllMocks();
        transpiler = new ProtobufTranspile();
    });

    describe('run', () => {
        it('should handle empty contracts array', async () => {
            vi.mocked(Scope.getArray).mockReturnValue([]);

            await transpiler.run();

            // Even with no contracts, generateContractsJs is called
            // which writes the contracts.min.js file
            expect(fs.writeFileSync).toHaveBeenCalled();
        });

        it('should generate proto files for contracts', async () => {
            const mockContract = {
                controllerName: 'User',
                fields: [
                    { propertyKey: 'name', protoType: 'string' },
                    { propertyKey: 'age', protoType: 'int32' },
                ],
            };
            vi.mocked(Scope.getArray).mockReturnValue([mockContract]);

            await transpiler.run();

            expect(fs.writeFileSync).toHaveBeenCalled();
        });

        it('should generate TypeScript types file', async () => {
            const mockContract = {
                controllerName: 'User',
                fields: [{ propertyKey: 'name', protoType: 'string' }],
            };
            vi.mocked(Scope.getArray).mockReturnValue([mockContract]);

            await transpiler.run();

            const calls = vi.mocked(fs.writeFileSync).mock.calls;
            expect(calls.some((call: any) => call[0].includes('.d.ts'))).toBe(
                true,
            );
        });

        it('should handle contracts with custom proto', async () => {
            const mockContract = {
                controllerName: 'Custom',
                fields: [],
                customProto: () => '// custom proto content',
            };
            vi.mocked(Scope.getArray).mockReturnValue([mockContract]);

            await transpiler.run();

            expect(fs.writeFileSync).toHaveBeenCalled();
        });

        it('should handle directMessage contracts', async () => {
            const mockContract = {
                controllerName: 'Direct',
                directMessage: true,
                fields: [],
            };
            vi.mocked(Scope.getArray).mockReturnValue([mockContract]);

            await transpiler.run();

            expect(fs.writeFileSync).toHaveBeenCalled();
        });

        it('should handle contracts with messages', async () => {
            const mockContract = {
                controllerName: 'WithMessages',
                fields: [],
                messages: {
                    CustomMessage: {
                        name: 'CustomMessage',
                        properties: {
                            field1: { type: 'string', required: true },
                        },
                    },
                },
            };
            vi.mocked(Scope.getArray).mockReturnValue([mockContract]);

            await transpiler.run();

            expect(fs.writeFileSync).toHaveBeenCalled();
        });

        it('should handle contracts with services', async () => {
            const mockContract = {
                controllerName: 'WithServices',
                fields: [],
                services: {
                    customRpc: {
                        name: 'CustomRpc',
                        request: 'CustomRequest',
                        response: 'CustomResponse',
                    },
                },
            };
            vi.mocked(Scope.getArray).mockReturnValue([mockContract]);

            await transpiler.run();

            expect(fs.writeFileSync).toHaveBeenCalled();
        });
    });

    describe('mapToProtoType', () => {
        it('should map TypeScript types to protobuf types', () => {
            const mapToProtoType = (transpiler as any).mapToProtoType.bind(
                transpiler,
            );

            expect(mapToProtoType('string')).toBe('string');
            expect(mapToProtoType('boolean')).toBe('bool');
            expect(mapToProtoType('bool')).toBe('bool');
            expect(mapToProtoType('int')).toBe('int32');
            expect(mapToProtoType('int32')).toBe('int32');
            expect(mapToProtoType('int64')).toBe('int64');
            expect(mapToProtoType('float')).toBe('float');
            expect(mapToProtoType('double')).toBe('double');
            expect(mapToProtoType('bytes')).toBe('bytes');
        });

        it('should map date types to string', () => {
            const mapToProtoType = (transpiler as any).mapToProtoType.bind(
                transpiler,
            );

            expect(mapToProtoType('date')).toBe('string');
            expect(mapToProtoType('timestamp')).toBe('string');
            expect(mapToProtoType('time')).toBe('string');
        });

        it('should map JSON types to string', () => {
            const mapToProtoType = (transpiler as any).mapToProtoType.bind(
                transpiler,
            );

            expect(mapToProtoType('json')).toBe('string');
            expect(mapToProtoType('jsonb')).toBe('string');
            expect(mapToProtoType('simpleJson')).toBe('string');
        });

        it('should map unsigned integer types', () => {
            const mapToProtoType = (transpiler as any).mapToProtoType.bind(
                transpiler,
            );

            expect(mapToProtoType('uint32')).toBe('uint32');
            expect(mapToProtoType('uint64')).toBe('uint64');
            expect(mapToProtoType('sint32')).toBe('sint32');
            expect(mapToProtoType('sint64')).toBe('sint64');
        });

        it('should map fixed types', () => {
            const mapToProtoType = (transpiler as any).mapToProtoType.bind(
                transpiler,
            );

            expect(mapToProtoType('fixed32')).toBe('fixed32');
            expect(mapToProtoType('fixed64')).toBe('fixed64');
            expect(mapToProtoType('sfixed32')).toBe('sfixed32');
            expect(mapToProtoType('sfixed64')).toBe('sfixed64');
        });

        it('should map any type to google.protobuf.Any', () => {
            const mapToProtoType = (transpiler as any).mapToProtoType.bind(
                transpiler,
            );

            expect(mapToProtoType('any')).toBe('google.protobuf.Any');
        });

        it('should default unknown types to string', () => {
            const mapToProtoType = (transpiler as any).mapToProtoType.bind(
                transpiler,
            );

            expect(mapToProtoType('unknown')).toBe('string');
        });
    });

    describe('mapToTsType', () => {
        it('should map protobuf types to TypeScript types', () => {
            const mapToTsType = (transpiler as any).mapToTsType.bind(
                transpiler,
            );

            expect(mapToTsType('string')).toBe('string');
            expect(mapToTsType('bool')).toBe('boolean');
            expect(mapToTsType('boolean')).toBe('boolean');
            expect(mapToTsType('int32')).toBe('number');
            expect(mapToTsType('int64')).toBe('number');
            expect(mapToTsType('float')).toBe('number');
            expect(mapToTsType('double')).toBe('number');
        });

        it('should map bytes to Uint8Array', () => {
            const mapToTsType = (transpiler as any).mapToTsType.bind(
                transpiler,
            );

            expect(mapToTsType('bytes')).toBe('Uint8Array');
        });

        it('should map bigint type', () => {
            const mapToTsType = (transpiler as any).mapToTsType.bind(
                transpiler,
            );

            expect(mapToTsType('bigint')).toBe('bigint');
        });

        it('should map json types to any', () => {
            const mapToTsType = (transpiler as any).mapToTsType.bind(
                transpiler,
            );

            expect(mapToTsType('json')).toBe('any');
            expect(mapToTsType('jsonb')).toBe('any');
            expect(mapToTsType('simpleJson')).toBe('any');
        });

        it('should map simpleArray to string[]', () => {
            const mapToTsType = (transpiler as any).mapToTsType.bind(
                transpiler,
            );

            expect(mapToTsType('simpleArray')).toBe('string[]');
        });

        it('should default unknown types to any', () => {
            const mapToTsType = (transpiler as any).mapToTsType.bind(
                transpiler,
            );

            expect(mapToTsType('unknown')).toBe('any');
        });
    });

    describe('clearImports and addImport', () => {
        it('should clear imports', () => {
            const clearImports = (transpiler as any).clearImports.bind(
                transpiler,
            );
            const addImport = (transpiler as any).addImport.bind(transpiler);

            addImport('import "test.proto";');
            clearImports();

            expect((transpiler as any).imports.size).toBe(0);
        });

        it('should add unique imports', () => {
            const clearImports = (transpiler as any).clearImports.bind(
                transpiler,
            );
            const addImport = (transpiler as any).addImport.bind(transpiler);

            clearImports();
            addImport('import "test.proto";');
            addImport('import "test.proto";');
            addImport('import "other.proto";');

            expect((transpiler as any).imports.size).toBe(2);
        });
    });

    describe('returnContractJs', () => {
        it('should return JSON string even when no contracts', async () => {
            vi.mocked(Scope.getArray).mockReturnValue([]);
            vi.mocked(ProtoRegistry.retrieveAll).mockReturnValue({});

            const result = await transpiler.returnContractJs();

            // The function returns a JSON string with empty index and contracts
            expect(typeof result).toBe('string');
            expect(result).toContain('index');
            expect(result).toContain('contracts');
        });

        it('should return contract JSON when contracts exist', async () => {
            const mockContract = {
                controllerName: 'Test',
                fields: [{ propertyKey: 'name', protoType: 'string' }],
            };
            vi.mocked(Scope.getArray).mockReturnValue([mockContract]);

            // Mock ProtoRegistry.retrieve to return a contract with toJSON method
            vi.mocked(ProtoRegistry.retrieve).mockReturnValue({
                toJSON: () => ({ nested: {} }),
                nestedArray: [],
            } as any);

            vi.mocked(ProtoRegistry.retrieveAll).mockReturnValue({
                test: { toJSON: () => ({ nested: {} }), nestedArray: [] },
            });

            const result = await transpiler.returnContractJs();

            expect(typeof result).toBe('string');
        });
    });
});

describe('Proto generation content', () => {
    let transpiler: ProtobufTranspile;

    beforeEach(() => {
        vi.clearAllMocks();
        transpiler = new ProtobufTranspile();
    });

    it('should include syntax proto3', async () => {
        const mockContract = {
            controllerName: 'Test',
            fields: [],
        };
        vi.mocked(Scope.getArray).mockReturnValue([mockContract]);

        let protoContent = '';
        vi.mocked(fs.writeFileSync).mockImplementation(
            (path: any, content: any) => {
                if (path.includes('.proto')) {
                    protoContent = content;
                }
            },
        );

        await transpiler.run();

        expect(protoContent).toContain('syntax = "proto3"');
    });

    it('should include package name when specified', async () => {
        const mockContract = {
            controllerName: 'Test',
            protoPackage: 'mypackage',
            fields: [],
        };
        vi.mocked(Scope.getArray).mockReturnValue([mockContract]);

        let protoContent = '';
        vi.mocked(fs.writeFileSync).mockImplementation(
            (path: any, content: any) => {
                if (path.includes('.proto')) {
                    protoContent = content;
                }
            },
        );

        await transpiler.run();

        expect(protoContent).toContain('package mypackage');
    });

    it('should include google.protobuf.Any import when any type is used', async () => {
        const mockContract = {
            controllerName: 'Test',
            fields: [{ propertyKey: 'data', protoType: 'any' }],
        };
        vi.mocked(Scope.getArray).mockReturnValue([mockContract]);

        let protoContent = '';
        vi.mocked(fs.writeFileSync).mockImplementation(
            (path: any, content: any) => {
                if (path.includes('.proto')) {
                    protoContent = content;
                }
            },
        );

        await transpiler.run();

        expect(protoContent).toContain('import "google/protobuf/any.proto"');
    });

    it('should generate CRUD service methods for non-direct messages', async () => {
        const mockContract = {
            controllerName: 'User',
            directMessage: false,
            fields: [{ propertyKey: 'name', protoType: 'string' }],
        };
        vi.mocked(Scope.getArray).mockReturnValue([mockContract]);

        let protoContent = '';
        vi.mocked(fs.writeFileSync).mockImplementation(
            (path: any, content: any) => {
                if (path.includes('.proto')) {
                    protoContent = content;
                }
            },
        );

        await transpiler.run();

        expect(protoContent).toContain('service UserService');
        expect(protoContent).toContain('rpc AddUser');
        expect(protoContent).toContain('rpc UpdateUser');
        expect(protoContent).toContain('rpc DeleteUser');
        expect(protoContent).toContain('rpc GetAllUser');
    });

    it('should generate list message for non-direct contracts', async () => {
        const mockContract = {
            controllerName: 'Item',
            directMessage: false,
            fields: [],
        };
        vi.mocked(Scope.getArray).mockReturnValue([mockContract]);

        let protoContent = '';
        vi.mocked(fs.writeFileSync).mockImplementation(
            (path: any, content: any) => {
                if (path.includes('.proto')) {
                    protoContent = content;
                }
            },
        );

        await transpiler.run();

        expect(protoContent).toContain('message ItemList');
        expect(protoContent).toContain('repeated Item items');
    });

    it('should handle repeated fields', async () => {
        const mockContract = {
            controllerName: 'Post',
            fields: [
                {
                    propertyKey: 'tags',
                    protoType: 'string',
                    protoRepeated: true,
                },
            ],
        };
        vi.mocked(Scope.getArray).mockReturnValue([mockContract]);

        let protoContent = '';
        vi.mocked(fs.writeFileSync).mockImplementation(
            (path: any, content: any) => {
                if (path.includes('.proto')) {
                    protoContent = content;
                }
            },
        );

        await transpiler.run();

        expect(protoContent).toContain('repeated string tags');
    });
});

describe('TypeScript generation content', () => {
    let transpiler: ProtobufTranspile;

    beforeEach(() => {
        vi.clearAllMocks();
        transpiler = new ProtobufTranspile();
    });

    it('should generate namespace with field types', async () => {
        const mockContract = {
            controllerName: 'User',
            fields: [
                { propertyKey: 'name', protoType: 'string' },
                { propertyKey: 'age', protoType: 'int32' },
            ],
        };
        vi.mocked(Scope.getArray).mockReturnValue([mockContract]);

        let tsContent = '';
        vi.mocked(fs.writeFileSync).mockImplementation(
            (path: any, content: any) => {
                if (path.includes('.d.ts')) {
                    tsContent = content;
                }
            },
        );

        await transpiler.run();

        expect(tsContent).toContain('export namespace User');
        expect(tsContent).toContain('export type name = string');
        expect(tsContent).toContain('export type age = number');
    });

    it('should generate CRUD interfaces for non-direct messages', async () => {
        const mockContract = {
            controllerName: 'Product',
            directMessage: false,
            fields: [],
        };
        vi.mocked(Scope.getArray).mockReturnValue([mockContract]);

        let tsContent = '';
        vi.mocked(fs.writeFileSync).mockImplementation(
            (path: any, content: any) => {
                if (path.includes('.d.ts')) {
                    tsContent = content;
                }
            },
        );

        await transpiler.run();

        expect(tsContent).toContain('export interface AddProductRequest');
        expect(tsContent).toContain('export interface AddProductResponse');
        expect(tsContent).toContain('export interface UpdateProductRequest');
        expect(tsContent).toContain('export interface UpdateProductResponse');
        expect(tsContent).toContain('export interface DeleteProductRequest');
        expect(tsContent).toContain('export interface DeleteProductResponse');
        expect(tsContent).toContain('export interface GetAllProductRequest');
        expect(tsContent).toContain('export interface GetAllProductResponse');
    });

    it('should include custom types when specified', async () => {
        const mockContract = {
            controllerName: 'Custom',
            fields: [],
            customTypes: () => 'export type CustomType = string;',
        };
        vi.mocked(Scope.getArray).mockReturnValue([mockContract]);

        let tsContent = '';
        vi.mocked(fs.writeFileSync).mockImplementation(
            (path: any, content: any) => {
                if (path.includes('.d.ts')) {
                    tsContent = content;
                }
            },
        );

        await transpiler.run();

        expect(tsContent).toContain('export type CustomType = string');
    });
});
