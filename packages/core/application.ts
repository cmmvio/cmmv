import * as fs from 'node:fs';
import * as path from 'node:path';
import { cwd } from 'node:process';
import * as fg from 'fast-glob';
import * as Terser from 'terser';

import { IHTTPSettings, ConfigSchema, IContract } from './interfaces';

import { AbstractHttpAdapter, AbstractWSAdapter } from './abstracts';

import {
    ITranspile,
    Logger,
    Scope,
    Transpile,
    Module,
    Config,
    Hooks,
    HooksType,
} from '.';

import {
    NAMESPACE_METADATA,
    CONTROLLER_NAME_METADATA,
    FIELD_METADATA,
    MESSAGE_METADATA,
    SERVICE_METADATA,
    PROTO_PATH_METADATA,
    DIRECTMESSAGE_METADATA,
    PROTO_PACKAGE_METADATA,
    GENERATE_CONTROLLER_METADATA,
    GENERATE_ENTITIES_METADATA,
    GENERATE_BOILERPLATES_METADATA,
    AUTH_METADATA,
    ROOTONLY_METADATA,
    CONTROLLER_CUSTOM_PATH_METADATA,
    CONTROLLER_IMPORTS,
    CONTROLLER_INDEXS,
    CONTROLLER_CACHE,
    CONTROLLER_OPTIONS,
    CONTROLLER_VIEWFORM,
    CONTROLLER_VIEWPAGE,
    SUB_PATH_METADATA,
    PUBLIC_METADATA,
} from './decorators';

import { ApplicationTranspile, ContractsTranspile } from './transpilers';

export interface IApplicationSettings {
    wsAdapter?: new (appOrHttpServer: any) => AbstractWSAdapter;
    httpAdapter?: new (instance?: any) => AbstractHttpAdapter;
    httpOptions?: IHTTPSettings;
    httpMiddlewares?: Array<any>;
    transpilers?: Array<new () => ITranspile>;
    modules?: Array<Module>;
    contracts?: Array<new () => any>;
    services?: Array<any>; //#deprecad
    providers?: Array<any>;
    resolvers?: Array<any>;
}

process.on('uncaughtException', (err) => {
    console.error(err);
});

export class Application {
    protected logger: Logger = new Logger('Application');
    public static instance: Application;

    public static appModule = {
        controllers: [],
        providers: [],
        httpMiddlewares: [],
        httpInterceptors: [],
        httpAfterRender: [],
    };

    protected settings: IApplicationSettings;
    protected compile: boolean;
    protected httpAdapter: AbstractHttpAdapter;
    protected httpBind: string;
    protected httpOptions: IHTTPSettings;
    protected wsAdapter: AbstractWSAdapter;
    protected wsServer: any;
    public wSConnections: Map<string, any> = new Map<string, any>();
    protected modules: Array<Module>;
    protected transpilers: Array<new () => ITranspile>;
    protected controllers: Array<any> = [];
    protected submodules: Array<Module> = [];
    protected contracts: Array<any> = [];
    protected configs: Array<ConfigSchema> = [];
    protected entities: Array<any> = [];
    protected models: Array<any> = [];
    protected resolvers: Array<any> = [];
    public providersMap = new Map<string, any>();

    public static contractsCls: Array<new () => {}> = [];
    public static models = new Map<string, new () => any>();

    protected host: string;
    protected port: number;

    constructor(settings: IApplicationSettings, compile: boolean = false) {
        this.logger.log('Initialize application');

        this.settings = settings;
        this.compile = compile;
        this.preInitialize();

        Application.instance = this;
    }

    /**
     * Pre initialize
     */
    protected async preInitialize() {
        await Config.loadConfig();

        this.httpOptions = (this.settings && this.settings.httpOptions) || {};
        this.httpAdapter =
            this.settings && this.settings.httpAdapter
                ? new this.settings.httpAdapter()
                : null;

        if (this.httpAdapter && !this.compile) {
            if (this.settings.wsAdapter)
                this.wsAdapter = new this.settings.wsAdapter(this.httpAdapter);

            this.host = Config.get<string>('server.host', '0.0.0.0');
            this.port = Config.get<number>('server.port', 3000);

            Application.contractsCls = this.settings.contracts || [];
            this.transpilers = this.settings.transpilers || [];
            this.modules = this.settings.modules || [];
            this.resolvers = this.settings.resolvers || [];
            this.contracts =
                this.settings.contracts?.map(
                    (contractClass) => new contractClass(),
                ) || [];
            this.initialize(this.settings, this.compile);
        } else if (this.settings && this.settings.contracts?.length > 0) {
            Application.contractsCls = this.settings.contracts || [];
            this.transpilers =
                (this.settings && this.settings.transpilers) || [];
            this.modules = (this.settings && this.settings.modules) || [];
            this.resolvers = this.settings.resolvers || [];
            this.contracts =
                (this.settings &&
                    this.settings.contracts?.map(
                        (contractClass) => new contractClass(),
                    )) ||
                [];
            this.initialize(this.settings, this.compile);
        }
    }

    /**
     * Initialize the application
     * @param settings - The settings
     * @param compile - The compile
     */
    protected async initialize(
        settings: IApplicationSettings,
        compile: boolean = false,
    ): Promise<void> {
        try {
            this.settings = settings;
            await Hooks.execute(HooksType.onPreInitialize);
            const env = Config.get<string>('env', process.env.NODE_ENV);
            this.loadModules(this.modules);
            await Config.validateConfigs(this.configs);
            await this.getPublicContracts();
            this.processContracts();

            this.transpilers.push(ApplicationTranspile);
            this.transpilers.push(ContractsTranspile);

            if (env === 'dev' || env === 'development' || env === 'build') {
                if (this.transpilers.length > 0) {
                    const transpile = new Transpile(this.transpilers);
                    await transpile.transpile();
                    this.logger.log('All transpilers executed successfully.');
                } else {
                    this.logger.log('No transpilers provided.');
                }

                if (this.httpAdapter) {
                    const appModel = await Application.generateModule();

                    if (appModel) this.loadModules([...this.modules, appModel]);

                    this.createScriptBundle();
                    this.createCSSBundle();
                }
            } else {
                const tsconfig: any = new Function(
                    `return(${fs.readFileSync(path.resolve('./tsconfig.json'), 'utf-8')})`,
                )();

                const outputPath = path.resolve(
                    tsconfig.compilerOptions.outDir,
                    `app.module.js`,
                );

                if (fs.existsSync(outputPath)) {
                    const { ApplicationModule } = await import(outputPath);
                    this.loadModules([...this.modules, ApplicationModule]);
                } else {
                    this.loadModules([...this.modules]);
                }
            }

            const providersLoad = [];

            const processProvider = async (provider) => {
                if (provider && typeof provider.loadConfig === 'function')
                    providersLoad.push(provider?.loadConfig(this));

                if (Scope.has(`_await_service_${provider.name}`)) {
                    providersLoad.push(
                        new Promise(async (resolve) => {
                            const actions = Scope.getArray(
                                `_await_service_${provider.name}`,
                            );

                            if (actions.length > 0) {
                                actions.map(({ cb, context }) => {
                                    cb.bind(context).call(context);
                                });
                            }

                            resolve(true);
                        }),
                    );
                }
            };

            settings.services?.forEach(processProvider);
            settings.providers?.forEach(processProvider);

            await Promise.all(providersLoad);
            await Hooks.execute(HooksType.onInitialize);

            if (this.httpAdapter && !compile) {
                await this.httpAdapter.init(this, this.httpOptions);

                settings?.httpMiddlewares?.forEach((middleware) => {
                    this.httpAdapter?.use(middleware);
                });

                await Hooks.execute(HooksType.onHTTPServerInit);

                if (this.wsAdapter)
                    this.wsServer = this.wsAdapter.create(
                        this.httpAdapter,
                        this,
                    );

                await this.httpAdapter
                    .listen(`${this.host}:${this.port}`)
                    .then(() => {
                        Hooks.execute(HooksType.onListen);

                        this.logger.log(
                            `Server HTTP successfully started on ${this.host}:${this.port}`,
                        );
                    })
                    .catch((error) => {
                        this.logger.error(
                            `Failed to start HTTP server on ${this.httpBind}: ${error.message || error}`,
                        );
                    });
            }
        } catch (error) {
            await Hooks.execute(HooksType.onError, { error });
            console.log(error);

            this.logger.error(
                `Failed to initialize application: ${error.message || error}`,
            );
        }

        if (compile) this.logger.log(`Compilation process complete!`);
    }

    /**
     * Restart the application
     * @returns The result
     */
    public async restart() {
        if (this.httpAdapter) this.httpAdapter.close();

        if (this.wsAdapter) this.wsAdapter.close();

        this.preInitialize();
        return true;
    }

    /**
     * Execute the process
     * @param settings - The settings
     * @returns The result
     */
    protected async execProcess(settings: IApplicationSettings) {
        try {
            Application.contractsCls = settings.contracts || [];
            this.modules = (settings && settings.modules) || [];
            this.transpilers = settings.transpilers || [];
            this.resolvers = settings.resolvers || [];
            this.contracts =
                settings.contracts?.map(
                    (contractClass) => new contractClass(),
                ) || [];

            await Hooks.execute(HooksType.onPreInitialize);
            this.loadModules(this.modules);
            await Config.validateConfigs(this.configs);
            await this.getPublicContracts();
            this.processContracts();

            this.transpilers.push(ApplicationTranspile);
            this.transpilers.push(ContractsTranspile);

            if (this.transpilers.length > 0) {
                const transpile = new Transpile(this.transpilers);
                await transpile.transpile();
                this.logger.log('All transpilers executed successfully.');
            } else {
                this.logger.log('No transpilers provided.');
            }

            const providersLoad = [];

            settings.services?.forEach(async (service) => {
                if (service && typeof service.loadConfig === 'function')
                    providersLoad.push(service?.loadConfig(this));
            });

            settings.providers?.forEach(async (provider) => {
                if (provider && typeof provider.loadConfig === 'function')
                    providersLoad.push(provider?.loadConfig(this));
            });

            await Promise.all(providersLoad);
            await Hooks.execute(HooksType.onInitialize);
        } catch (error) {
            await Hooks.execute(HooksType.onError, { error });
            console.log(error);
            this.logger.error(error.message || error);
        }
    }

    protected async createScriptBundle() {
        const dirBuild = path.resolve('./public/assets');
        const finalbundle = path.resolve('./public/assets/bundle.min.js');

        const files = await fg(path.resolve('./public/core/*.min.js'), {
            ignore: ['node_modules/**'],
        });

        const lines: string[] = [];

        files.forEach((file) => {
            lines.push(fs.readFileSync(file, 'utf-8'));
            lines.push('');
        });

        if (lines.length > 0) {
            const bundleContent = lines.join('\n');

            const result = await Terser.minify(bundleContent, {
                compress: {
                    dead_code: true,
                    conditionals: true,
                    unused: true,
                    drop_debugger: true,
                    drop_console: process.env.NODE_ENV !== 'dev',
                },
                mangle: { toplevel: true },
                output: {
                    beautify: false,
                },
                sourceMap: {
                    url: 'inline',
                },
            });

            if (finalbundle.length > 0) {
                if (!fs.existsSync(dirBuild))
                    fs.mkdirSync(dirBuild, { recursive: true });

                fs.writeFileSync(finalbundle, result.code, {
                    encoding: 'utf-8',
                });
            }
        }
    }

    protected async createCSSBundle() {
        const dirBuild = path.resolve('./public/assets');
        const finalbundle = path.resolve('./public/assets/bundle.min.css');

        const files = await fg(path.resolve('./public/core/*.min.css'), {
            ignore: ['node_modules/**'],
        });

        const lines: string[] = [];

        files.forEach((file) => {
            lines.push(fs.readFileSync(file, 'utf-8'));
            lines.push('');
        });

        if (lines.length > 0) {
            const bundleContent = lines.join('\n');

            if (finalbundle.length > 0) {
                if (!fs.existsSync(dirBuild))
                    fs.mkdirSync(dirBuild, { recursive: true });

                fs.writeFileSync(finalbundle, bundleContent, {
                    encoding: 'utf-8',
                });
            }
        }
    }

    protected loadModules(modules: Array<Module>): void {
        if (modules && modules.length > 0) {
            modules.forEach((module) => {
                if (module) {
                    if (
                        !module.devMode ||
                        (module.devMode === true &&
                            process.env.NODE_ENV === 'dev')
                    ) {
                        Application.contractsCls.push(
                            ...module.getContractsCls(),
                        );

                        this.transpilers.push(...module.getTranspilers());
                        this.controllers.push(...module.getControllers());
                        this.submodules.push(...module.getSubmodules());
                        this.contracts.push(...module.getContracts());
                        this.entities.push(...module.getEntities());
                        this.models.push(...module.getModels());
                        this.configs.push(...module.getConfigsSchemas());
                        this.resolvers.push(...module.getResolvers());

                        module.getProviders().forEach((provider) => {
                            if (provider) {
                                const paramTypes =
                                    Reflect.getMetadata(
                                        'design:paramtypes',
                                        provider,
                                    ) || [];
                                const instances = paramTypes.map(
                                    (paramType: any) =>
                                        this.providersMap.get(paramType.name) ||
                                        new paramType(),
                                );

                                if (
                                    provider &&
                                    typeof provider.loadConfig === 'function'
                                )
                                    provider?.loadConfig(this);

                                const providerInstance = new provider(
                                    ...instances,
                                );
                                this.providersMap.set(
                                    provider.name,
                                    providerInstance,
                                );
                            }
                        });

                        if (module.getSubmodules().length > 0)
                            this.loadModules(module.getSubmodules());
                    }
                }
            });
        }
    }

    protected processContracts(): void {
        if (Array.isArray(this.contracts) && this.contracts.length > 0) {
            this.contracts.forEach((contract) => {
                if (contract) {
                    const target = contract.constructor || contract;
                    const prototype = target.prototype || contract.prototype;

                    const namespace = Reflect.getMetadata(
                        NAMESPACE_METADATA,
                        contract.constructor,
                    );

                    const isPublic = Reflect.getMetadata(
                        PUBLIC_METADATA,
                        contract.constructor,
                    );

                    const controllerName = Reflect.getMetadata(
                        CONTROLLER_NAME_METADATA,
                        contract.constructor,
                    );
                    const subPath = Reflect.getMetadata(
                        SUB_PATH_METADATA,
                        contract.constructor,
                    );
                    const protoPath = Reflect.getMetadata(
                        PROTO_PATH_METADATA,
                        contract.constructor,
                    );
                    const protoPackage = Reflect.getMetadata(
                        PROTO_PACKAGE_METADATA,
                        contract.constructor,
                    );
                    const fields =
                        Reflect.getMetadata(FIELD_METADATA, prototype) || [];
                    const messages =
                        Reflect.getMetadata(MESSAGE_METADATA, prototype) || [];
                    const services =
                        Reflect.getMetadata(SERVICE_METADATA, prototype) || [];
                    const directMessage = Reflect.getMetadata(
                        DIRECTMESSAGE_METADATA,
                        contract.constructor,
                    );
                    const generateController = Reflect.getMetadata(
                        GENERATE_CONTROLLER_METADATA,
                        contract.constructor,
                    );
                    const generateEntities = Reflect.getMetadata(
                        GENERATE_ENTITIES_METADATA,
                        contract.constructor,
                    );
                    const generateBoilerplates = Reflect.getMetadata(
                        GENERATE_BOILERPLATES_METADATA,
                        contract.constructor,
                    );
                    const auth = Reflect.getMetadata(
                        AUTH_METADATA,
                        contract.constructor,
                    );
                    const rootOnly = Reflect.getMetadata(
                        ROOTONLY_METADATA,
                        contract.constructor,
                    );
                    const controllerCustomPath = Reflect.getMetadata(
                        CONTROLLER_CUSTOM_PATH_METADATA,
                        contract.constructor,
                    );
                    const imports = Reflect.getMetadata(
                        CONTROLLER_IMPORTS,
                        contract.constructor,
                    );
                    const indexs = Reflect.getMetadata(
                        CONTROLLER_INDEXS,
                        contract.constructor,
                    );
                    const cache = Reflect.getMetadata(
                        CONTROLLER_CACHE,
                        contract.constructor,
                    );
                    let options = Reflect.getMetadata(
                        CONTROLLER_OPTIONS,
                        contract.constructor,
                    );
                    const viewForm = Reflect.getMetadata(
                        CONTROLLER_VIEWFORM,
                        contract.constructor,
                    );
                    const viewPage = Reflect.getMetadata(
                        CONTROLLER_VIEWPAGE,
                        contract.constructor,
                    );

                    if (!options || typeof options !== 'object') options = {};

                    const contractStructure = {
                        namespace,
                        isPublic,
                        contractName: contract.constructor.name,
                        controllerName,
                        subPath,
                        protoPath,
                        protoPackage,
                        fields,
                        messages,
                        services,
                        directMessage,
                        generateController,
                        generateEntities,
                        generateBoilerplates,
                        auth,
                        rootOnly,
                        controllerCustomPath,
                        imports,
                        indexs,
                        cache,
                        customProto: contract.customProto,
                        customTypes: contract.customTypes,
                        options,
                        viewForm,
                        viewPage,
                    };

                    if (contractStructure.controllerName) {
                        Scope.addToArray('__contracts', contractStructure);
                    } else {
                        this.logger.error(
                            `Contract ${contractStructure.contractName} has no controller name`,
                        );
                    }
                }
            });

            const contracts = Scope.getArray<any>('__contracts');
            contracts?.forEach((contract: any) => this.loadModels(contract));
        }
    }

    protected async loadModels(contract: IContract) {
        const modelName = `${contract.controllerName}`;
        const modelFileName = `${modelName.toLowerCase()}.model.ts`;
        const isModuleContract = contract.options?.moduleContract === true;
        const outputDir = isModuleContract
            ? this.getGeneratedPath(contract, 'models')
            : this.getRootPath(contract, 'models');

        const outputFilePath = path.join(outputDir, modelFileName);
        const modelImport = await import(path.resolve(outputFilePath));
        Application.models.set(modelName, modelImport[modelName]);
    }

    protected getRootPath(contract: any, context: string): string {
        const rootDir = Config.get<string>('app.sourceDir', 'src');

        let outputDir = contract.subPath
            ? path.join(rootDir, context, contract.subPath)
            : path.join(rootDir, context);

        if (!fs.existsSync(outputDir))
            fs.mkdirSync(outputDir, { recursive: true });

        return outputDir;
    }

    protected getGeneratedPath(contract: any, context: string): string {
        let outputDir = contract.subPath
            ? path.join('.generated', context, contract.subPath)
            : path.join('.generated', context);

        if (!fs.existsSync(outputDir))
            fs.mkdirSync(outputDir, { recursive: true });

        return outputDir;
    }

    protected async getPublicContracts() {
        const contracts = await fg([
            path.join(cwd(), 'src', 'contracts', '**', '*.ts'),
            path.join(cwd(), 'src', 'contracts', '*.ts'),
        ]);

        for (const contract of contracts) {
            const contractPath = path.relative(__dirname, contract);
            const contractContent = await import(contractPath);

            for (const key in contractContent) {
                if (key.includes('Contract')) {
                    Application.contractsCls.push(contractContent[key]);

                    const instance = new contractContent[key]();
                    const isPublic = Reflect.getMetadata(
                        PUBLIC_METADATA,
                        instance.constructor,
                    );

                    if (isPublic === true) this.contracts.push(instance);
                }
            }
        }
    }

    public static awaitModule(moduleName: string, cb: Function, context: any) {
        if (Module.hasModule(moduleName)) {
            cb.bind(context).call(context);
        } else {
            Scope.addToArray(`_await_module_${moduleName}`, {
                cb,
                context,
            });
        }
    }

    public static awaitService(
        serviceName: string,
        cb: Function,
        context: any,
    ) {
        Scope.addToArray(`_await_service_${serviceName}`, {
            cb,
            context,
        });
    }

    public static getModel(modelName: string): new () => any {
        if (Application.models.has(modelName))
            return Application.models.get(modelName);

        throw new Error(`Could not load model '${modelName}'`);
    }

    protected static async generateModule(): Promise<Module> {
        try {
            const outputPath = path.resolve('.generated', `app.module.ts`);

            const moduleTemplate = `/**
    **********************************************
    This script was generated automatically by CMMV.
    It is recommended not to modify this file manually,
    as it may be overwritten by the application.
    **********************************************
**/

import "reflect-metadata";

import {
    Module, ApplicationTranspile,
    ApplicationConfig, ContractsTranspile,
    SchedulingService, EventsService
} from "@cmmv/core";

//Controllers
${Application.appModule.controllers.map((controller) => `import { ${controller.name} } from "${controller.path}";`).join('\n')}

//Providers
${Application.appModule.providers.map((provider) => `import { ${provider.name} } from "${provider.path}";`).join('\n')}

export let ApplicationModule = new Module("app", {
    configs: [ApplicationConfig],
    controllers: [
        ${Application.appModule.controllers.map((controller) => controller.name).join(', \n\t\t')}
    ],
    providers: [
        ${Application.appModule.providers.map((provider) => provider.name).join(', \n\t\t')},
        SchedulingService,
        EventsService
    ],
    transpilers: [
        ApplicationTranspile,
        ContractsTranspile
    ]
});`;

            if (!fs.existsSync(path.dirname(outputPath)))
                fs.mkdirSync(path.dirname(outputPath), { recursive: true });

            await fs.writeFileSync(outputPath, moduleTemplate, 'utf8');

            const { ApplicationModule } = await import(outputPath);
            return ApplicationModule as Module;
        } catch (e) {
            console.error(e);
            new Logger('Application').error(e.message, 'generateModule');
            return null;
        }
    }

    public getHttpAdapter(): AbstractHttpAdapter {
        return this.httpAdapter as AbstractHttpAdapter;
    }

    public getUnderlyingHttpServer() {
        this.httpAdapter.getHttpServer();
    }

    public getWSServer(): AbstractWSAdapter {
        return this.wsServer as AbstractWSAdapter;
    }

    public static create(settings?: IApplicationSettings): Application {
        return new Application(settings);
    }

    public static compile(settings?: IApplicationSettings): Application {
        return new Application(settings, true);
    }

    public static exec(settings?: IApplicationSettings) {
        return new Application(settings, true).execProcess(settings);
    }

    public static async execAsyncFn(
        settings: IApplicationSettings,
        providerClass: new () => any,
        functionName: string,
    ) {
        return new Promise(async (resolve, reject) => {
            try {
                const app = new Application(settings, true);
                await app.execProcess(settings);
                const provider = new providerClass();

                if (typeof provider[functionName] !== 'function')
                    throw new Error(
                        `The function '${functionName}' was not found in the provider`,
                    );

                const result = await provider[functionName]();
                resolve(result);
            } catch (e) {
                reject(e);
            }
        });
    }

    public static setHTTPMiddleware(cb: Function) {
        Application.appModule.httpMiddlewares.push(cb);
    }

    public static setHTTPInterceptor(cb: Function) {
        Application.appModule.httpInterceptors.push(cb);
    }

    public static setHTTPAfterRender(cb: Function) {
        Application.appModule.httpAfterRender.push(cb);
    }

    public static resolveProvider<T = undefined>(
        providerCls: new (...args: any) => T,
    ): T {
        const paramTypes =
            Reflect.getMetadata('design:paramtypes', providerCls) || [];

        const instances = paramTypes.map((paramType: any) =>
            Application.instance.providersMap.get(paramType.name),
        );

        const instance = new providerCls(...instances);
        return instance;
    }

    public static getContract(contractName: string): new () => {} | null {
        return Application.contractsCls.find(
            (cls) => cls.name === contractName,
        );
    }

    public static getResolvers() {
        return Array.from(new Set(Application.instance.resolvers));
    }

    public static getResolver(resolverName: string) {
        return Application.instance.resolvers.filter(
            (cls) => cls.name === resolverName,
        );
    }
}
