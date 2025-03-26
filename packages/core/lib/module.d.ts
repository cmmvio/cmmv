import { AbstractContract } from '../abstracts';
import { ITranspile } from './transpile';
import { ConfigSchema } from '../interfaces/config-shema.interface';
export interface IModuleOptions {
    devMode?: boolean;
    controllers?: Array<any>;
    providers?: Array<any>;
    transpilers?: Array<new () => ITranspile>;
    submodules?: Array<Module>;
    contracts?: Array<new () => AbstractContract>;
    configs?: Array<ConfigSchema>;
    entities?: Array<any>;
    models?: Array<any>;
    resolvers?: Array<any>;
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
export declare class Module implements IModule {
    static modules: Map<string, Module>;
    devMode: boolean;
    private controllers;
    private transpilers;
    private submodules;
    private contractsCls;
    private contracts;
    private providers;
    private configs;
    private entities;
    private models;
    private resolvers;
    constructor(name: string, options: IModuleOptions);
    static hasModule(name: string): boolean;
    static getModule(name: string): Module | null;
    static loadTranspile<T>(transpileRaw: new () => ITranspile): T;
    getControllers(): Array<any>;
    getTranspilers(): Array<new () => ITranspile>;
    getSubmodules(): Array<Module>;
    getContracts(): Array<any>;
    getContractsCls(): Array<any>;
    getProviders(): Array<any>;
    getConfigsSchemas(): Array<any>;
    getEntities(): Array<any>;
    getModels(): Array<any>;
    getResolvers(): Array<any>;
}
