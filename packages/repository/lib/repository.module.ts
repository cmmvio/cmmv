import { Module } from '@cmmv/core';

import { RepositoryConfig } from './repository.config';
import { RepositoryTranspile } from './repository.transpiler';

import { LogsContract } from '../contracts/logs.contract';
import { MigrationsContract } from '../contracts/migrations.contract';
import { SettingsContract } from '../contracts/settings.contract';

export const RepositoryModule = new Module('repository', {
    configs: [RepositoryConfig],
    transpilers: [RepositoryTranspile],
    contracts: [LogsContract, MigrationsContract, SettingsContract],
});
