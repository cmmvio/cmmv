import { Module } from '@cmmv/core';

import { SandboxController } from './sandbox.controller';
import { SandboxService } from './sandbox.service';

import { LogsController } from './logs.controller';
import { LogsService } from './logs.service';

import { BackupController } from './backup.controller';
import { BackupService } from './backup.service';

import { ModulesController } from './modules.controller';
import { ModulesService } from './modules.service';

import { ConfigController } from './config.controller';
import { ConfigService } from './config.service';

export const SandboxModule = new Module('sandbox', {
    devMode: true,
    controllers: [
        SandboxController,
        LogsController,
        BackupController,
        ModulesController,
        ConfigController,
    ],
    providers: [
        SandboxService,
        LogsService,
        BackupService,
        ModulesService,
        ConfigService,
    ],
});
