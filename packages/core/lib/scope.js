"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.Scope = void 0;
const abstracts_1 = require("../abstracts");
class Scope extends abstracts_1.Singleton {
    constructor() {
        super(...arguments);
        this.data = new Map();
    }
    static set(name, data) {
        const scope = Scope.getInstance();
        if (!scope.data.has(name)) {
            scope.data.set(name, data);
            return true;
        }
        return false;
    }
    static has(name) {
        const scope = Scope.getInstance();
        return scope.data.has(name);
    }
    static get(name) {
        const scope = Scope.getInstance();
        return scope.data.has(name) ? scope.data.get(name) : null;
    }
    static clear(name) {
        const scope = Scope.getInstance();
        scope.data.delete(name);
    }
    static addToArray(name, value) {
        const scope = Scope.getInstance();
        const array = scope.data.get(name) || [];
        if (Array.isArray(array)) {
            array.push(value);
            scope.data.set(name, array);
            return true;
        }
        return false;
    }
    static removeFromArray(name, value) {
        const scope = Scope.getInstance();
        const array = scope.data.get(name);
        if (Array.isArray(array)) {
            const index = array.indexOf(value);
            if (index > -1) {
                array.splice(index, 1);
                scope.data.set(name, array);
                return true;
            }
        }
        return false;
    }
    static getArray(name) {
        const scope = Scope.getInstance();
        const array = scope.data.get(name);
        if (Array.isArray(array))
            return array;
        return null;
    }
    static getArrayFromIndex(name, index) {
        const scope = Scope.getInstance();
        const array = scope.data.get(name);
        if (Array.isArray(array) && array.length >= index)
            return array[index];
        return null;
    }
}
exports.Scope = Scope;
