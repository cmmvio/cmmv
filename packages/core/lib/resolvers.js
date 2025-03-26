"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.Resolvers = void 0;
const abstracts_1 = require("../abstracts");
class Resolvers extends abstracts_1.Singleton {
    constructor() {
        super(...arguments);
        this.resolvers = new Map();
    }
    static add(namespace, fn) {
        const instance = Resolvers.getInstance();
        instance.resolvers.set(namespace, fn);
    }
    static async execute(namespace, ...args) {
        const instance = Resolvers.getInstance();
        const resolvers = instance.resolvers.get(namespace) || null;
        if (resolvers)
            return await resolvers(...args);
    }
    static has(namespace) {
        const instance = Resolvers.getInstance();
        return instance.resolvers.has(namespace);
    }
    static clear(namespace) {
        const instance = Resolvers.getInstance();
        instance.resolvers.delete(namespace);
    }
    static remove(namespace, fn) {
        const instance = Resolvers.getInstance();
        return instance.resolvers.delete(namespace);
    }
}
exports.Resolvers = Resolvers;
