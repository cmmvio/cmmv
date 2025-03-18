import { Application } from '@cmmv/core';
import { DefaultAdapter, DefaultHTTPModule } from '@cmmv/http';
import { ProtobufModule } from '@cmmv/protobuf';
import { WSModule, WSAdapter } from '@cmmv/ws';
import { RepositoryModule, Repository } from '@cmmv/repository';
import { SchedulingModule, SchedulingService } from '@cmmv/scheduling';
import { AuthModule } from '@cmmv/auth';
import { FormModule } from '@cmmv/form';
import { VaultModule } from '@cmmv/vault';
import { OpenAPIModule } from '@cmmv/openapi';
import { GraphQLModule } from '@cmmv/graphql';
import { SandoxModule } from '@cmmv/sandbox';

import { IndexModule } from './index.module';

Application.create({
    httpAdapter: DefaultAdapter,
    wsAdapter: WSAdapter,
    modules: [
        DefaultHTTPModule,
        ProtobufModule,
        WSModule,
        RepositoryModule,
        SchedulingModule,
        AuthModule,
        FormModule,
        VaultModule,
        OpenAPIModule,
        GraphQLModule,
        SandoxModule,
        IndexModule,
    ],
    providers: [Repository, SchedulingService],
});
