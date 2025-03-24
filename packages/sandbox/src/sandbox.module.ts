import { Module } from '@cmmv/core';

import { SanboxController } from './sandbox.controller';
import { SandboxService } from './sandbox.service';

import { LogsController } from './logs.controller';
import { LogsService } from './logs.service';

import { BackupController } from './backup.controller';
import { BackupService } from './backup.service';

import { ModulesController } from './modules.controller';
import { ModulesService } from './modules.service';

export const SandoxModule = new Module('sandbox', {
    controllers: [
        SanboxController,
        LogsController,
        BackupController,
        ModulesController,
    ],
    providers: [SandboxService, LogsService, BackupService, ModulesService],
});
