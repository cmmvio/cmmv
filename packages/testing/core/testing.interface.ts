import { IApplicationSettings, Module, IModuleOptions } from '@cmmv/core';

/**
 * Interface for provider override configuration
 */
export interface IProviderOverride {
    /** The provider class or token to override */
    provider: any;
    /** The mock implementation to use instead */
    useValue?: any;
    /** A class to instantiate as the mock */
    useClass?: any;
    /** A factory function that returns the mock */
    useFactory?: (...args: any[]) => any;
}

/**
 * Interface for guard override configuration
 */
export interface IGuardOverride {
    /** The guard class to override */
    guard: any;
    /** The mock implementation to use instead */
    useValue?: any;
    /** A class to instantiate as the mock */
    useClass?: any;
}

/**
 * Interface for interceptor override configuration
 */
export interface IInterceptorOverride {
    /** The interceptor class to override */
    interceptor: any;
    /** The mock implementation to use instead */
    useValue?: any;
    /** A class to instantiate as the mock */
    useClass?: any;
}

/**
 * Interface for the testing module configuration
 */
export interface ITestingModuleConfig {
    /** Application settings */
    settings?: IApplicationSettings;
    /** Modules to import */
    imports?: Module[];
    /** Controllers to include */
    controllers?: any[];
    /** Providers to include */
    providers?: any[];
    /** Provider overrides */
    providerOverrides?: IProviderOverride[];
    /** Guard overrides */
    guardOverrides?: IGuardOverride[];
    /** Interceptor overrides */
    interceptorOverrides?: IInterceptorOverride[];
}

/**
 * Interface for the compiled testing module
 */
export interface ITestingModule {
    /** Get the underlying application instance */
    getApplication(): any;

    /** Get a provider by class or token */
    get<T>(typeOrToken: any): T;

    /** Resolve a provider (creates new instance if scoped) */
    resolve<T>(typeOrToken: any): Promise<T>;

    /** Get the HTTP adapter for request testing */
    getHttpAdapter(): any;

    /** Get a controller instance */
    getController<T>(controller: any): T;

    /** Close the testing module and cleanup resources */
    close(): Promise<void>;

    /** Initialize the module (called automatically by compile) */
    init(): Promise<ITestingModule>;
}

/**
 * Interface for the testing module builder
 */
export interface ITestingModuleBuilder {
    /** Set application settings */
    setSettings(settings: IApplicationSettings): ITestingModuleBuilder;

    /** Import modules */
    import(modules: Module[]): ITestingModuleBuilder;

    /** Add controllers */
    addControllers(controllers: any[]): ITestingModuleBuilder;

    /** Add providers */
    addProviders(providers: any[]): ITestingModuleBuilder;

    /** Override a provider with a mock */
    overrideProvider(provider: any): IProviderOverrideBuilder;

    /** Override a guard with a mock */
    overrideGuard(guard: any): IGuardOverrideBuilder;

    /** Override an interceptor with a mock */
    overrideInterceptor(interceptor: any): IInterceptorOverrideBuilder;

    /** Compile and return the testing module */
    compile(): Promise<ITestingModule>;
}

/**
 * Interface for provider override builder (fluent API)
 */
export interface IProviderOverrideBuilder {
    /** Use a value as the mock */
    useValue(value: any): ITestingModuleBuilder;

    /** Use a class as the mock */
    useClass(mockClass: any): ITestingModuleBuilder;

    /** Use a factory function to create the mock */
    useFactory(factory: (...args: any[]) => any): ITestingModuleBuilder;
}

/**
 * Interface for guard override builder (fluent API)
 */
export interface IGuardOverrideBuilder {
    /** Use a value as the mock */
    useValue(value: any): ITestingModuleBuilder;

    /** Use a class as the mock */
    useClass(mockClass: any): ITestingModuleBuilder;
}

/**
 * Interface for interceptor override builder (fluent API)
 */
export interface IInterceptorOverrideBuilder {
    /** Use a value as the mock */
    useValue(value: any): ITestingModuleBuilder;

    /** Use a class as the mock */
    useClass(mockClass: any): ITestingModuleBuilder;
}
