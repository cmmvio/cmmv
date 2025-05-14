import { Application } from '@cmmv/core';
import { DefaultHTTPModule } from '@cmmv/http';
import { ProtobufModule } from '@cmmv/protobuf';
import { WSModule } from '@cmmv/ws';
import { RepositoryModule, Repository } from '@cmmv/repository';
import { CacheModule, CacheService } from '@cmmv/cache';
import { AuthModule } from '@cmmv/auth';

Application.compile({
    modules: [
        DefaultHTTPModule,
        ProtobufModule,
        WSModule,
        RepositoryModule,
        CacheModule,
        AuthModule,
    ],
    services: [Repository, CacheService],
});
