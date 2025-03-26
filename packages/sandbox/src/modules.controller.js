"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.ModulesController = void 0;
const tslib_1 = require("tslib");
const http_1 = require("@cmmv/http");
const auth_1 = require("@cmmv/auth");
const modules_service_1 = require("./modules.service");
let ModulesController = class ModulesController {
    constructor(modulesService) {
        this.modulesService = modulesService;
    }
    async getAllModules() {
        try {
            const modules = await this.modulesService.getAllModules();
            return {
                success: true,
                data: modules,
            };
        }
        catch (error) {
            return {
                success: false,
                message: 'Error retrieving modules',
                error: error.message,
            };
        }
    }
    async getInstalledModules() {
        try {
            const modules = await this.modulesService.getInstalledModules();
            return {
                success: true,
                data: modules,
            };
        }
        catch (error) {
            return {
                success: false,
                message: 'Error retrieving installed modules',
                error: error.message,
            };
        }
    }
    async getModulesByCategory() {
        try {
            const modules = await this.modulesService.getModulesByCategory();
            return {
                success: true,
                data: modules,
            };
        }
        catch (error) {
            return {
                success: false,
                message: 'Error retrieving modules by category',
                error: error.message,
            };
        }
    }
    async getModuleDetails(moduleName) {
        try {
            const module = await this.modulesService.getModuleDetails(moduleName);
            if (!module) {
                return {
                    success: false,
                    message: `Module '${moduleName}' not found`,
                };
            }
            return {
                success: true,
                data: module,
            };
        }
        catch (error) {
            return {
                success: false,
                message: 'Error retrieving module details',
                error: error.message,
            };
        }
    }
    async installModule(data) {
        try {
            const result = await this.modulesService.installModule(data.moduleName, data.dependencies);
            return {
                success: true,
                message: `Module ${data.moduleName} installed successfully`,
                data: result,
            };
        }
        catch (error) {
            return {
                success: false,
                message: `Failed to install module ${data.moduleName}`,
                error: error.message,
            };
        }
    }
    async installSubmodule(data) {
        try {
            const result = await this.modulesService.installSubmodule(data.moduleName, data.submoduleName, data.packageName);
            return {
                success: true,
                message: `Submodule ${data.submoduleName} installed successfully`,
                data: result,
            };
        }
        catch (error) {
            return {
                success: false,
                message: `Failed to install submodule ${data.submoduleName}`,
                error: error.message,
            };
        }
    }
    async getPackageManager() {
        try {
            const packageManager = this.modulesService.detectPackageManager();
            return {
                success: true,
                data: { packageManager },
            };
        }
        catch (error) {
            return {
                success: false,
                message: 'Error retrieving package manager',
                error: error.message,
            };
        }
    }
    async updateModule(data) {
        try {
            const result = await this.modulesService.updateModule(data.moduleName, data.dependencies);
            return {
                success: true,
                message: `Module ${data.moduleName} updated successfully`,
                data: result,
            };
        }
        catch (error) {
            return {
                success: false,
                message: `Failed to update module ${data.moduleName}`,
                error: error.message,
            };
        }
    }
    async getModuleStatus(moduleName) {
        try {
            const isEnabled = await this.modulesService.isModuleEnabled(moduleName);
            return {
                success: true,
                data: { enabled: isEnabled },
            };
        }
        catch (error) {
            return {
                success: false,
                message: 'Error checking module status',
                error: error.message,
            };
        }
    }
    async toggleModule(moduleName, data) {
        try {
            await this.modulesService.toggleModule(moduleName, data.enable);
            return {
                success: true,
                message: `Module ${moduleName} ${data.enable ? 'enabled' : 'disabled'} successfully`,
            };
        }
        catch (error) {
            return {
                success: false,
                message: `Failed to ${data.enable ? 'enable' : 'disable'} module ${moduleName}`,
                error: error.message,
            };
        }
    }
};
exports.ModulesController = ModulesController;
tslib_1.__decorate([
    (0, http_1.Get)({ exclude: true }),
    (0, auth_1.Auth)({ rootOnly: true }),
    tslib_1.__metadata("design:type", Function),
    tslib_1.__metadata("design:paramtypes", []),
    tslib_1.__metadata("design:returntype", Promise)
], ModulesController.prototype, "getAllModules", null);
tslib_1.__decorate([
    (0, http_1.Get)('installed', { exclude: true }),
    (0, auth_1.Auth)({ rootOnly: true }),
    tslib_1.__metadata("design:type", Function),
    tslib_1.__metadata("design:paramtypes", []),
    tslib_1.__metadata("design:returntype", Promise)
], ModulesController.prototype, "getInstalledModules", null);
tslib_1.__decorate([
    (0, http_1.Get)('categories', { exclude: true }),
    (0, auth_1.Auth)({ rootOnly: true }),
    tslib_1.__metadata("design:type", Function),
    tslib_1.__metadata("design:paramtypes", []),
    tslib_1.__metadata("design:returntype", Promise)
], ModulesController.prototype, "getModulesByCategory", null);
tslib_1.__decorate([
    (0, http_1.Get)(':name', { exclude: true }),
    (0, auth_1.Auth)({ rootOnly: true }),
    tslib_1.__param(0, (0, http_1.Param)('name')),
    tslib_1.__metadata("design:type", Function),
    tslib_1.__metadata("design:paramtypes", [String]),
    tslib_1.__metadata("design:returntype", Promise)
], ModulesController.prototype, "getModuleDetails", null);
tslib_1.__decorate([
    (0, http_1.Post)('install', { exclude: true }),
    (0, auth_1.Auth)({ rootOnly: true }),
    tslib_1.__param(0, (0, http_1.Body)()),
    tslib_1.__metadata("design:type", Function),
    tslib_1.__metadata("design:paramtypes", [Object]),
    tslib_1.__metadata("design:returntype", Promise)
], ModulesController.prototype, "installModule", null);
tslib_1.__decorate([
    (0, http_1.Post)('install-submodule', { exclude: true }),
    (0, auth_1.Auth)({ rootOnly: true }),
    tslib_1.__param(0, (0, http_1.Body)()),
    tslib_1.__metadata("design:type", Function),
    tslib_1.__metadata("design:paramtypes", [Object]),
    tslib_1.__metadata("design:returntype", Promise)
], ModulesController.prototype, "installSubmodule", null);
tslib_1.__decorate([
    (0, http_1.Get)('package-manager', { exclude: true }),
    (0, auth_1.Auth)({ rootOnly: true }),
    tslib_1.__metadata("design:type", Function),
    tslib_1.__metadata("design:paramtypes", []),
    tslib_1.__metadata("design:returntype", Promise)
], ModulesController.prototype, "getPackageManager", null);
tslib_1.__decorate([
    (0, http_1.Post)('update', { exclude: true }),
    (0, auth_1.Auth)({ rootOnly: true }),
    tslib_1.__param(0, (0, http_1.Body)()),
    tslib_1.__metadata("design:type", Function),
    tslib_1.__metadata("design:paramtypes", [Object]),
    tslib_1.__metadata("design:returntype", Promise)
], ModulesController.prototype, "updateModule", null);
tslib_1.__decorate([
    (0, http_1.Get)(':name/status', { exclude: true }),
    (0, auth_1.Auth)({ rootOnly: true }),
    tslib_1.__param(0, (0, http_1.Param)('name')),
    tslib_1.__metadata("design:type", Function),
    tslib_1.__metadata("design:paramtypes", [String]),
    tslib_1.__metadata("design:returntype", Promise)
], ModulesController.prototype, "getModuleStatus", null);
tslib_1.__decorate([
    (0, http_1.Post)(':name/toggle', { exclude: true }),
    (0, auth_1.Auth)({ rootOnly: true }),
    tslib_1.__param(0, (0, http_1.Param)('name')),
    tslib_1.__param(1, (0, http_1.Body)()),
    tslib_1.__metadata("design:type", Function),
    tslib_1.__metadata("design:paramtypes", [String, Object]),
    tslib_1.__metadata("design:returntype", Promise)
], ModulesController.prototype, "toggleModule", null);
exports.ModulesController = ModulesController = tslib_1.__decorate([
    (0, http_1.Controller)('modules'),
    tslib_1.__metadata("design:paramtypes", [modules_service_1.ModulesService])
], ModulesController);
