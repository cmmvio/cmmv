import { Module } from '@cmmv/core';

import { SanboxController } from './sandbox.controller';
import { SandboxService } from './sandbox.service';

import { LogsController } from './logs.controller';
import { LogsService } from './logs.service';

import { BackupController } from './backup.controller';
import { BackupService } from './backup.service';

export const SandoxModule = new Module('sandbox', {
    controllers: [SanboxController, LogsController, BackupController],
    providers: [SandboxService, LogsService, BackupService],
});
