import { Module } from '@cmmv/core';

import { SanboxController } from './sandbox.controller';
import { SandboxService } from './sandbox.service';

export const SandoxModule = new Module('sandbox', {
    controllers: [SanboxController],
    providers: [SandboxService],
});
