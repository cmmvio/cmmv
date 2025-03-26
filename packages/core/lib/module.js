"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.Module = void 0;
const scope_1 = require("./scope");
class Module {
    constructor(name, options) {
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
        try {
            this.contracts =
                options.contracts?.map((contractClass) => new contractClass()) || [];
        }
        catch { }
        Module.modules.set(name, this);
        if (scope_1.Scope.has(`_await_module_${name}`)) {
            const actions = scope_1.Scope.getArray(`_await_module_${name}`);
            if (actions.length > 0) {
                actions.map(({ cb, context }) => {
                    cb.bind(context).call(context);
                });
            }
        }
    }
    static hasModule(name) {
        return Module.modules.has(name);
    }
    static getModule(name) {
        return Module.modules.has(name) ? Module.modules.get(name) : null;
    }
    static loadTranspile(transpileRaw) {
        const transpile = new transpileRaw();
        return transpile;
    }
    getControllers() {
        return this.controllers;
    }
    getTranspilers() {
        return this.transpilers;
    }
    getSubmodules() {
        return this.submodules;
    }
    getContracts() {
        return this.contracts;
    }
    getContractsCls() {
        return this.contractsCls;
    }
    getProviders() {
        return this.providers;
    }
    getConfigsSchemas() {
        return this.configs;
    }
    getEntities() {
        return this.entities;
    }
    getModels() {
        return this.models;
    }
    getResolvers() {
        return this.resolvers;
    }
}
exports.Module = Module;
Module.modules = new Map();
