import { IApplicationSettings, Module } from '@cmmv/core';

import {
    ITestingModule,
    ITestingModuleBuilder,
    ITestingModuleConfig,
    IProviderOverride,
    IGuardOverride,
    IInterceptorOverride,
    IProviderOverrideBuilder,
    IGuardOverrideBuilder,
    IInterceptorOverrideBuilder,
} from './testing.interface';
import { TestingModule } from './testing.module';

/**
 * Builder class for provider overrides (fluent API)
 */
class ProviderOverrideBuilder implements IProviderOverrideBuilder {
    constructor(
        private builder: TestingModuleBuilder,
        private provider: any,
    ) {}

    useValue(value: any): ITestingModuleBuilder {
        this.builder.addProviderOverride({
            provider: this.provider,
            useValue: value,
        });
        return this.builder;
    }

    useClass(mockClass: any): ITestingModuleBuilder {
        this.builder.addProviderOverride({
            provider: this.provider,
            useClass: mockClass,
        });
        return this.builder;
    }

    useFactory(factory: (...args: any[]) => any): ITestingModuleBuilder {
        this.builder.addProviderOverride({
            provider: this.provider,
            useFactory: factory,
        });
        return this.builder;
    }
}

/**
 * Builder class for guard overrides (fluent API)
 */
class GuardOverrideBuilder implements IGuardOverrideBuilder {
    constructor(
        private builder: TestingModuleBuilder,
        private guard: any,
    ) {}

    useValue(value: any): ITestingModuleBuilder {
        this.builder.addGuardOverride({
            guard: this.guard,
            useValue: value,
        });
        return this.builder;
    }

    useClass(mockClass: any): ITestingModuleBuilder {
        this.builder.addGuardOverride({
            guard: this.guard,
            useClass: mockClass,
        });
        return this.builder;
    }
}

/**
 * Builder class for interceptor overrides (fluent API)
 */
class InterceptorOverrideBuilder implements IInterceptorOverrideBuilder {
    constructor(
        private builder: TestingModuleBuilder,
        private interceptor: any,
    ) {}

    useValue(value: any): ITestingModuleBuilder {
        this.builder.addInterceptorOverride({
            interceptor: this.interceptor,
            useValue: value,
        });
        return this.builder;
    }

    useClass(mockClass: any): ITestingModuleBuilder {
        this.builder.addInterceptorOverride({
            interceptor: this.interceptor,
            useClass: mockClass,
        });
        return this.builder;
    }
}

/**
 * TestingModuleBuilder - Provides a fluent API for building testing modules
 *
 * @example
 * ```typescript
 * const module = await Test.createTestingModule()
 *   .setSettings({ ... })
 *   .import([MyModule])
 *   .addControllers([MyController])
 *   .addProviders([MyService])
 *   .overrideProvider(MyService).useValue(mockService)
 *   .compile();
 *
 * const service = module.get(MyService);
 * ```
 */
export class TestingModuleBuilder implements ITestingModuleBuilder {
    private config: ITestingModuleConfig = {
        settings: {},
        imports: [],
        controllers: [],
        providers: [],
        providerOverrides: [],
        guardOverrides: [],
        interceptorOverrides: [],
    };

    /**
     * Set application settings
     */
    setSettings(settings: IApplicationSettings): ITestingModuleBuilder {
        this.config.settings = { ...this.config.settings, ...settings };
        return this;
    }

    /**
     * Import modules
     */
    import(modules: Module[]): ITestingModuleBuilder {
        this.config.imports = [...(this.config.imports || []), ...modules];
        return this;
    }

    /**
     * Add controllers
     */
    addControllers(controllers: any[]): ITestingModuleBuilder {
        this.config.controllers = [
            ...(this.config.controllers || []),
            ...controllers,
        ];
        return this;
    }

    /**
     * Add providers
     */
    addProviders(providers: any[]): ITestingModuleBuilder {
        this.config.providers = [...(this.config.providers || []), ...providers];
        return this;
    }

    /**
     * Override a provider with a mock
     */
    overrideProvider(provider: any): IProviderOverrideBuilder {
        return new ProviderOverrideBuilder(this, provider);
    }

    /**
     * Override a guard with a mock
     */
    overrideGuard(guard: any): IGuardOverrideBuilder {
        return new GuardOverrideBuilder(this, guard);
    }

    /**
     * Override an interceptor with a mock
     */
    overrideInterceptor(interceptor: any): IInterceptorOverrideBuilder {
        return new InterceptorOverrideBuilder(this, interceptor);
    }

    /**
     * Add a provider override (internal method)
     */
    addProviderOverride(override: IProviderOverride): void {
        this.config.providerOverrides = [
            ...(this.config.providerOverrides || []),
            override,
        ];
    }

    /**
     * Add a guard override (internal method)
     */
    addGuardOverride(override: IGuardOverride): void {
        this.config.guardOverrides = [
            ...(this.config.guardOverrides || []),
            override,
        ];
    }

    /**
     * Add an interceptor override (internal method)
     */
    addInterceptorOverride(override: IInterceptorOverride): void {
        this.config.interceptorOverrides = [
            ...(this.config.interceptorOverrides || []),
            override,
        ];
    }

    /**
     * Compile and return the testing module
     */
    async compile(): Promise<ITestingModule> {
        const module = new TestingModule(this.config);
        await module.init();
        return module;
    }
}
