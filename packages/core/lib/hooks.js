"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.Hooks = exports.HooksType = void 0;
const abstracts_1 = require("../abstracts");
var HooksType;
(function (HooksType) {
    HooksType[HooksType["onPreInitialize"] = 0] = "onPreInitialize";
    HooksType[HooksType["onInitialize"] = 1] = "onInitialize";
    HooksType[HooksType["onListen"] = 2] = "onListen";
    HooksType[HooksType["onError"] = 3] = "onError";
    HooksType[HooksType["onHTTPServerInit"] = 4] = "onHTTPServerInit";
    HooksType[HooksType["Log"] = 5] = "Log";
})(HooksType || (exports.HooksType = HooksType = {}));
class Hooks extends abstracts_1.Singleton {
    constructor() {
        super(...arguments);
        this.events = new Map();
    }
    static add(event, fn) {
        const instance = Hooks.getInstance();
        if (!instance.events.has(event))
            instance.events.set(event, []);
        instance.events.get(event)?.push(fn);
    }
    static async execute(event, ...args) {
        const instance = Hooks.getInstance();
        const hooks = instance.events.get(event) || [];
        for (const fn of hooks)
            await fn(...args);
    }
    static has(event) {
        const instance = Hooks.getInstance();
        return instance.events.has(event);
    }
    static clear(event) {
        const instance = Hooks.getInstance();
        instance.events.delete(event);
    }
    static remove(event, fn) {
        const instance = Hooks.getInstance();
        const hooks = instance.events.get(event);
        if (hooks) {
            const index = hooks.indexOf(fn);
            if (index > -1) {
                hooks.splice(index, 1);
                instance.events.set(event, hooks);
                return true;
            }
        }
        return false;
    }
}
exports.Hooks = Hooks;
