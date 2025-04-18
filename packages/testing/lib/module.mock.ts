import { vi } from 'vitest';

export interface MockIModuleOptions {
    devMode?: boolean;
    controllers?: Array<any>;
    providers?: Array<any>;
    transpilers?: Array<any>;
    submodules?: Array<any>;
    contracts?: Array<any>;
    configs?: Array<any>;
    entities?: Array<any>;
    models?: Array<any>;
    resolvers?: Array<any>;
}

export class MockModule {
    public static modules: Map<string, MockModule> = new Map();

    public devMode: boolean;
    public controllers: Array<any>;
    public transpilers: Array<any>;
    public submodules: Array<any>;
    public contractsCls: Array<any>;
    public contracts: Array<any>;
    public providers: Array<any>;
    public configs: Array<any>;
    public entities: Array<any>;
    public models: Array<any>;
    public resolvers: Array<any>;

    constructor(name: string, options: MockIModuleOptions = {}) {
        this.devMode = options.devMode || false;
        this.providers = options.providers || [];
        this.controllers = options.controllers || [];
        this.transpilers = options.transpilers || [];
        this.submodules = options.submodules || [];
        this.configs = options.configs || [];
        this.entities = options.entities || [];
        this.models = options.models || [];
        this.resolvers = options.resolvers || [];
        this.contractsCls = options.contracts || [];
        this.contracts =
            options.contracts?.map((contractClass) => {
                try {
                    return new contractClass();
                } catch {
                    return contractClass;
                }
            }) || [];

        MockModule.modules.set(name, this);
    }

    public static hasModule = vi
        .fn()
        .mockImplementation((name: string): boolean => {
            return MockModule.modules.has(name);
        });

    public static getModule = vi
        .fn()
        .mockImplementation((name: string): MockModule | null => {
            return MockModule.modules.has(name)
                ? MockModule.modules.get(name)
                : null;
        });

    public static loadTranspile = vi
        .fn()
        .mockImplementation(<T>(transpileRaw: any) => {
            try {
                const transpile = new transpileRaw();
                return transpile as T;
            } catch {
                return {} as T;
            }
        });

    public getControllers = vi.fn().mockImplementation((): Array<any> => {
        return this.controllers;
    });

    public getTranspilers = vi.fn().mockImplementation((): Array<any> => {
        return this.transpilers;
    });

    public getSubmodules = vi.fn().mockImplementation((): Array<any> => {
        return this.submodules;
    });

    public getContracts = vi.fn().mockImplementation((): Array<any> => {
        return this.contracts;
    });

    public getContractsCls = vi.fn().mockImplementation((): Array<any> => {
        return this.contractsCls;
    });

    public getProviders = vi.fn().mockImplementation((): Array<any> => {
        return this.providers;
    });

    public getConfigsSchemas = vi.fn().mockImplementation((): Array<any> => {
        return this.configs;
    });

    public getEntities = vi.fn().mockImplementation((): Array<any> => {
        return this.entities;
    });

    public getModels = vi.fn().mockImplementation((): Array<any> => {
        return this.models;
    });

    public getResolvers = vi.fn().mockImplementation((): Array<any> => {
        return this.resolvers;
    });

    public static reset(): void {
        MockModule.modules.clear();
        MockModule.hasModule.mockReset();
        MockModule.getModule.mockReset();
        MockModule.loadTranspile.mockReset();

        MockModule.hasModule.mockImplementation((name: string): boolean => {
            return MockModule.modules.has(name);
        });

        MockModule.getModule.mockImplementation(
            (name: string): MockModule | null => {
                return MockModule.modules.has(name)
                    ? MockModule.modules.get(name)
                    : null;
            },
        );

        MockModule.loadTranspile.mockImplementation(<T>(transpileRaw: any) => {
            try {
                const transpile = new transpileRaw();
                return transpile as T;
            } catch {
                return {} as T;
            }
        });
    }

    public reset(): void {
        this.getControllers.mockReset();
        this.getTranspilers.mockReset();
        this.getSubmodules.mockReset();
        this.getContracts.mockReset();
        this.getContractsCls.mockReset();
        this.getProviders.mockReset();
        this.getConfigsSchemas.mockReset();
        this.getEntities.mockReset();
        this.getModels.mockReset();
        this.getResolvers.mockReset();

        this.getControllers.mockImplementation((): Array<any> => {
            return this.controllers;
        });

        this.getTranspilers.mockImplementation((): Array<any> => {
            return this.transpilers;
        });

        this.getSubmodules.mockImplementation((): Array<any> => {
            return this.submodules;
        });

        this.getContracts.mockImplementation((): Array<any> => {
            return this.contracts;
        });

        this.getContractsCls.mockImplementation((): Array<any> => {
            return this.contractsCls;
        });

        this.getProviders.mockImplementation((): Array<any> => {
            return this.providers;
        });

        this.getConfigsSchemas.mockImplementation((): Array<any> => {
            return this.configs;
        });

        this.getEntities.mockImplementation((): Array<any> => {
            return this.entities;
        });

        this.getModels.mockImplementation((): Array<any> => {
            return this.models;
        });

        this.getResolvers.mockImplementation((): Array<any> => {
            return this.resolvers;
        });
    }

    public static getMockModule() {
        return {
            Module: MockModule,
        };
    }
}

/**
 * Setup for mocking the Module class
 *
 * @example
 * ```ts
 * import { mockModule } from '@cmmv/testing';
 *
 * vi.mock('@cmmv/core/lib/module', () => mockModule.getMockModule());
 *
 * describe('Your test', () => {
 *   beforeEach(() => {
 *     mockModule.reset();
 *   });
 *
 *   it('tests module functionality', () => {
 *     const testModule = new mockModule('TestModule', {
 *       controllers: [{ test: true }],
 *       contracts: [class TestContract {}]
 *     });
 *
 *     expect(mockModule.getModule('TestModule')).toBe(testModule);
 *     expect(testModule.getControllers()).toEqual([{ test: true }]);
 *   });
 * });
 * ```
 */
export const mockModule = MockModule;
