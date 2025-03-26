"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.LogsController = void 0;
const tslib_1 = require("tslib");
const http_1 = require("@cmmv/http");
const auth_1 = require("@cmmv/auth");
const logs_service_1 = require("./logs.service");
let LogsController = class LogsController {
    async getLogs(queries) {
        return logs_service_1.LogsService.getLogs(queries);
    }
    async getLog(logId) {
        return logs_service_1.LogsService.getLog(logId);
    }
};
exports.LogsController = LogsController;
tslib_1.__decorate([
    (0, http_1.Get)({ exclude: true }),
    (0, auth_1.Auth)({ rootOnly: true }),
    tslib_1.__param(0, (0, http_1.Queries)()),
    tslib_1.__metadata("design:type", Function),
    tslib_1.__metadata("design:paramtypes", [Object]),
    tslib_1.__metadata("design:returntype", Promise)
], LogsController.prototype, "getLogs", null);
tslib_1.__decorate([
    (0, http_1.Get)(':logId', { exclude: true }),
    (0, auth_1.Auth)({ rootOnly: true }),
    tslib_1.__param(0, (0, http_1.Param)('logId')),
    tslib_1.__metadata("design:type", Function),
    tslib_1.__metadata("design:paramtypes", [String]),
    tslib_1.__metadata("design:returntype", Promise)
], LogsController.prototype, "getLog", null);
exports.LogsController = LogsController = tslib_1.__decorate([
    (0, http_1.Controller)('logs')
], LogsController);
