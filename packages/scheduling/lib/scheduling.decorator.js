"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.CRON_METADATA = void 0;
exports.Cron = Cron;
const core_1 = require("@cmmv/core");
exports.CRON_METADATA = Symbol('CRON_METADATA');
function Cron(cronTime) {
    return (target, propertyKey, descriptor) => {
        const method = descriptor.value;
        Reflect.defineMetadata(exports.CRON_METADATA, cronTime, method);
        core_1.Scope.addToArray('__crons', { target, method, cronTime });
    };
}
