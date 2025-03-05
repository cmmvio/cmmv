import { Module } from '@cmmv/core';

import { VaultConfig } from './vault.config';
import { VaultController } from './vault.controller';
import { VaultContract } from './vault.contract';
import { VaultService } from './vault.service';

export const VaultModule = new Module('vault', {
    configs: [VaultConfig],
    controllers: [VaultController],
    contracts: [VaultContract],
    providers: [VaultService],
});
