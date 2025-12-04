import {
    Application,
    Config,
    Module,
    IApplicationSettings,
    Scope,
} from '@cmmv/core';

import {
    ITestingModule,
    ITestingModuleConfig,
    IProviderOverride,
    IGuardOverride,
    IInterceptorOverride,
} from './testing.interface';
import { ApplicationMock } from './application.mock';

/**
 * TestingModule - A compiled testing module that provides access to
 * the application container and allows resolving providers
 */
export class TestingModule implements ITestingModule {
    private application: ApplicationMock;
    private providerOverrides: Map<any, any> = new Map();
    private guardOverrides: Map<any, any> = new Map();
    private interceptorOverrides: Map<any, any> = new Map();
    private providers: Map<any, any> = new Map();
    private controllers: Map<any, any> = new Map();
    private initialized: boolean = false;

    constructor(private config: ITestingModuleConfig) {
        this.setupOverrides();
    }

    /**
     * Setup the override maps from config
     */
    private setupOverrides(): void {
        // Setup provider overrides
        if (this.config.providerOverrides) {
            for (const override of this.config.providerOverrides) {
                const mockValue = this.resolveMockValue(override);
                this.providerOverrides.set(override.provider, mockValue);
            }
        }

        // Setup guard overrides
        if (this.config.guardOverrides) {
            for (const override of this.config.guardOverrides) {
                const mockValue = override.useValue ?? new override.useClass();
                this.guardOverrides.set(override.guard, mockValue);
            }
        }

        // Setup interceptor overrides
        if (this.config.interceptorOverrides) {
            for (const override of this.config.interceptorOverrides) {
                const mockValue = override.useValue ?? new override.useClass();
                this.interceptorOverrides.set(override.interceptor, mockValue);
            }
        }
    }

    /**
     * Resolve the mock value from an override configuration
     */
    private resolveMockValue(override: IProviderOverride): any {
        if (override.useValue !== undefined) {
            return override.useValue;
        }
        if (override.useClass) {
            return new override.useClass();
        }
        if (override.useFactory) {
            return override.useFactory();
        }
        return null;
    }

    /**
     * Initialize the testing module
     */
    async init(): Promise<ITestingModule> {
        if (this.initialized) {
            return this;
        }

        // Set testing environment
        Config.set('env', 'testing');

        // Create the application settings
        const settings: IApplicationSettings = {
            ...this.config.settings,
            modules: this.config.imports || [],
        };

        // Create the mock application
        this.application = new ApplicationMock(settings);

        // Register providers
        if (this.config.providers) {
            for (const provider of this.config.providers) {
                // Check if there's an override
                if (this.providerOverrides.has(provider)) {
                    this.providers.set(provider, this.providerOverrides.get(provider));
                } else {
                    // Create instance of the provider
                    try {
                        const instance = new provider();
                        this.providers.set(provider, instance);
                    } catch {
                        // Provider might need dependencies, store the class
                        this.providers.set(provider, provider);
                    }
                }
            }
        }

        // Register controllers
        if (this.config.controllers) {
            for (const controller of this.config.controllers) {
                try {
                    const instance = new controller();
                    this.controllers.set(controller, instance);
                } catch {
                    this.controllers.set(controller, controller);
                }
            }
        }

        this.initialized = true;
        return this;
    }

    /**
     * Get the underlying application instance
     */
    getApplication(): ApplicationMock {
        return this.application;
    }

    /**
     * Get a provider by class or token
     */
    get<T>(typeOrToken: any): T {
        // Check overrides first
        if (this.providerOverrides.has(typeOrToken)) {
            return this.providerOverrides.get(typeOrToken) as T;
        }

        // Check registered providers
        if (this.providers.has(typeOrToken)) {
            return this.providers.get(typeOrToken) as T;
        }

        // Try to resolve from Application
        try {
            return Application.resolveProvider<T>(typeOrToken);
        } catch {
            // Return null if not found
            return null as T;
        }
    }

    /**
     * Resolve a provider (creates new instance if scoped)
     */
    async resolve<T>(typeOrToken: any): Promise<T> {
        // For testing, we use the same logic as get
        // In production, this would handle scoped providers differently
        return this.get<T>(typeOrToken);
    }

    /**
     * Get the HTTP adapter for request testing
     */
    getHttpAdapter(): any {
        return this.application?.getHttpAdapter() ?? null;
    }

    /**
     * Get a controller instance
     */
    getController<T>(controller: any): T {
        if (this.controllers.has(controller)) {
            return this.controllers.get(controller) as T;
        }
        return null as T;
    }

    /**
     * Check if a guard is overridden
     */
    isGuardOverridden(guard: any): boolean {
        return this.guardOverrides.has(guard);
    }

    /**
     * Get the guard override
     */
    getGuardOverride<T>(guard: any): T {
        return this.guardOverrides.get(guard) as T;
    }

    /**
     * Check if an interceptor is overridden
     */
    isInterceptorOverridden(interceptor: any): boolean {
        return this.interceptorOverrides.has(interceptor);
    }

    /**
     * Get the interceptor override
     */
    getInterceptorOverride<T>(interceptor: any): T {
        return this.interceptorOverrides.get(interceptor) as T;
    }

    /**
     * Close the testing module and cleanup resources
     */
    async close(): Promise<void> {
        if (this.application) {
            await this.application.close();
        }

        // Clear all maps
        this.providerOverrides.clear();
        this.guardOverrides.clear();
        this.interceptorOverrides.clear();
        this.providers.clear();
        this.controllers.clear();

        this.initialized = false;
    }
}
