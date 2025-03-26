"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.ConfigController = void 0;
const tslib_1 = require("tslib");
const http_1 = require("@cmmv/http");
const auth_1 = require("@cmmv/auth");
const config_service_1 = require("./config.service");
let ConfigController = class ConfigController {
    constructor(configService) {
        this.configService = configService;
    }
    async getConfig() {
        try {
            const config = await this.configService.readConfig();
            return {
                success: true,
                data: config,
            };
        }
        catch (error) {
            return {
                success: false,
                message: 'Error reading config',
                error: error.message,
            };
        }
    }
    async getModuleConfigs() {
        try {
            const moduleConfigs = await this.configService.getModuleConfigs();
            return {
                success: true,
                data: moduleConfigs,
            };
        }
        catch (error) {
            return {
                success: false,
                message: 'Error retrieving module configs',
                error: error.message,
            };
        }
    }
    async getConfigFile() {
        try {
            const content = await this.configService.getConfigFile();
            return {
                success: true,
                data: content,
            };
        }
        catch (error) {
            return {
                success: false,
                message: 'Error reading config file',
                error: error.message,
            };
        }
    }
    async saveConfigFile(body) {
        try {
            const success = await this.configService.saveConfigFile(body.content);
            return {
                success: true,
                message: 'Config file saved successfully',
            };
        }
        catch (error) {
            return {
                success: false,
                message: 'Error saving config file',
                error: error.message,
            };
        }
    }
    async getModuleConfig(moduleName) {
        try {
            const config = await this.configService.readConfig();
            return {
                success: true,
                data: config[moduleName] || {},
            };
        }
        catch (error) {
            return {
                success: false,
                message: `Error reading config for module ${moduleName}`,
                error: error.message,
            };
        }
    }
    async updateModuleConfig(moduleName, config) {
        try {
            const success = await this.configService.updateModuleConfig(moduleName, config);
            if (success) {
                return {
                    success: true,
                    message: `Configuration for ${moduleName} updated successfully`,
                };
            }
            else {
                return {
                    success: false,
                    message: `Failed to update configuration for ${moduleName}`,
                };
            }
        }
        catch (error) {
            return {
                success: false,
                message: `Error updating config for module ${moduleName}`,
                error: error.message,
            };
        }
    }
    async setConfigValue(moduleName, key, body) {
        try {
            const success = await this.configService.setConfigValue(moduleName, key, body.value);
            if (success) {
                return {
                    success: true,
                    message: `Configuration value ${moduleName}.${key} updated successfully`,
                };
            }
            else {
                return {
                    success: false,
                    message: `Failed to update configuration value ${moduleName}.${key}`,
                };
            }
        }
        catch (error) {
            return {
                success: false,
                message: `Error updating config value ${moduleName}.${key}`,
                error: error.message,
            };
        }
    }
};
exports.ConfigController = ConfigController;
tslib_1.__decorate([
    (0, http_1.Get)({ exclude: true }),
    (0, auth_1.Auth)({ rootOnly: true }),
    tslib_1.__metadata("design:type", Function),
    tslib_1.__metadata("design:paramtypes", []),
    tslib_1.__metadata("design:returntype", Promise)
], ConfigController.prototype, "getConfig", null);
tslib_1.__decorate([
    (0, http_1.Get)('modules', { exclude: true }),
    (0, auth_1.Auth)({ rootOnly: true }),
    tslib_1.__metadata("design:type", Function),
    tslib_1.__metadata("design:paramtypes", []),
    tslib_1.__metadata("design:returntype", Promise)
], ConfigController.prototype, "getModuleConfigs", null);
tslib_1.__decorate([
    (0, http_1.Get)('file', { exclude: true }),
    (0, auth_1.Auth)({ rootOnly: true }),
    tslib_1.__metadata("design:type", Function),
    tslib_1.__metadata("design:paramtypes", []),
    tslib_1.__metadata("design:returntype", Promise)
], ConfigController.prototype, "getConfigFile", null);
tslib_1.__decorate([
    (0, http_1.Post)('file', { exclude: true }),
    (0, auth_1.Auth)({ rootOnly: true }),
    tslib_1.__param(0, (0, http_1.Body)()),
    tslib_1.__metadata("design:type", Function),
    tslib_1.__metadata("design:paramtypes", [Object]),
    tslib_1.__metadata("design:returntype", Promise)
], ConfigController.prototype, "saveConfigFile", null);
tslib_1.__decorate([
    (0, http_1.Get)(':module', { exclude: true }),
    (0, auth_1.Auth)({ rootOnly: true }),
    tslib_1.__param(0, (0, http_1.Param)('module')),
    tslib_1.__metadata("design:type", Function),
    tslib_1.__metadata("design:paramtypes", [String]),
    tslib_1.__metadata("design:returntype", Promise)
], ConfigController.prototype, "getModuleConfig", null);
tslib_1.__decorate([
    (0, http_1.Post)(':module', { exclude: true }),
    (0, auth_1.Auth)({ rootOnly: true }),
    tslib_1.__param(0, (0, http_1.Param)('module')),
    tslib_1.__param(1, (0, http_1.Body)()),
    tslib_1.__metadata("design:type", Function),
    tslib_1.__metadata("design:paramtypes", [String, Object]),
    tslib_1.__metadata("design:returntype", Promise)
], ConfigController.prototype, "updateModuleConfig", null);
tslib_1.__decorate([
    (0, http_1.Post)(':module/:key', { exclude: true }),
    (0, auth_1.Auth)({ rootOnly: true }),
    tslib_1.__param(0, (0, http_1.Param)('module')),
    tslib_1.__param(1, (0, http_1.Param)('key')),
    tslib_1.__param(2, (0, http_1.Body)()),
    tslib_1.__metadata("design:type", Function),
    tslib_1.__metadata("design:paramtypes", [String, String, Object]),
    tslib_1.__metadata("design:returntype", Promise)
], ConfigController.prototype, "setConfigValue", null);
exports.ConfigController = ConfigController = tslib_1.__decorate([
    (0, http_1.Controller)('config'),
    tslib_1.__metadata("design:paramtypes", [config_service_1.ConfigService])
], ConfigController);
