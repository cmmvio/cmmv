"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const vitest_1 = require("vitest");
const singleton_abstract_js_1 = require("../../abstracts/singleton.abstract.js");
(0, vitest_1.describe)('Singleton', () => {
    let MySingleton;
    (0, vitest_1.beforeEach)(() => {
        MySingleton = class extends singleton_abstract_js_1.Singleton {
        };
    });
    (0, vitest_1.it)('should return the same instance when getInstance is called twice', () => {
        const instance1 = MySingleton.getInstance();
        const instance2 = MySingleton.getInstance();
        (0, vitest_1.expect)(instance1).toBe(instance2);
        (0, vitest_1.expect)(instance1).toBeInstanceOf(MySingleton);
    });
    (0, vitest_1.it)('should create a new instance after clearInstance is called', () => {
        const instance1 = MySingleton.getInstance();
        MySingleton.clearInstance();
        const instance2 = MySingleton.getInstance();
        (0, vitest_1.expect)(instance1).not.toBe(instance2);
        (0, vitest_1.expect)(instance2).toBeInstanceOf(MySingleton);
    });
    (0, vitest_1.it)('should maintain instance per subclass', () => {
        const AnotherSingleton = class extends singleton_abstract_js_1.Singleton {
        };
        const instance1 = MySingleton.getInstance();
        const instance2 = AnotherSingleton.getInstance();
        (0, vitest_1.expect)(instance1).not.toBe(instance2);
        (0, vitest_1.expect)(instance1).toBeInstanceOf(singleton_abstract_js_1.Singleton);
        (0, vitest_1.expect)(instance2).toBeInstanceOf(AnotherSingleton);
    });
    (0, vitest_1.it)('should throw an error if instantiation fails', () => {
        const ErrorSingleton = class extends singleton_abstract_js_1.Singleton {
            constructor() {
                super();
                throw new Error('Failed to initialize');
            }
        };
        (0, vitest_1.expect)(() => {
            ErrorSingleton.getInstance();
        }).toThrow('Failed to create an instance of ErrorSingleton: Error: Failed to initialize');
    });
    (0, vitest_1.it)('should handle multiple instances of different classes independently', () => {
        const AnotherSingleton = class extends singleton_abstract_js_1.Singleton {
        };
        const instance1 = MySingleton.getInstance();
        const instance2 = AnotherSingleton.getInstance();
        const instance3 = MySingleton.getInstance();
        const instance4 = AnotherSingleton.getInstance();
        (0, vitest_1.expect)(instance1).toBe(instance3);
        (0, vitest_1.expect)(instance2).toBe(instance4);
        (0, vitest_1.expect)(instance1).not.toBe(instance2);
    });
    (0, vitest_1.it)('should properly clear instance and create a new one', () => {
        const instance1 = MySingleton.getInstance();
        MySingleton.clearInstance();
        const instance2 = MySingleton.getInstance();
        (0, vitest_1.expect)(instance1).not.toBe(instance2);
        (0, vitest_1.expect)(instance2).toBeInstanceOf(MySingleton);
    });
    (0, vitest_1.it)('should not fail when clearing a non-existent instance', () => {
        const AnotherSingleton = class extends singleton_abstract_js_1.Singleton {
        };
        AnotherSingleton.clearInstance(); // No instance exists, but shouldn"t throw
        const instance = AnotherSingleton.getInstance();
        (0, vitest_1.expect)(instance).toBeInstanceOf(AnotherSingleton);
    });
});
