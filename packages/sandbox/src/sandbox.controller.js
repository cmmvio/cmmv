"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.SandboxController = void 0;
const tslib_1 = require("tslib");
const path = require("node:path");
const fs = require("node:fs");
const node_process_1 = require("node:process");
const http_1 = require("@cmmv/http");
const core_1 = require("@cmmv/core");
const sandbox_service_1 = require("./sandbox.service");
let SandboxController = class SandboxController {
    constructor(sandboxService) {
        this.sandboxService = sandboxService;
    }
    async handlerIndex(res) {
        return res.render('sandbox', {
            wsPort: this.sandboxService.getWebSocketPort(),
        });
    }
    async handlerClientJavascript(res) {
        res.contentType('text/javascript').send(await fs.readFileSync(path.join(__dirname.replace('src', 'public'), 'sandbox.client.cjs'), 'utf-8'));
    }
    async handlerClientGraphQL(res) {
        res.contentType('text/javascript').send(await fs.readFileSync(path.join(__dirname.replace('src', 'public'), 'sandbox-graphql.client.cjs'), 'utf-8'));
    }
    async handlerClientDataTable(res) {
        res.contentType('text/javascript').send(await fs.readFileSync(path.join(__dirname.replace('src', 'public'), 'sandbox-datatable.client.cjs'), 'utf-8'));
    }
    async handlerLogs(res) {
        res.contentType('text/javascript').send(await fs.readFileSync(path.join(__dirname.replace('src', 'public'), 'sandbox-logs.client.cjs'), 'utf-8'));
    }
    async handlerFormBuilder(res) {
        res.contentType('text/javascript').send(await fs.readFileSync(path.join(__dirname.replace('src', 'public'), 'sandbox-formbuilder.client.cjs'), 'utf-8'));
    }
    async handlerBackup(res) {
        res.contentType('text/javascript').send(await fs.readFileSync(path.join(__dirname.replace('src', 'public'), 'sandbox-backup.client.cjs'), 'utf-8'));
    }
    async handlerModules(res) {
        res.contentType('text/javascript').send(await fs.readFileSync(path.join(__dirname.replace('src', 'public'), 'sandbox-modules.client.cjs'), 'utf-8'));
    }
    async handlerConfig(res) {
        res.contentType('text/javascript').send(await fs.readFileSync(path.join(__dirname.replace('src', 'public'), 'sandbox-config.client.cjs'), 'utf-8'));
    }
    async handlerSchema() {
        const schemaFilename = path.join((0, node_process_1.cwd)(), '.generated', 'schema.json');
        return fs.existsSync(schemaFilename)
            ? JSON.parse(await fs.readFileSync(schemaFilename, 'utf-8'))
            : {};
    }
    async heandlerCompile(schema) {
        return await this.sandboxService.compileContract(schema);
    }
    async handlerDelete(contractName) {
        await this.sandboxService.deleteContract(contractName);
        return 'ok';
    }
    async handlerRestart() {
        await this.sandboxService.restartApplication();
        return 'ok';
    }
};
exports.SandboxController = SandboxController;
tslib_1.__decorate([
    (0, http_1.Get)({ exclude: true }),
    tslib_1.__param(0, (0, http_1.Response)()),
    tslib_1.__metadata("design:type", Function),
    tslib_1.__metadata("design:paramtypes", [Object]),
    tslib_1.__metadata("design:returntype", Promise)
], SandboxController.prototype, "handlerIndex", null);
tslib_1.__decorate([
    (0, http_1.Get)('client.js', { exclude: true }),
    tslib_1.__param(0, (0, http_1.Response)()),
    tslib_1.__metadata("design:type", Function),
    tslib_1.__metadata("design:paramtypes", [Object]),
    tslib_1.__metadata("design:returntype", Promise)
], SandboxController.prototype, "handlerClientJavascript", null);
tslib_1.__decorate([
    (0, http_1.Get)('graphql.js', { exclude: true }),
    tslib_1.__param(0, (0, http_1.Response)()),
    tslib_1.__metadata("design:type", Function),
    tslib_1.__metadata("design:paramtypes", [Object]),
    tslib_1.__metadata("design:returntype", Promise)
], SandboxController.prototype, "handlerClientGraphQL", null);
tslib_1.__decorate([
    (0, http_1.Get)('datatable.js', { exclude: true }),
    tslib_1.__param(0, (0, http_1.Response)()),
    tslib_1.__metadata("design:type", Function),
    tslib_1.__metadata("design:paramtypes", [Object]),
    tslib_1.__metadata("design:returntype", Promise)
], SandboxController.prototype, "handlerClientDataTable", null);
tslib_1.__decorate([
    (0, http_1.Get)('logs.js', { exclude: true }),
    tslib_1.__param(0, (0, http_1.Response)()),
    tslib_1.__metadata("design:type", Function),
    tslib_1.__metadata("design:paramtypes", [Object]),
    tslib_1.__metadata("design:returntype", Promise)
], SandboxController.prototype, "handlerLogs", null);
tslib_1.__decorate([
    (0, http_1.Get)('formbuilder.js', { exclude: true }),
    tslib_1.__param(0, (0, http_1.Response)()),
    tslib_1.__metadata("design:type", Function),
    tslib_1.__metadata("design:paramtypes", [Object]),
    tslib_1.__metadata("design:returntype", Promise)
], SandboxController.prototype, "handlerFormBuilder", null);
tslib_1.__decorate([
    (0, http_1.Get)('backup.js', { exclude: true }),
    tslib_1.__param(0, (0, http_1.Response)()),
    tslib_1.__metadata("design:type", Function),
    tslib_1.__metadata("design:paramtypes", [Object]),
    tslib_1.__metadata("design:returntype", Promise)
], SandboxController.prototype, "handlerBackup", null);
tslib_1.__decorate([
    (0, http_1.Get)('modules.js', { exclude: true }),
    tslib_1.__param(0, (0, http_1.Response)()),
    tslib_1.__metadata("design:type", Function),
    tslib_1.__metadata("design:paramtypes", [Object]),
    tslib_1.__metadata("design:returntype", Promise)
], SandboxController.prototype, "handlerModules", null);
tslib_1.__decorate([
    (0, http_1.Get)('config.js', { exclude: true }),
    tslib_1.__param(0, (0, http_1.Response)()),
    tslib_1.__metadata("design:type", Function),
    tslib_1.__metadata("design:paramtypes", [Object]),
    tslib_1.__metadata("design:returntype", Promise)
], SandboxController.prototype, "handlerConfig", null);
tslib_1.__decorate([
    (0, http_1.Get)('schema', { exclude: true }),
    tslib_1.__metadata("design:type", Function),
    tslib_1.__metadata("design:paramtypes", []),
    tslib_1.__metadata("design:returntype", Promise)
], SandboxController.prototype, "handlerSchema", null);
tslib_1.__decorate([
    (0, http_1.Post)('compile', { exclude: true }),
    tslib_1.__param(0, (0, http_1.Body)()),
    tslib_1.__metadata("design:type", Function),
    tslib_1.__metadata("design:paramtypes", [core_1.IContract]),
    tslib_1.__metadata("design:returntype", Promise)
], SandboxController.prototype, "heandlerCompile", null);
tslib_1.__decorate([
    (0, http_1.Delete)(':contractName', { exclude: true }),
    tslib_1.__param(0, (0, http_1.Param)('contractName')),
    tslib_1.__metadata("design:type", Function),
    tslib_1.__metadata("design:paramtypes", [String]),
    tslib_1.__metadata("design:returntype", Promise)
], SandboxController.prototype, "handlerDelete", null);
tslib_1.__decorate([
    (0, http_1.Post)('restart', { exclude: true }),
    tslib_1.__metadata("design:type", Function),
    tslib_1.__metadata("design:paramtypes", []),
    tslib_1.__metadata("design:returntype", Promise)
], SandboxController.prototype, "handlerRestart", null);
exports.SandboxController = SandboxController = tslib_1.__decorate([
    (0, http_1.Controller)('sandbox'),
    tslib_1.__metadata("design:paramtypes", [sandbox_service_1.SandboxService])
], SandboxController);
