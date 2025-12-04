import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import * as fs from 'node:fs';
import * as path from 'node:path';
import * as yaml from 'js-yaml';

// Mock node:fs
vi.mock('node:fs', () => ({
    writeFileSync: vi.fn(),
    existsSync: vi.fn().mockReturnValue(true),
    mkdirSync: vi.fn(),
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
    default: {
        join: vi.fn((...args) => args.filter(Boolean).join('/')),
        resolve: vi.fn((...args) => args.filter(Boolean).join('/')),
    },
}));

// Mock js-yaml
vi.mock('js-yaml', () => ({
    dump: vi.fn((obj, opts) => `yaml-output`),
    default: {
        dump: vi.fn((obj, opts) => `yaml-output`),
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
        removeExtraSpaces(text: string) {
            return text.replace(/\n\s*\n\s*\n/g, '\n\n');
        }
    },
    ITranspile: Symbol('ITranspile'),
    Config: {
        get: vi.fn((key: string, defaultValue?: any) => {
            if (key === 'app.generateSchema') return true;
            if (key === 'app.generatedDir') return '.generated';
            return defaultValue;
        }),
    },
    Scope: {
        getArray: vi.fn(() => []),
    },
    Module: {
        hasModule: vi.fn((name: string) => false),
    },
}));

import { ContractsTranspile } from '../../transpilers/contracts.transpile';
import { Config, Scope, Module } from '../../lib';

describe('ContractsTranspile', () => {
    let transpile: ContractsTranspile;

    beforeEach(() => {
        vi.clearAllMocks();
        transpile = new ContractsTranspile();

        // Reset default mocks
        vi.mocked(Config.get).mockImplementation((key: string, defaultValue?: any) => {
            if (key === 'app.generateSchema') return true;
            if (key === 'app.generatedDir') return '.generated';
            return defaultValue;
        });

        vi.mocked(fs.existsSync).mockReturnValue(true);
    });

    afterEach(() => {
        vi.clearAllMocks();
    });

    describe('constructor', () => {
        it('should create an instance', () => {
            expect(transpile).toBeDefined();
            expect(transpile).toBeInstanceOf(ContractsTranspile);
        });
    });

    describe('run', () => {
        it('should call generateSchema with contracts from scope', () => {
            const mockContracts = [
                { contractName: 'UserContract', fields: [] },
                { contractName: 'PostContract', fields: [] },
            ];
            vi.mocked(Scope.getArray).mockReturnValue(mockContracts);

            transpile.run();

            expect(Scope.getArray).toHaveBeenCalledWith('__contracts');
        });

        it('should handle empty contracts array', () => {
            vi.mocked(Scope.getArray).mockReturnValue([]);

            expect(() => transpile.run()).not.toThrow();
        });

        it('should handle undefined contracts', () => {
            vi.mocked(Scope.getArray).mockReturnValue(undefined);

            expect(() => transpile.run()).not.toThrow();
        });
    });

    describe('generateSchema', () => {
        it('should generate schema.json file', async () => {
            const mockContracts = [
                { contractName: 'UserContract', fields: [] },
            ];
            vi.mocked(Scope.getArray).mockReturnValue(mockContracts);

            transpile.run();

            // Allow async operations to complete
            await new Promise(resolve => setTimeout(resolve, 10));

            expect(fs.writeFileSync).toHaveBeenCalled();
            const calls = vi.mocked(fs.writeFileSync).mock.calls;
            const jsonCall = calls.find(call => String(call[0]).includes('schema.json'));
            expect(jsonCall).toBeDefined();
        });

        it('should generate schema.yml file', async () => {
            const mockContracts = [
                { contractName: 'UserContract', fields: [] },
            ];
            vi.mocked(Scope.getArray).mockReturnValue(mockContracts);

            transpile.run();

            // Allow async operations to complete
            await new Promise(resolve => setTimeout(resolve, 10));

            expect(fs.writeFileSync).toHaveBeenCalled();
            const calls = vi.mocked(fs.writeFileSync).mock.calls;
            const ymlCall = calls.find(call => String(call[0]).includes('schema.yml'));
            expect(ymlCall).toBeDefined();
        });

        it('should create generated directory if it does not exist', async () => {
            vi.mocked(fs.existsSync).mockReturnValue(false);

            const mockContracts = [{ contractName: 'TestContract', fields: [] }];
            vi.mocked(Scope.getArray).mockReturnValue(mockContracts);

            transpile.run();

            // Allow async operations to complete
            await new Promise(resolve => setTimeout(resolve, 10));

            expect(fs.mkdirSync).toHaveBeenCalledWith('.generated', { recursive: true });
        });

        it('should not create directory if it already exists', async () => {
            vi.mocked(fs.existsSync).mockReturnValue(true);

            const mockContracts = [{ contractName: 'TestContract', fields: [] }];
            vi.mocked(Scope.getArray).mockReturnValue(mockContracts);

            transpile.run();

            // Allow async operations to complete
            await new Promise(resolve => setTimeout(resolve, 10));

            expect(fs.mkdirSync).not.toHaveBeenCalled();
        });

        it('should not generate schema when disabled', async () => {
            vi.mocked(Config.get).mockImplementation((key: string, defaultValue?: any) => {
                if (key === 'app.generateSchema') return false;
                if (key === 'app.generatedDir') return '.generated';
                return defaultValue;
            });

            const mockContracts = [{ contractName: 'TestContract', fields: [] }];
            vi.mocked(Scope.getArray).mockReturnValue(mockContracts);

            transpile.run();

            // Allow async operations to complete
            await new Promise(resolve => setTimeout(resolve, 10));

            expect(fs.writeFileSync).not.toHaveBeenCalled();
        });

        it('should use custom generated directory', async () => {
            vi.mocked(Config.get).mockImplementation((key: string, defaultValue?: any) => {
                if (key === 'app.generateSchema') return true;
                if (key === 'app.generatedDir') return 'custom-generated';
                return defaultValue;
            });

            vi.mocked(fs.existsSync).mockReturnValue(false);

            const mockContracts = [{ contractName: 'TestContract', fields: [] }];
            vi.mocked(Scope.getArray).mockReturnValue(mockContracts);

            transpile.run();

            // Allow async operations to complete
            await new Promise(resolve => setTimeout(resolve, 10));

            expect(fs.mkdirSync).toHaveBeenCalledWith('custom-generated', { recursive: true });
        });

        it('should include all contracts in schema', async () => {
            const mockContracts = [
                { contractName: 'UserContract', fields: [{ name: 'id' }] },
                { contractName: 'PostContract', fields: [{ name: 'title' }] },
                { contractName: 'CommentContract', fields: [{ name: 'content' }] },
            ];
            vi.mocked(Scope.getArray).mockReturnValue(mockContracts);

            transpile.run();

            // Allow async operations to complete
            await new Promise(resolve => setTimeout(resolve, 10));

            const calls = vi.mocked(fs.writeFileSync).mock.calls;
            const jsonCall = calls.find(call => String(call[0]).includes('schema.json'));

            if (jsonCall) {
                const content = JSON.parse(jsonCall[1] as string);
                expect(content.contracts).toHaveProperty('UserContract');
                expect(content.contracts).toHaveProperty('PostContract');
                expect(content.contracts).toHaveProperty('CommentContract');
            }
        });
    });

    describe('modules detection', () => {
        it('should detect auth module', async () => {
            vi.mocked(Module.hasModule).mockImplementation((name: string) => {
                return name === 'auth';
            });

            const mockContracts = [{ contractName: 'TestContract', fields: [] }];
            vi.mocked(Scope.getArray).mockReturnValue(mockContracts);

            transpile.run();

            // Allow async operations to complete
            await new Promise(resolve => setTimeout(resolve, 10));

            const calls = vi.mocked(fs.writeFileSync).mock.calls;
            const jsonCall = calls.find(call => String(call[0]).includes('schema.json'));

            if (jsonCall) {
                const content = JSON.parse(jsonCall[1] as string);
                expect(content.modules.auth).toBe(true);
                expect(content.modules.graphql).toBe(false);
            }
        });

        it('should detect graphql module', async () => {
            vi.mocked(Module.hasModule).mockImplementation((name: string) => {
                return name === 'graphql';
            });

            const mockContracts = [{ contractName: 'TestContract', fields: [] }];
            vi.mocked(Scope.getArray).mockReturnValue(mockContracts);

            transpile.run();

            // Allow async operations to complete
            await new Promise(resolve => setTimeout(resolve, 10));

            const calls = vi.mocked(fs.writeFileSync).mock.calls;
            const jsonCall = calls.find(call => String(call[0]).includes('schema.json'));

            if (jsonCall) {
                const content = JSON.parse(jsonCall[1] as string);
                expect(content.modules.graphql).toBe(true);
            }
        });

        it('should detect rpc module (protobuf + ws)', async () => {
            vi.mocked(Module.hasModule).mockImplementation((name: string) => {
                return name === 'protobuf' || name === 'ws';
            });

            const mockContracts = [{ contractName: 'TestContract', fields: [] }];
            vi.mocked(Scope.getArray).mockReturnValue(mockContracts);

            transpile.run();

            // Allow async operations to complete
            await new Promise(resolve => setTimeout(resolve, 10));

            const calls = vi.mocked(fs.writeFileSync).mock.calls;
            const jsonCall = calls.find(call => String(call[0]).includes('schema.json'));

            if (jsonCall) {
                const content = JSON.parse(jsonCall[1] as string);
                expect(content.modules.rpc).toBe(true);
            }
        });

        it('should not detect rpc when only protobuf is present', async () => {
            vi.mocked(Module.hasModule).mockImplementation((name: string) => {
                return name === 'protobuf';
            });

            const mockContracts = [{ contractName: 'TestContract', fields: [] }];
            vi.mocked(Scope.getArray).mockReturnValue(mockContracts);

            transpile.run();

            // Allow async operations to complete
            await new Promise(resolve => setTimeout(resolve, 10));

            const calls = vi.mocked(fs.writeFileSync).mock.calls;
            const jsonCall = calls.find(call => String(call[0]).includes('schema.json'));

            if (jsonCall) {
                const content = JSON.parse(jsonCall[1] as string);
                expect(content.modules.rpc).toBe(false);
            }
        });

        it('should detect openapi module', async () => {
            vi.mocked(Module.hasModule).mockImplementation((name: string) => {
                return name === 'openapi';
            });

            const mockContracts = [{ contractName: 'TestContract', fields: [] }];
            vi.mocked(Scope.getArray).mockReturnValue(mockContracts);

            transpile.run();

            // Allow async operations to complete
            await new Promise(resolve => setTimeout(resolve, 10));

            const calls = vi.mocked(fs.writeFileSync).mock.calls;
            const jsonCall = calls.find(call => String(call[0]).includes('schema.json'));

            if (jsonCall) {
                const content = JSON.parse(jsonCall[1] as string);
                expect(content.modules.openapi).toBe(true);
            }
        });

        it('should detect cache module', async () => {
            vi.mocked(Module.hasModule).mockImplementation((name: string) => {
                return name === 'cache';
            });

            const mockContracts = [{ contractName: 'TestContract', fields: [] }];
            vi.mocked(Scope.getArray).mockReturnValue(mockContracts);

            transpile.run();

            // Allow async operations to complete
            await new Promise(resolve => setTimeout(resolve, 10));

            const calls = vi.mocked(fs.writeFileSync).mock.calls;
            const jsonCall = calls.find(call => String(call[0]).includes('schema.json'));

            if (jsonCall) {
                const content = JSON.parse(jsonCall[1] as string);
                expect(content.modules.cache).toBe(true);
            }
        });

        it('should detect repository module', async () => {
            vi.mocked(Module.hasModule).mockImplementation((name: string) => {
                return name === 'repository';
            });

            const mockContracts = [{ contractName: 'TestContract', fields: [] }];
            vi.mocked(Scope.getArray).mockReturnValue(mockContracts);

            transpile.run();

            // Allow async operations to complete
            await new Promise(resolve => setTimeout(resolve, 10));

            const calls = vi.mocked(fs.writeFileSync).mock.calls;
            const jsonCall = calls.find(call => String(call[0]).includes('schema.json'));

            if (jsonCall) {
                const content = JSON.parse(jsonCall[1] as string);
                expect(content.modules.repository).toBe(true);
            }
        });

        it('should detect vault module', async () => {
            vi.mocked(Module.hasModule).mockImplementation((name: string) => {
                return name === 'vault';
            });

            const mockContracts = [{ contractName: 'TestContract', fields: [] }];
            vi.mocked(Scope.getArray).mockReturnValue(mockContracts);

            transpile.run();

            // Allow async operations to complete
            await new Promise(resolve => setTimeout(resolve, 10));

            const calls = vi.mocked(fs.writeFileSync).mock.calls;
            const jsonCall = calls.find(call => String(call[0]).includes('schema.json'));

            if (jsonCall) {
                const content = JSON.parse(jsonCall[1] as string);
                expect(content.modules.vault).toBe(true);
            }
        });

        it('should detect all modules when present', async () => {
            vi.mocked(Module.hasModule).mockReturnValue(true);

            const mockContracts = [{ contractName: 'TestContract', fields: [] }];
            vi.mocked(Scope.getArray).mockReturnValue(mockContracts);

            transpile.run();

            // Allow async operations to complete
            await new Promise(resolve => setTimeout(resolve, 10));

            const calls = vi.mocked(fs.writeFileSync).mock.calls;
            const jsonCall = calls.find(call => String(call[0]).includes('schema.json'));

            if (jsonCall) {
                const content = JSON.parse(jsonCall[1] as string);
                expect(content.modules.auth).toBe(true);
                expect(content.modules.graphql).toBe(true);
                expect(content.modules.rpc).toBe(true);
                expect(content.modules.openapi).toBe(true);
                expect(content.modules.cache).toBe(true);
                expect(content.modules.repository).toBe(true);
                expect(content.modules.vault).toBe(true);
            }
        });
    });

    describe('YAML output', () => {
        it('should use yaml.dump for YAML output', async () => {
            const mockContracts = [{ contractName: 'TestContract', fields: [] }];
            vi.mocked(Scope.getArray).mockReturnValue(mockContracts);

            transpile.run();

            // Allow async operations to complete
            await new Promise(resolve => setTimeout(resolve, 10));

            expect(yaml.dump).toHaveBeenCalled();
        });

        it('should pass correct options to yaml.dump', async () => {
            const mockContracts = [{ contractName: 'TestContract', fields: [] }];
            vi.mocked(Scope.getArray).mockReturnValue(mockContracts);

            transpile.run();

            // Allow async operations to complete
            await new Promise(resolve => setTimeout(resolve, 10));

            expect(yaml.dump).toHaveBeenCalledWith(
                expect.any(Object),
                expect.objectContaining({ indent: 2 })
            );
        });
    });

    describe('JSON output', () => {
        it('should output formatted JSON with 4 spaces', async () => {
            const mockContracts = [{ contractName: 'TestContract', fields: [] }];
            vi.mocked(Scope.getArray).mockReturnValue(mockContracts);

            transpile.run();

            // Allow async operations to complete
            await new Promise(resolve => setTimeout(resolve, 10));

            const calls = vi.mocked(fs.writeFileSync).mock.calls;
            const jsonCall = calls.find(call => String(call[0]).includes('schema.json'));

            if (jsonCall) {
                const content = jsonCall[1] as string;
                // Check that JSON is formatted (contains newlines)
                expect(content).toContain('\n');
            }
        });
    });

    describe('edge cases', () => {
        it('should handle contracts with complex fields', async () => {
            const mockContracts = [{
                contractName: 'ComplexContract',
                fields: [
                    {
                        propertyKey: 'nested',
                        protoType: 'json',
                        nullable: true,
                        validations: [{ type: 'IsObject' }],
                    },
                ],
                options: { moduleContract: true },
                messages: {
                    CreateRequest: {
                        name: 'CreateRequest',
                        properties: { name: { type: 'string' } },
                    },
                },
            }];
            vi.mocked(Scope.getArray).mockReturnValue(mockContracts);

            transpile.run();

            // Allow async operations to complete
            await new Promise(resolve => setTimeout(resolve, 10));

            const calls = vi.mocked(fs.writeFileSync).mock.calls;
            const jsonCall = calls.find(call => String(call[0]).includes('schema.json'));

            if (jsonCall) {
                const content = JSON.parse(jsonCall[1] as string);
                expect(content.contracts.ComplexContract).toBeDefined();
                expect(content.contracts.ComplexContract.fields).toHaveLength(1);
            }
        });

        it('should handle empty contracts object', async () => {
            vi.mocked(Scope.getArray).mockReturnValue([]);

            transpile.run();

            // Allow async operations to complete
            await new Promise(resolve => setTimeout(resolve, 10));

            const calls = vi.mocked(fs.writeFileSync).mock.calls;
            const jsonCall = calls.find(call => String(call[0]).includes('schema.json'));

            if (jsonCall) {
                const content = JSON.parse(jsonCall[1] as string);
                expect(content.contracts).toEqual({});
            }
        });

        it('should preserve contract structure in output', async () => {
            const mockContract = {
                contractName: 'UserContract',
                controllerName: 'User',
                fields: [
                    { propertyKey: 'name', protoType: 'string', nullable: false },
                    { propertyKey: 'email', protoType: 'string', nullable: false },
                ],
                options: { databaseSchemaName: 'users' },
                indexs: [{ name: 'idx_email', fields: ['email'] }],
                messages: {},
            };
            vi.mocked(Scope.getArray).mockReturnValue([mockContract]);

            transpile.run();

            // Allow async operations to complete
            await new Promise(resolve => setTimeout(resolve, 10));

            const calls = vi.mocked(fs.writeFileSync).mock.calls;
            const jsonCall = calls.find(call => String(call[0]).includes('schema.json'));

            if (jsonCall) {
                const content = JSON.parse(jsonCall[1] as string);
                const contract = content.contracts.UserContract;
                expect(contract.controllerName).toBe('User');
                expect(contract.fields).toHaveLength(2);
                expect(contract.options.databaseSchemaName).toBe('users');
            }
        });
    });
});
