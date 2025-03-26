"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.Resolver = Resolver;
const resolvers_1 = require("../lib/resolvers");
function Resolver(namespace) {
    return function (target, propertyKey, descriptor) {
        const originalMethod = descriptor.value;
        if (typeof originalMethod !== 'function')
            throw new Error(`@Resolver can only be used on methods.`);
        resolvers_1.Resolvers.add(namespace, async (...args) => {
            return await originalMethod.apply(target, args);
        });
    };
}
