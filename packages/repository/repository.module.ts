import { Module } from '@cmmv/core';

import { RepositoryConfig } from './repository.config';
import { RepositoryController } from './repository.controller';
import { RepositoryTranspile } from './repository.transpiler';

export const RepositoryModule = new Module('repository', {
    configs: [RepositoryConfig],
    //controllers: [RepositoryController],
    transpilers: [RepositoryTranspile],
});
