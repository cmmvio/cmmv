import { Application } from '@cmmv/core';
import { RepositoryModule, Repository } from '@cmmv/repository';
import { VaultModule, VaultService } from '@cmmv/vault';

Application.execAsyncFn(
    {
        modules: [RepositoryModule, VaultModule],
        services: [Repository],
    },
    VaultService,
    'createKeys',
)
    .then((result) => {
        console.log(result);
    })
    .catch(console.error);
