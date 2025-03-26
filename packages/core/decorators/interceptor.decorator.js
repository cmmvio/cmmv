"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.Interceptor = Interceptor;
const application_1 = require("../application");
function Interceptor() {
    return (target, propertyKey, descriptor) => {
        application_1.Application.setHTTPInterceptor(descriptor.value);
    };
}
