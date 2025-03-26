"use strict";
//@see https://github.com/nestjs/nest/blob/master/packages/common/utils/shared.utils.ts
Object.defineProperty(exports, "__esModule", { value: true });
exports.isJSON = exports.isSymbol = exports.isEmpty = exports.isNil = exports.isConstructor = exports.isNumber = exports.isString = exports.isFunction = exports.stripEndSlash = exports.normalizePath = exports.addLeadingSlash = exports.isPlainObject = exports.isObject = exports.isUndefined = void 0;
/* eslint-disable @typescript-eslint/no-use-before-define */
const isUndefined = (obj) => typeof obj === 'undefined';
exports.isUndefined = isUndefined;
const isObject = (fn) => !(0, exports.isNil)(fn) && typeof fn === 'object';
exports.isObject = isObject;
const isPlainObject = (fn) => {
    if (!(0, exports.isObject)(fn))
        return false;
    const proto = Object.getPrototypeOf(fn);
    if (proto === null)
        return true;
    const ctor = Object.prototype.hasOwnProperty.call(proto, 'constructor') &&
        proto.constructor;
    return (typeof ctor === 'function' &&
        ctor instanceof ctor &&
        Function.prototype.toString.call(ctor) ===
            Function.prototype.toString.call(Object));
};
exports.isPlainObject = isPlainObject;
const addLeadingSlash = (path = '') => path.startsWith('/') ? path : '/' + path;
exports.addLeadingSlash = addLeadingSlash;
const normalizePath = (path = '') => path
    ? `/${path.replace(/^\/+/, '').replace(/\/+$/, '').replace(/\/+/g, '/')}`
    : '/';
exports.normalizePath = normalizePath;
const stripEndSlash = (path) => path.endsWith('/') ? path.slice(0, -1) : path;
exports.stripEndSlash = stripEndSlash;
const isFunction = (val) => typeof val === 'function';
exports.isFunction = isFunction;
const isString = (val) => typeof val === 'string';
exports.isString = isString;
const isNumber = (val) => typeof val === 'number';
exports.isNumber = isNumber;
const isConstructor = (val) => val === 'constructor';
exports.isConstructor = isConstructor;
const isNil = (val) => (0, exports.isUndefined)(val) || val === null;
exports.isNil = isNil;
const isEmpty = (array) => !(array && array.length > 0);
exports.isEmpty = isEmpty;
const isSymbol = (val) => typeof val === 'symbol';
exports.isSymbol = isSymbol;
const isJSON = (val) => {
    if (typeof val !== 'string')
        return false;
    try {
        JSON.parse(val);
        return true;
    }
    catch (e) {
        return false;
    }
};
exports.isJSON = isJSON;
