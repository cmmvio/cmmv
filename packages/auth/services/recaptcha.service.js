"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.AuthRecaptchaService = void 0;
const tslib_1 = require("tslib");
const core_1 = require("@cmmv/core");
const http_1 = require("@cmmv/http");
let AuthRecaptchaService = class AuthRecaptchaService extends core_1.AbstractService {
    constructor(httpService) {
        super();
        this.httpService = httpService;
    }
    async validateRecaptcha(secret, validation) {
        try {
            const response = await fetch(`https://www.google.com/recaptcha/api/siteverify?secret=${secret}&response=${validation}`, { method: 'POST' });
            const data = await response.json();
            return data.success === true;
        }
        catch (error) {
            return false;
        }
    }
};
exports.AuthRecaptchaService = AuthRecaptchaService;
exports.AuthRecaptchaService = AuthRecaptchaService = tslib_1.__decorate([
    (0, core_1.Service)('auth_recaptcha'),
    tslib_1.__metadata("design:paramtypes", [http_1.HttpService])
], AuthRecaptchaService);
