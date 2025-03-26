"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.Application = void 0;
const fs = require("node:fs");
const path = require("node:path");
const node_process_1 = require("node:process");
const fg = require("fast-glob");
const Terser = require("terser");
const _1 = require(".");
const decorators_1 = require("./decorators");
const transpilers_1 = require("./transpilers");
process.on('uncaughtException', (err) => {
    console.error(err);
});
class Application {
    constructor(settings, compile = false) {
        this.logger = new _1.Logger('Application');
        this.wSConnections = new Map();
        this.controllers = [];
        this.submodules = [];
        this.contracts = [];
        this.configs = [];
        this.entities = [];
        this.models = [];
        this.resolvers = [];
        this.providersMap = new Map();
        this.logger.log('Initialize application');
        _1.Config.loadConfig();
        this.settings = settings;
        this.compile = compile;
        this.preInitialize();
        Application.instance = this;
    }
    preInitialize() {
        this.httpOptions = (this.settings && this.settings.httpOptions) || {};
        this.httpAdapter =
            this.settings && this.settings.httpAdapter
                ? new this.settings.httpAdapter()
                : null;
        if (this.httpAdapter && !this.compile) {
            if (this.settings.wsAdapter)
                this.wsAdapter = new this.settings.wsAdapter(this.httpAdapter);
            this.host = _1.Config.get('server.host') || '0.0.0.0';
            this.port = _1.Config.get('server.port') || 3000;
            Application.contractsCls = this.settings.contracts || [];
            this.transpilers = this.settings.transpilers || [];
            this.modules = this.settings.modules || [];
            this.resolvers = this.settings.resolvers || [];
            this.contracts =
                this.settings.contracts?.map((contractClass) => new contractClass()) || [];
            this.initialize(this.settings, this.compile);
        }
        else if (this.settings && this.settings.contracts?.length > 0) {
            Application.contractsCls = this.settings.contracts || [];
            this.transpilers =
                (this.settings && this.settings.transpilers) || [];
            this.modules = (this.settings && this.settings.modules) || [];
            this.resolvers = this.settings.resolvers || [];
            this.contracts =
                (this.settings &&
                    this.settings.contracts?.map((contractClass) => new contractClass())) ||
                    [];
            this.initialize(this.settings, this.compile);
        }
    }
    async initialize(settings, compile = false) {
        try {
            this.settings = settings;
            await _1.Hooks.execute(_1.HooksType.onPreInitialize);
            const env = _1.Config.get('env', process.env.NODE_ENV);
            this.loadModules(this.modules);
            await _1.Config.validateConfigs(this.configs);
            await this.getPublicContracts();
            this.processContracts();
            this.transpilers.push(transpilers_1.ApplicationTranspile);
            this.transpilers.push(transpilers_1.ContractsTranspile);
            if (env === 'dev' || env === 'development' || env === 'build') {
                if (this.transpilers.length > 0) {
                    const transpile = new _1.Transpile(this.transpilers);
                    await transpile.transpile();
                    this.logger.log('All transpilers executed successfully.');
                }
                else {
                    this.logger.log('No transpilers provided.');
                }
                if (this.httpAdapter) {
                    const appModel = await Application.generateModule();
                    if (appModel)
                        this.loadModules([...this.modules, appModel]);
                    this.createScriptBundle();
                    this.createCSSBundle();
                }
            }
            else {
                const tsconfig = new Function(`return(${fs.readFileSync(path.resolve('./tsconfig.json'), 'utf-8')})`)();
                const outputPath = path.resolve(tsconfig.compilerOptions.outDir, `app.module.js`);
                if (fs.existsSync(outputPath)) {
                    const { ApplicationModule } = await Promise.resolve(`${outputPath}`).then(s => require(s));
                    this.loadModules([...this.modules, ApplicationModule]);
                }
                else {
                    this.loadModules([...this.modules]);
                }
            }
            const providersLoad = [];
            const processProvider = async (provider) => {
                if (provider && typeof provider.loadConfig === 'function')
                    providersLoad.push(provider?.loadConfig(this));
                if (_1.Scope.has(`_await_service_${provider.name}`)) {
                    providersLoad.push(new Promise(async (resolve) => {
                        const actions = _1.Scope.getArray(`_await_service_${provider.name}`);
                        if (actions.length > 0) {
                            actions.map(({ cb, context }) => {
                                cb.bind(context).call(context);
                            });
                        }
                        resolve(true);
                    }));
                }
            };
            settings.services?.forEach(processProvider);
            settings.providers?.forEach(processProvider);
            await Promise.all(providersLoad);
            await _1.Hooks.execute(_1.HooksType.onInitialize);
            if (this.httpAdapter && !compile) {
                await this.httpAdapter.init(this, this.httpOptions);
                settings?.httpMiddlewares?.forEach((middleware) => {
                    this.httpAdapter?.use(middleware);
                });
                await _1.Hooks.execute(_1.HooksType.onHTTPServerInit);
                if (this.wsAdapter)
                    this.wsServer = this.wsAdapter.create(this.httpAdapter, this);
                await this.httpAdapter
                    .listen(`${this.host}:${this.port}`)
                    .then(() => {
                    _1.Hooks.execute(_1.HooksType.onListen);
                    this.logger.log(`Server HTTP successfully started on ${this.host}:${this.port}`);
                })
                    .catch((error) => {
                    this.logger.error(`Failed to start HTTP server on ${this.httpBind}: ${error.message || error}`);
                });
            }
        }
        catch (error) {
            await _1.Hooks.execute(_1.HooksType.onError, { error });
            console.log(error);
            this.logger.error(`Failed to initialize application: ${error.message || error}`);
        }
        if (compile)
            this.logger.log(`Compilation process complete!`);
    }
    async restart() {
        if (this.httpAdapter)
            this.httpAdapter.close();
        if (this.wsAdapter)
            this.wsAdapter.close();
        this.preInitialize();
        return true;
    }
    async execProcess(settings) {
        try {
            Application.contractsCls = settings.contracts || [];
            this.modules = (settings && settings.modules) || [];
            this.transpilers = settings.transpilers || [];
            this.resolvers = settings.resolvers || [];
            this.contracts =
                settings.contracts?.map((contractClass) => new contractClass()) || [];
            await _1.Hooks.execute(_1.HooksType.onPreInitialize);
            this.loadModules(this.modules);
            await _1.Config.validateConfigs(this.configs);
            await this.getPublicContracts();
            this.processContracts();
            this.transpilers.push(transpilers_1.ApplicationTranspile);
            this.transpilers.push(transpilers_1.ContractsTranspile);
            if (this.transpilers.length > 0) {
                const transpile = new _1.Transpile(this.transpilers);
                await transpile.transpile();
                this.logger.log('All transpilers executed successfully.');
            }
            else {
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
            await _1.Hooks.execute(_1.HooksType.onInitialize);
        }
        catch (error) {
            await _1.Hooks.execute(_1.HooksType.onError, { error });
            console.log(error);
            this.logger.error(error.message || error);
        }
    }
    async createScriptBundle() {
        const dirBuild = path.resolve('./public/assets');
        const finalbundle = path.resolve('./public/assets/bundle.min.js');
        const files = await fg(path.resolve('./public/core/*.min.js'), {
            ignore: ['node_modules/**'],
        });
        const lines = [];
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
    async createCSSBundle() {
        const dirBuild = path.resolve('./public/assets');
        const finalbundle = path.resolve('./public/assets/bundle.min.css');
        const files = await fg(path.resolve('./public/core/*.min.css'), {
            ignore: ['node_modules/**'],
        });
        const lines = [];
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
    loadModules(modules) {
        if (modules && modules.length > 0) {
            modules.forEach((module) => {
                if (module) {
                    if (!module.devMode ||
                        (module.devMode === true &&
                            process.env.NODE_ENV === 'dev')) {
                        Application.contractsCls.push(...module.getContractsCls());
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
                                const paramTypes = Reflect.getMetadata('design:paramtypes', provider) || [];
                                const instances = paramTypes.map((paramType) => this.providersMap.get(paramType.name) ||
                                    new paramType());
                                if (provider &&
                                    typeof provider.loadConfig === 'function')
                                    provider?.loadConfig(this);
                                const providerInstance = new provider(...instances);
                                this.providersMap.set(provider.name, providerInstance);
                            }
                        });
                        if (module.getSubmodules().length > 0)
                            this.loadModules(module.getSubmodules());
                    }
                }
            });
        }
    }
    processContracts() {
        if (Array.isArray(this.contracts) && this.contracts.length > 0) {
            this.contracts.forEach((contract) => {
                if (contract) {
                    const target = contract.constructor || contract;
                    const prototype = target.prototype || contract.prototype;
                    const namespace = Reflect.getMetadata(decorators_1.NAMESPACE_METADATA, contract.constructor);
                    const isPublic = Reflect.getMetadata(decorators_1.PUBLIC_METADATA, contract.constructor);
                    const controllerName = Reflect.getMetadata(decorators_1.CONTROLLER_NAME_METADATA, contract.constructor);
                    const subPath = Reflect.getMetadata(decorators_1.SUB_PATH_METADATA, contract.constructor);
                    const protoPath = Reflect.getMetadata(decorators_1.PROTO_PATH_METADATA, contract.constructor);
                    const protoPackage = Reflect.getMetadata(decorators_1.PROTO_PACKAGE_METADATA, contract.constructor);
                    const fields = Reflect.getMetadata(decorators_1.FIELD_METADATA, prototype) || [];
                    const messages = Reflect.getMetadata(decorators_1.MESSAGE_METADATA, prototype) || [];
                    const services = Reflect.getMetadata(decorators_1.SERVICE_METADATA, prototype) || [];
                    const directMessage = Reflect.getMetadata(decorators_1.DIRECTMESSAGE_METADATA, contract.constructor);
                    const generateController = Reflect.getMetadata(decorators_1.GENERATE_CONTROLLER_METADATA, contract.constructor);
                    const generateEntities = Reflect.getMetadata(decorators_1.GENERATE_ENTITIES_METADATA, contract.constructor);
                    const generateBoilerplates = Reflect.getMetadata(decorators_1.GENERATE_BOILERPLATES_METADATA, contract.constructor);
                    const auth = Reflect.getMetadata(decorators_1.AUTH_METADATA, contract.constructor);
                    const rootOnly = Reflect.getMetadata(decorators_1.ROOTONLY_METADATA, contract.constructor);
                    const controllerCustomPath = Reflect.getMetadata(decorators_1.CONTROLLER_CUSTOM_PATH_METADATA, contract.constructor);
                    const imports = Reflect.getMetadata(decorators_1.CONTROLLER_IMPORTS, contract.constructor);
                    const indexs = Reflect.getMetadata(decorators_1.CONTROLLER_INDEXS, contract.constructor);
                    const cache = Reflect.getMetadata(decorators_1.CONTROLLER_CACHE, contract.constructor);
                    const options = Reflect.getMetadata(decorators_1.CONTROLLER_OPTIONS, contract.constructor);
                    const viewForm = Reflect.getMetadata(decorators_1.CONTROLLER_VIEWFORM, contract.constructor);
                    const viewPage = Reflect.getMetadata(decorators_1.CONTROLLER_VIEWPAGE, contract.constructor);
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
                    _1.Scope.addToArray('__contracts', contractStructure);
                }
            });
            const contracts = _1.Scope.getArray('__contracts');
            contracts?.forEach((contract) => this.loadModels(contract));
        }
    }
    async loadModels(contract) {
        const modelName = `${contract.controllerName}`;
        const modelFileName = `${modelName.toLowerCase()}.model.ts`;
        const isModuleContract = contract.options?.moduleContract === true;
        const outputDir = isModuleContract
            ? this.getGeneratedPath(contract, 'models')
            : this.getRootPath(contract, 'models');
        const outputFilePath = path.join(outputDir, modelFileName);
        const modelImport = await Promise.resolve(`${path.resolve(outputFilePath)}`).then(s => require(s));
        Application.models.set(modelName, modelImport[modelName]);
    }
    getRootPath(contract, context) {
        const rootDir = _1.Config.get('app.sourceDir', 'src');
        let outputDir = contract.subPath
            ? path.join(rootDir, context, contract.subPath)
            : path.join(rootDir, context);
        if (!fs.existsSync(outputDir))
            fs.mkdirSync(outputDir, { recursive: true });
        return outputDir;
    }
    getGeneratedPath(contract, context) {
        let outputDir = contract.subPath
            ? path.join('.generated', context, contract.subPath)
            : path.join('.generated', context);
        if (!fs.existsSync(outputDir))
            fs.mkdirSync(outputDir, { recursive: true });
        return outputDir;
    }
    async getPublicContracts() {
        const contracts = await fg([
            path.join((0, node_process_1.cwd)(), 'src', 'contracts', '**', '*.ts'),
            path.join((0, node_process_1.cwd)(), 'src', 'contracts', '*.ts'),
        ]);
        for (const contract of contracts) {
            const contractPath = path.relative(__dirname, contract);
            const contractContent = await Promise.resolve(`${contractPath}`).then(s => require(s));
            for (const key in contractContent) {
                if (key.includes('Contract')) {
                    Application.contractsCls.push(contractContent[key]);
                    const instance = new contractContent[key]();
                    const isPublic = Reflect.getMetadata(decorators_1.PUBLIC_METADATA, instance.constructor);
                    if (isPublic === true)
                        this.contracts.push(instance);
                }
            }
        }
    }
    static awaitModule(moduleName, cb, context) {
        if (_1.Module.hasModule(moduleName)) {
            cb.bind(context).call(context);
        }
        else {
            _1.Scope.addToArray(`_await_module_${moduleName}`, {
                cb,
                context,
            });
        }
    }
    static awaitService(serviceName, cb, context) {
        _1.Scope.addToArray(`_await_service_${serviceName}`, {
            cb,
            context,
        });
    }
    static getModel(modelName) {
        if (Application.models.has(modelName))
            return Application.models.get(modelName);
        throw new Error(`Could not load model '${modelName}'`);
    }
    static async generateModule() {
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
    ApplicationConfig, ContractsTranspile
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
        ${Application.appModule.providers.map((provider) => provider.name).join(', \n\t\t')}
    ],
    transpilers: [
        ApplicationTranspile,
        ContractsTranspile
    ]
});`;
            if (!fs.existsSync(path.dirname(outputPath)))
                fs.mkdirSync(path.dirname(outputPath), { recursive: true });
            await fs.writeFileSync(outputPath, moduleTemplate, 'utf8');
            const { ApplicationModule } = await Promise.resolve(`${outputPath}`).then(s => require(s));
            return ApplicationModule;
        }
        catch (e) {
            console.error(e);
            new _1.Logger('Application').error(e.message, 'generateModule');
            return null;
        }
    }
    getHttpAdapter() {
        return this.httpAdapter;
    }
    getUnderlyingHttpServer() {
        this.httpAdapter.getHttpServer();
    }
    getWSServer() {
        return this.wsServer;
    }
    static create(settings) {
        return new Application(settings);
    }
    static compile(settings) {
        return new Application(settings, true);
    }
    static exec(settings) {
        return new Application(settings, true).execProcess(settings);
    }
    static async execAsyncFn(settings, providerClass, functionName) {
        return new Promise(async (resolve, reject) => {
            try {
                const app = new Application(settings, true);
                await app.execProcess(settings);
                const provider = new providerClass();
                if (typeof provider[functionName] !== 'function')
                    throw new Error(`The function '${functionName}' was not found in the provider`);
                const result = await provider[functionName]();
                resolve(result);
            }
            catch (e) {
                reject(e);
            }
        });
    }
    static setHTTPMiddleware(cb) {
        Application.appModule.httpMiddlewares.push(cb);
    }
    static setHTTPInterceptor(cb) {
        Application.appModule.httpInterceptors.push(cb);
    }
    static setHTTPAfterRender(cb) {
        Application.appModule.httpAfterRender.push(cb);
    }
    static resolveProvider(providerCls) {
        const paramTypes = Reflect.getMetadata('design:paramtypes', providerCls) || [];
        const instances = paramTypes.map((paramType) => Application.instance.providersMap.get(paramType.name));
        const instance = new providerCls(...instances);
        return instance;
    }
    static getContract(contractName) {
        return Application.contractsCls.find((cls) => cls.name === contractName);
    }
    static getResolvers() {
        return Array.from(new Set(Application.instance.resolvers));
    }
    static getResolver(resolverName) {
        return Application.instance.resolvers.filter((cls) => cls.name === resolverName);
    }
}
exports.Application = Application;
Application.appModule = {
    controllers: [],
    providers: [],
    httpMiddlewares: [],
    httpInterceptors: [],
    httpAfterRender: [],
};
Application.contractsCls = [];
Application.models = new Map();
