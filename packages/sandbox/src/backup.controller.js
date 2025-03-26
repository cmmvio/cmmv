"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.BackupController = void 0;
const tslib_1 = require("tslib");
const http_1 = require("@cmmv/http");
const auth_1 = require("@cmmv/auth");
const backup_service_1 = require("./backup.service");
let BackupController = class BackupController {
    constructor(backupService) {
        this.backupService = backupService;
    }
    async createBackup() {
        try {
            const result = await this.backupService.createBackup();
            return {
                success: true,
                message: 'Backup created successfully',
                data: result.metadata,
            };
        }
        catch (error) {
            return {
                success: false,
                message: 'Error creating backup',
                error: error.message,
            };
        }
    }
    async listBackups() {
        try {
            const backups = await this.backupService.listBackups();
            return {
                success: true,
                data: backups,
            };
        }
        catch (error) {
            return {
                success: false,
                message: 'Error listing backups',
                error: error.message,
            };
        }
    }
    async downloadBackup(filename, res) {
        try {
            return await this.backupService.downloadBackupFile(filename, res);
        }
        catch (error) {
            return res.code(500).json({
                success: false,
                message: 'Error downloading backup',
                error: error.message,
            });
        }
    }
};
exports.BackupController = BackupController;
tslib_1.__decorate([
    (0, http_1.Post)({ exclude: true }),
    (0, auth_1.Auth)({ rootOnly: true }),
    tslib_1.__metadata("design:type", Function),
    tslib_1.__metadata("design:paramtypes", []),
    tslib_1.__metadata("design:returntype", Promise)
], BackupController.prototype, "createBackup", null);
tslib_1.__decorate([
    (0, http_1.Get)({ exclude: true }),
    (0, auth_1.Auth)({ rootOnly: true }),
    tslib_1.__metadata("design:type", Function),
    tslib_1.__metadata("design:paramtypes", []),
    tslib_1.__metadata("design:returntype", Promise)
], BackupController.prototype, "listBackups", null);
tslib_1.__decorate([
    (0, http_1.Get)('download/:filename', { exclude: true }),
    tslib_1.__param(0, (0, http_1.Param)('filename')),
    tslib_1.__param(1, (0, http_1.Response)()),
    tslib_1.__metadata("design:type", Function),
    tslib_1.__metadata("design:paramtypes", [String, Object]),
    tslib_1.__metadata("design:returntype", Promise)
], BackupController.prototype, "downloadBackup", null);
exports.BackupController = BackupController = tslib_1.__decorate([
    (0, http_1.Controller)('backups'),
    tslib_1.__metadata("design:paramtypes", [backup_service_1.BackupService])
], BackupController);
