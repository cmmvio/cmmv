"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.ThrottlerException = exports.throttlerMessage = void 0;
const http_1 = require("@cmmv/http");
exports.throttlerMessage = 'ThrottlerException: Too Many Requests';
class ThrottlerException extends http_1.HttpException {
    constructor(message = exports.throttlerMessage) {
        super(message, http_1.HttpStatus.TOO_MANY_REQUESTS);
    }
}
exports.ThrottlerException = ThrottlerException;
