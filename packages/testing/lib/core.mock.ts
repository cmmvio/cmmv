import { vi } from 'vitest';
import { mockConfig, MockConfig } from './config.mock';
import { mockCompile, MockCompile } from './compile.mock';
import { mockHooks, MockHooks, MockHooksType } from './hooks.mock';
import { mockLogger, MockLogger } from './logger.mock';
import { mockModule, MockModule } from './module.mock';
import { mockResolvers, MockResolvers } from './resolvers.mock';
import { mockScope, MockScope } from './scope.mock';
import { mockTelemetry, MockTelemetry } from './telemetry.mock';
import {
    mockTranspile,
    MockTranspile,
    MockAbstractTranspile,
} from './transpile.mock';

export class MockCore {
    public static Config = MockConfig;
    public static Compile = MockCompile;
    public static Hooks = MockHooks;
    public static HooksType = MockHooksType;
    public static Logger = MockLogger;
    public static Module = MockModule;
    public static Resolvers = MockResolvers;
    public static Scope = MockScope;
    public static Telemetry = MockTelemetry;
    public static Transpile = MockTranspile;
    public static AbstractTranspile = MockAbstractTranspile;

    public static createLogger(context: string = 'Test'): MockLogger {
        return new MockLogger(context);
    }

    public static createModule(name: string, options: any = {}): MockModule {
        return new MockModule(name, options);
    }

    public static createTranspile(): MockTranspile {
        return new MockTranspile();
    }

    public static createAbstractTranspile(): MockAbstractTranspile {
        return new MockAbstractTranspile();
    }

    public static resetAll(): void {
        MockConfig.reset();
        MockHooks.reset();
        MockResolvers.reset();
        MockScope.reset();
        MockTelemetry.reset();
        const compile = MockCompile.getInstance();
        compile.reset();
    }

    public static getCore() {
        return {
            Config: MockConfig,
            Compile: MockCompile,
            Hooks: MockHooks,
            HooksType: MockHooksType,
            Logger: MockLogger,
            Module: MockModule,
            Resolvers: MockResolvers,
            Scope: MockScope,
            Telemetry: MockTelemetry,
            Transpile: MockTranspile,
            AbstractTranspile: MockAbstractTranspile,
            Singleton: class Singleton {
                static _instance: any;
                public static getInstance(): any {
                    if (!this._instance) {
                        this._instance = new this();
                    }
                    return this._instance;
                }
            },
        };
    }
}

/**
 * Centralized mock for the @cmmv/core module
 *
 * @example
 * ```ts
 * import { mockCore } from '@cmmv/testing';
 *
 * // Mock the entire @cmmv/core module
 * vi.mock('@cmmv/core', () => mockCore.getCore());
 *
 * describe('Your test', () => {
 *   beforeEach(() => {
 *     // Reset all mocks before each test
 *     mockCore.resetAll();
 *   });
 *
 *   it('tests core functionality', () => {
 *     // Set up some config for testing
 *     mockCore.Config.setup({
 *       server: { port: 3000 }
 *     });
 *
 *     // Mock a hook
 *     const logHook = vi.fn();
 *     mockCore.Hooks.add(mockCore.HooksType.Log, logHook);
 *
 *     // Test your code that uses core
 *     const result = yourFunction();
 *
 *     // Assert on the mocks
 *     expect(mockCore.Config.get('server.port')).toBe(3000);
 *     expect(logHook).toHaveBeenCalled();
 *   });
 * });
 * ```
 */
export const mockCore = MockCore;

// Re-export all individual mocks for convenience
export {
    mockConfig,
    mockCompile,
    mockHooks,
    mockLogger,
    mockModule,
    mockResolvers,
    mockScope,
    mockTelemetry,
    mockTranspile,

    // Types
    MockConfig,
    MockCompile,
    MockHooks,
    MockHooksType,
    MockLogger,
    MockModule,
    MockResolvers,
    MockScope,
    MockTelemetry,
    MockTranspile,
    MockAbstractTranspile,
};
