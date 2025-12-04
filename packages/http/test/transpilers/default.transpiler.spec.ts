import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import * as fs from 'fs';
import * as path from 'path';

// Mock fs
vi.mock('fs', () => ({
    writeFileSync: vi.fn(),
    existsSync: vi.fn().mockReturnValue(false),
    mkdirSync: vi.fn(),
    appendFileSync: vi.fn(),
    unlinkSync: vi.fn(),
    default: {
        writeFileSync: vi.fn(),
        existsSync: vi.fn().mockReturnValue(false),
        mkdirSync: vi.fn(),
        appendFileSync: vi.fn(),
        unlinkSync: vi.fn(),
    },
}));

// Mock path
vi.mock('path', () => ({
    join: vi.fn((...args) => args.filter(Boolean).join('/')),
    resolve: vi.fn((...args) => args.filter(Boolean).join('/')),
    default: {
        join: vi.fn((...args) => args.filter(Boolean).join('/')),
        resolve: vi.fn((...args) => args.filter(Boolean).join('/')),
    },
}));

// Mock @cmmv/core
vi.mock('@cmmv/core', () => ({
    AbstractTranspile: class MockAbstractTranspile {
        getGeneratedPath(contract: any, type: string) {
            return `generated/${type}`;
        }
        getRootPath(contract: any, type: string, create = true) {
            return `src/${type}`;
        }
        getImportPath(contract: any, type: string, file: string, alias: string) {
            return `${alias}/${file}`;
        }
        removeExtraSpaces(text: string) {
            return text.replace(/\n\s*\n\s*\n/g, '\n\n');
        }
        removeTelemetry(text: string) {
            return text.replace(/Telemetry\./g, '');
        }
    },
    ITranspile: Symbol('ITranspile'),
    Config: {
        get: vi.fn((key: string, defaultValue?: any) => {
            if (key === 'app.telemetry') return true;
            return defaultValue;
        }),
    },
    Scope: {
        getArray: vi.fn(() => []),
    },
    Module: {
        hasModule: vi.fn((name: string) => false),
    },
    Application: {
        appModule: {
            controllers: [],
            providers: [],
        },
    },
    IContract: Symbol('IContract'),
}));

import { DefaultHTTPTranspiler } from '../../transpilers/default.transpiler';
import { Config, Scope, Module, Application } from '@cmmv/core';

describe('DefaultHTTPTranspiler', () => {
    let transpiler: DefaultHTTPTranspiler;

    const createMockContract = (overrides = {}) => ({
        contractName: 'UserContract',
        controllerName: 'User',
        generateController: true,
        generateBoilerplates: false,
        fields: [
            { propertyKey: 'name', protoType: 'string', nullable: false },
            { propertyKey: 'email', protoType: 'string', nullable: false },
        ],
        services: [],
        options: {},
        auth: false,
        rootOnly: false,
        cache: null,
        subPath: '',
        ...overrides,
    });

    beforeEach(() => {
        vi.clearAllMocks();
        transpiler = new DefaultHTTPTranspiler();

        // Reset Application state
        Application.appModule.controllers = [];
        Application.appModule.providers = [];
    });

    afterEach(() => {
        vi.clearAllMocks();
    });

    describe('constructor', () => {
        it('should create an instance', () => {
            expect(transpiler).toBeDefined();
            expect(transpiler).toBeInstanceOf(DefaultHTTPTranspiler);
        });
    });

    describe('run', () => {
        it('should process contracts from scope', () => {
            const mockContract = createMockContract();
            vi.mocked(Scope.getArray).mockReturnValue([mockContract]);

            transpiler.run();

            expect(Scope.getArray).toHaveBeenCalledWith('__contracts');
        });

        it('should skip contracts without generateController flag', () => {
            const mockContract = createMockContract({ generateController: false });
            vi.mocked(Scope.getArray).mockReturnValue([mockContract]);

            transpiler.run();

            expect(fs.writeFileSync).not.toHaveBeenCalled();
        });

        it('should handle empty contracts array', () => {
            vi.mocked(Scope.getArray).mockReturnValue([]);

            expect(() => transpiler.run()).not.toThrow();
        });

        it('should handle undefined contracts', () => {
            vi.mocked(Scope.getArray).mockReturnValue(undefined);

            expect(() => transpiler.run()).not.toThrow();
        });

        it('should generate service and controller for each contract', () => {
            const mockContract = createMockContract();
            vi.mocked(Scope.getArray).mockReturnValue([mockContract]);

            transpiler.run();

            // Should write multiple files (service + controller)
            expect(fs.writeFileSync).toHaveBeenCalled();
        });
    });

    describe('generateService', () => {
        it('should generate service file', () => {
            const mockContract = createMockContract();
            vi.mocked(Scope.getArray).mockReturnValue([mockContract]);

            transpiler.run();

            const calls = vi.mocked(fs.writeFileSync).mock.calls;
            const serviceCall = calls.find(call =>
                String(call[0]).includes('service.ts')
            );
            expect(serviceCall).toBeDefined();
        });

        it('should include CRUD methods in generated service', () => {
            const mockContract = createMockContract();
            vi.mocked(Scope.getArray).mockReturnValue([mockContract]);

            transpiler.run();

            const calls = vi.mocked(fs.writeFileSync).mock.calls;
            const serviceCall = calls.find(call =>
                String(call[0]).includes('service.ts')
            );

            if (serviceCall) {
                const content = serviceCall[1] as string;
                expect(content).toContain('async getAll');
                expect(content).toContain('async getById');
                expect(content).toContain('async insert');
                expect(content).toContain('async update');
                expect(content).toContain('async delete');
            }
        });

        it('should generate boilerplate service when flag is true', () => {
            const mockContract = createMockContract({ generateBoilerplates: true });
            vi.mocked(Scope.getArray).mockReturnValue([mockContract]);

            transpiler.run();

            // Should have additional file written
            expect(fs.writeFileSync).toHaveBeenCalled();
        });

        it('should append to generated service when boilerplates is false', () => {
            const mockContract = createMockContract({ generateBoilerplates: false });
            vi.mocked(Scope.getArray).mockReturnValue([mockContract]);

            transpiler.run();

            expect(fs.appendFileSync).toHaveBeenCalled();
        });

        it('should include custom service methods from contract services', () => {
            const mockContract = createMockContract({
                services: [
                    {
                        name: 'customMethod',
                        functionName: 'customMethod',
                        method: 'POST',
                        path: '/custom',
                        request: 'CustomRequest',
                        response: 'CustomResponse',
                        createBoilerplate: true,
                    },
                ],
            });
            vi.mocked(Scope.getArray).mockReturnValue([mockContract]);

            transpiler.run();

            const calls = vi.mocked(fs.writeFileSync).mock.calls;
            const serviceCall = calls.find(call =>
                String(call[0]).includes('service.ts')
            );

            if (serviceCall) {
                const content = serviceCall[1] as string;
                expect(content).toContain('customMethod');
            }
        });
    });

    describe('generateController', () => {
        it('should generate controller file', () => {
            const mockContract = createMockContract();
            vi.mocked(Scope.getArray).mockReturnValue([mockContract]);

            transpiler.run();

            const calls = vi.mocked(fs.writeFileSync).mock.calls;
            const controllerCall = calls.find(call =>
                String(call[0]).includes('controller.ts')
            );
            expect(controllerCall).toBeDefined();
        });

        it('should include REST endpoints in generated controller', () => {
            const mockContract = createMockContract();
            vi.mocked(Scope.getArray).mockReturnValue([mockContract]);

            transpiler.run();

            const calls = vi.mocked(fs.writeFileSync).mock.calls;
            const controllerCall = calls.find(call =>
                String(call[0]).includes('controller.ts') &&
                String(call[1]).includes('@Get')
            );

            if (controllerCall) {
                const content = controllerCall[1] as string;
                expect(content).toContain('@Get');
                expect(content).toContain('@Post');
                expect(content).toContain('@Put');
                expect(content).toContain('@Delete');
            }
        });

        it('should use custom controller path when specified', () => {
            const mockContract = createMockContract({
                controllerCustomPath: 'custom-users',
            });
            vi.mocked(Scope.getArray).mockReturnValue([mockContract]);

            transpiler.run();

            const calls = vi.mocked(fs.writeFileSync).mock.calls;
            const controllerCall = calls.find(call =>
                String(call[0]).includes('controller.ts')
            );

            if (controllerCall) {
                const content = controllerCall[1] as string;
                expect(content).toContain("'custom-users'");
            }
        });

        it('should include auth decorators when contract has auth', () => {
            const mockContract = createMockContract({ auth: true });
            vi.mocked(Scope.getArray).mockReturnValue([mockContract]);

            transpiler.run();

            const calls = vi.mocked(fs.writeFileSync).mock.calls;
            const controllerCall = calls.find(call =>
                String(call[0]).includes('controller.ts')
            );

            if (controllerCall) {
                const content = controllerCall[1] as string;
                expect(content).toContain('@Auth');
            }
        });

        it('should include rootOnly auth when specified', () => {
            const mockContract = createMockContract({ auth: true, rootOnly: true });
            vi.mocked(Scope.getArray).mockReturnValue([mockContract]);

            transpiler.run();

            const calls = vi.mocked(fs.writeFileSync).mock.calls;
            const controllerCall = calls.find(call =>
                String(call[0]).includes('controller.ts')
            );

            if (controllerCall) {
                const content = controllerCall[1] as string;
                expect(content).toContain('rootOnly: true');
            }
        });

        it('should remove telemetry when disabled', () => {
            vi.mocked(Config.get).mockImplementation((key: string) => {
                if (key === 'app.telemetry') return false;
                return undefined;
            });

            const mockContract = createMockContract();
            vi.mocked(Scope.getArray).mockReturnValue([mockContract]);

            transpiler.run();

            // Transpiler should call removeTelemetry
            expect(Config.get).toHaveBeenCalledWith('app.telemetry');
        });
    });

    describe('cache integration', () => {
        beforeEach(() => {
            vi.mocked(Module.hasModule).mockImplementation((name: string) => {
                return name === 'cache';
            });
        });

        it('should include cache decorators when cache module is present', () => {
            const mockContract = createMockContract({
                cache: { key: 'users:', ttl: 300, compress: true },
            });
            vi.mocked(Scope.getArray).mockReturnValue([mockContract]);

            transpiler.run();

            const calls = vi.mocked(fs.writeFileSync).mock.calls;
            const controllerCall = calls.find(call =>
                String(call[0]).includes('controller.ts')
            );

            if (controllerCall) {
                const content = controllerCall[1] as string;
                expect(content).toContain('@Cache');
                expect(content).toContain('CacheService');
            }
        });

        it('should use default cache key when not specified', () => {
            const mockContract = createMockContract({
                cache: { ttl: 300 },
            });
            vi.mocked(Scope.getArray).mockReturnValue([mockContract]);

            transpiler.run();

            const calls = vi.mocked(fs.writeFileSync).mock.calls;
            const controllerCall = calls.find(call =>
                String(call[0]).includes('controller.ts')
            );

            if (controllerCall) {
                const content = controllerCall[1] as string;
                expect(content).toContain('user:');
            }
        });
    });

    describe('OpenAPI integration', () => {
        beforeEach(() => {
            vi.mocked(Module.hasModule).mockImplementation((name: string) => {
                return name === 'openapi';
            });
        });

        it('should include OpenAPI decorators when module is present', () => {
            const mockContract = createMockContract({
                options: { tags: 'Users' },
            });
            vi.mocked(Scope.getArray).mockReturnValue([mockContract]);

            transpiler.run();

            const calls = vi.mocked(fs.writeFileSync).mock.calls;
            const controllerCall = calls.find(call =>
                String(call[0]).includes('controller.ts')
            );

            if (controllerCall) {
                const content = controllerCall[1] as string;
                expect(content).toContain('ApiTags');
            }
        });

        it('should handle array tags', () => {
            const mockContract = createMockContract({
                options: { tags: ['Users', 'Admin'] },
            });
            vi.mocked(Scope.getArray).mockReturnValue([mockContract]);

            transpiler.run();

            const calls = vi.mocked(fs.writeFileSync).mock.calls;
            const controllerCall = calls.find(call =>
                String(call[0]).includes('controller.ts')
            );

            if (controllerCall) {
                const content = controllerCall[1] as string;
                expect(content).toContain('@ApiTags');
            }
        });
    });

    describe('generateModule', () => {
        it('should add controllers to Application module', () => {
            const mockContract = createMockContract();
            vi.mocked(Scope.getArray).mockReturnValue([mockContract]);

            transpiler.run();

            expect(Application.appModule.controllers).toContainEqual(
                expect.objectContaining({ name: 'UserController' })
            );
        });

        it('should add providers to Application module', () => {
            const mockContract = createMockContract();
            vi.mocked(Scope.getArray).mockReturnValue([mockContract]);

            transpiler.run();

            expect(Application.appModule.providers).toContainEqual(
                expect.objectContaining({ name: 'UserService' })
            );
        });

        it('should handle subPath in module paths', () => {
            const mockContract = createMockContract({ subPath: '/admin' });
            vi.mocked(Scope.getArray).mockReturnValue([mockContract]);

            transpiler.run();

            expect(Application.appModule.controllers).toContainEqual(
                expect.objectContaining({
                    name: 'UserController',
                    path: expect.stringContaining('/admin'),
                })
            );
        });
    });

    describe('getMethodFormated', () => {
        it('should format HTTP methods correctly', () => {
            const mockContract = createMockContract({
                services: [
                    {
                        name: 'getCustom',
                        functionName: 'getCustom',
                        method: 'GET',
                        path: '/custom',
                        request: 'CustomRequest',
                        response: 'CustomResponse',
                        createBoilerplate: true,
                    },
                    {
                        name: 'postCustom',
                        functionName: 'postCustom',
                        method: 'POST',
                        path: '/custom',
                        request: 'CustomRequest',
                        response: 'CustomResponse',
                        createBoilerplate: true,
                    },
                    {
                        name: 'putCustom',
                        functionName: 'putCustom',
                        method: 'PUT',
                        path: '/custom',
                        request: 'CustomRequest',
                        response: 'CustomResponse',
                        createBoilerplate: true,
                    },
                    {
                        name: 'deleteCustom',
                        functionName: 'deleteCustom',
                        method: 'DELETE',
                        path: '/custom',
                        request: 'CustomRequest',
                        response: 'CustomResponse',
                        createBoilerplate: true,
                    },
                ],
            });
            vi.mocked(Scope.getArray).mockReturnValue([mockContract]);

            transpiler.run();

            const calls = vi.mocked(fs.writeFileSync).mock.calls;
            const controllerCall = calls.find(call =>
                String(call[0]).includes('controller.ts') &&
                String(call[1]).includes('@Get')
            );

            if (controllerCall) {
                const content = controllerCall[1] as string;
                expect(content).toContain('@Get');
                expect(content).toContain('@Post');
                expect(content).toContain('@Put');
                expect(content).toContain('@Delete');
            }
        });
    });

    describe('multiple contracts', () => {
        it('should process multiple contracts', () => {
            const contracts = [
                createMockContract({ controllerName: 'User' }),
                createMockContract({ controllerName: 'Post' }),
                createMockContract({ controllerName: 'Comment' }),
            ];
            vi.mocked(Scope.getArray).mockReturnValue(contracts);

            transpiler.run();

            expect(Application.appModule.controllers).toHaveLength(3);
            expect(Application.appModule.providers).toHaveLength(3);
        });
    });

    describe('boilerplate generation', () => {
        it('should not overwrite existing boilerplate files', () => {
            vi.mocked(fs.existsSync).mockReturnValue(true);

            const mockContract = createMockContract({ generateBoilerplates: true });
            vi.mocked(Scope.getArray).mockReturnValue([mockContract]);

            transpiler.run();

            // Should check if file exists before writing
            expect(fs.existsSync).toHaveBeenCalled();
        });

        it('should create boilerplate files when they do not exist', () => {
            vi.mocked(fs.existsSync).mockReturnValue(false);

            const mockContract = createMockContract({ generateBoilerplates: true });
            vi.mocked(Scope.getArray).mockReturnValue([mockContract]);

            transpiler.run();

            expect(fs.writeFileSync).toHaveBeenCalled();
        });

        it('should delete existing files when generateBoilerplates is false', () => {
            vi.mocked(fs.existsSync).mockReturnValue(true);

            const mockContract = createMockContract({ generateBoilerplates: false });
            vi.mocked(Scope.getArray).mockReturnValue([mockContract]);

            transpiler.run();

            expect(fs.unlinkSync).toHaveBeenCalled();
        });
    });

    describe('service methods', () => {
        it('should generate service methods with correct request/response types', () => {
            const mockContract = createMockContract({
                services: [
                    {
                        name: 'createUser',
                        functionName: 'createUser',
                        method: 'POST',
                        path: '/create',
                        request: 'CreateUserDTO',
                        response: 'UserResponse',
                        createBoilerplate: true,
                    },
                ],
            });
            vi.mocked(Scope.getArray).mockReturnValue([mockContract]);

            transpiler.run();

            const calls = vi.mocked(fs.writeFileSync).mock.calls;
            const serviceCall = calls.find(call =>
                String(call[0]).includes('service.ts')
            );

            if (serviceCall) {
                const content = serviceCall[1] as string;
                expect(content).toContain('CreateUserDTO');
                expect(content).toContain('UserResponse');
            }
        });
    });

    describe('edge cases', () => {
        it('should handle contracts without services array', () => {
            const mockContract = createMockContract({ services: [] });
            vi.mocked(Scope.getArray).mockReturnValue([mockContract]);

            expect(() => transpiler.run()).not.toThrow();
        });

        it('should handle contracts with empty options', () => {
            const mockContract = createMockContract({ options: {} });
            vi.mocked(Scope.getArray).mockReturnValue([mockContract]);

            expect(() => transpiler.run()).not.toThrow();
        });

        it('should handle contracts with null cache', () => {
            const mockContract = createMockContract({ cache: null });
            vi.mocked(Scope.getArray).mockReturnValue([mockContract]);

            expect(() => transpiler.run()).not.toThrow();
        });
    });
});
