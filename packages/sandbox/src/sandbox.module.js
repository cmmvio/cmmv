"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.SandboxModule = void 0;
const core_1 = require("@cmmv/core");
const sandbox_controller_1 = require("./sandbox.controller");
const sandbox_service_1 = require("./sandbox.service");
const logs_controller_1 = require("./logs.controller");
const logs_service_1 = require("./logs.service");
const backup_controller_1 = require("./backup.controller");
const backup_service_1 = require("./backup.service");
const modules_controller_1 = require("./modules.controller");
const modules_service_1 = require("./modules.service");
const config_controller_1 = require("./config.controller");
const config_service_1 = require("./config.service");
exports.SandboxModule = new core_1.Module('sandbox', {
    devMode: true,
    controllers: [
        sandbox_controller_1.SandboxController,
        logs_controller_1.LogsController,
        backup_controller_1.BackupController,
        modules_controller_1.ModulesController,
        config_controller_1.ConfigController,
    ],
    providers: [
        sandbox_service_1.SandboxService,
        logs_service_1.LogsService,
        backup_service_1.BackupService,
        modules_service_1.ModulesService,
        config_service_1.ConfigService,
    ],
});
