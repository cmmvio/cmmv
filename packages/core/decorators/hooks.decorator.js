"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.Hook = Hook;
const hooks_1 = require("../lib/hooks");
function Hook(event) {
    return function (target, propertyKey, descriptor) {
        const originalMethod = descriptor.value;
        if (typeof originalMethod !== 'function')
            throw new Error(`@Hook can only be used on methods.`);
        hooks_1.Hooks.add(event, async (...args) => {
            await originalMethod.apply(target, args);
        });
    };
}
