import { IApplicationSettings, Module, IModuleOptions } from '@cmmv/core';

import { ApplicationMock } from './application.mock';
import { TestingModuleBuilder } from './testing.builder';
import { ITestingModuleBuilder } from './testing.interface';

/**
 * Test utility class for creating testing modules and mock applications
 *
 * @example
 * ```typescript
 * // Using the fluent API
 * const module = await Test.createTestingModule()
 *   .addProviders([MyService])
 *   .overrideProvider(MyService).useValue(mockService)
 *   .compile();
 *
 * // Legacy API
 * const app = Test.createApplication({ ... });
 * ```
 */
export class Test {
    /**
     * Create a new testing module builder with fluent API
     *
     * @example
     * ```typescript
     * const module = await Test.createTestingModule()
     *   .setSettings({ httpAdapter: MockDefaultAdapter })
     *   .import([AuthModule])
     *   .addControllers([UserController])
     *   .addProviders([UserService])
     *   .overrideProvider(UserService).useValue({
     *     findAll: vi.fn().mockResolvedValue([]),
     *   })
     *   .compile();
     * ```
     */
    public static createTestingModule(): ITestingModuleBuilder {
        return new TestingModuleBuilder();
    }

    /**
     * Create a mock application instance (legacy API)
     * @deprecated Use createTestingModule() instead
     */
    public static createApplication(
        settings?: IApplicationSettings,
    ): ApplicationMock {
        const app = new ApplicationMock(settings);
        return app;
    }

    /**
     * Create a mock module instance
     */
    public static createMockModule(options?: IModuleOptions): Module {
        const MockModule = new Module('mock-module', options || {});
        return MockModule;
    }
}
