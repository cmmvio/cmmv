"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.Singleton = void 0;
class Singleton {
    static getInstance() {
        const className = this.name;
        let instance = Singleton.instances.get(className);
        if (!instance) {
            try {
                instance = new this();
                Singleton.instances.set(className, instance);
            }
            catch (error) {
                throw new Error(`Failed to create an instance of ${className}: ${error}`);
            }
        }
        return instance;
    }
    static clearInstance() {
        const className = this.name;
        Singleton.instances.delete(className);
    }
}
exports.Singleton = Singleton;
Singleton.instances = new Map();
