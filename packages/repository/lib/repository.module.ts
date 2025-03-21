import { Module } from '@cmmv/core';

import { RepositoryConfig } from './repository.config';
import { RepositoryController } from './repository.controller';
import { RepositoryTranspile } from './repository.transpiler';

import { LogsContract } from '../contracts/logs.contract';
import { MigrationsContract } from '../contracts/migrations.contract';

import { LogsController } from './logs.controller';

export const RepositoryModule = new Module('repository', {
    configs: [RepositoryConfig],
    controllers: [LogsController],
    transpilers: [RepositoryTranspile],
    contracts: [LogsContract, MigrationsContract],
});
