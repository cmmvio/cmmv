import { AbstractContract } from '../abstracts';
import { ITranspile } from './transpile';
import { ConfigSchema } from '../interfaces/config-shema.interface';
import { Scope } from './scope';

export interface IModuleOptions {
    controllers?: Array<any>;
    providers?: Array<any>;
    transpilers?: Array<new () => ITranspile>;
    submodules?: Array<Module>;
    contracts?: Array<new () => AbstractContract>;
    configs?: Array<ConfigSchema>;
    entities?: Array<any>;
    models?: Array<any>;
}

export interface IModule {
    getControllers(): Array<any>;
    getTranspilers(): Array<new () => ITranspile>;
    getSubmodules(): Array<Module>;
    getContracts(): Array<AbstractContract>;
    getProviders(): Array<any>;
    getConfigsSchemas(): Array<any>;
    getEntities(): Array<any>;
    getModels(): Array<any>;
}

export class Module implements IModule {
    public static modules: Map<string, Module> = new Map<string, Module>();

    private controllers: Array<any>;
    private transpilers: Array<new () => ITranspile>;
    private submodules: Array<Module>;
    private contracts: Array<any>;
    private providers: Array<any>;
    private configs: Array<any>;
    private entities: Array<any>;
    private models: Array<any>;

    constructor(name: string, options: IModuleOptions) {
        this.providers = options.providers || [];
        this.controllers = options.controllers || [];
        this.transpilers = options.transpilers || [];
        this.submodules = options.submodules || [];
        this.configs = options.configs || [];
        this.entities = options.entities || [];
        this.models = options.models || [];
        this.contracts =
            options.contracts?.map((contractClass) => new contractClass()) ||
            [];

        Module.modules.set(name, this);

        if (Scope.has(`_await_module_${name}`)) {
            const actions = Scope.getArray(`_await_module_${name}`);

            if (actions.length > 0) {
                actions.map(({ cb, context }) => {
                    cb.bind(context).call(context);
                });
            }
        }
    }

    public static hasModule(name: string): boolean {
        return Module.modules.has(name);
    }

    public static getModule(name: string): Module | null {
        return Module.modules.has(name) ? Module.modules.get(name) : null;
    }

    public static loadTranspile<T>(transpileRaw: new () => ITranspile) {
        const transpile = new transpileRaw();
        return transpile as T;
    }

    public getControllers(): Array<any> {
        return this.controllers;
    }

    public getTranspilers(): Array<new () => ITranspile> {
        return this.transpilers;
    }

    public getSubmodules(): Array<Module> {
        return this.submodules;
    }

    public getContracts(): Array<any> {
        return this.contracts;
    }

    public getProviders(): Array<any> {
        return this.providers;
    }

    public getConfigsSchemas(): Array<any> {
        return this.configs;
    }

    public getEntities(): Array<any> {
        return this.entities;
    }

    public getModels(): Array<any> {
        return this.models;
    }
}
