import './configEnv';

import { Application } from '@cmmv/core';
import { DefaultAdapter, DefaultHTTPModule } from '@cmmv/http';
import { ProtobufModule } from '@cmmv/protobuf';
import { WSModule, WSAdapter } from '@cmmv/ws';
import { RepositoryModule, Repository } from '@cmmv/repository';
import { AuthModule } from '@cmmv/auth';
import { OpenAPIModule } from '@cmmv/openapi';
import { GraphQLModule } from '@cmmv/graphql';
import { SandboxModule } from '@cmmv/sandbox';
import { EmailModule } from '@cmmv/email';

import { IndexModule } from './modules/index.module';

Application.create({
    httpAdapter: DefaultAdapter,
    wsAdapter: WSAdapter,
    modules: [
        DefaultHTTPModule,
        ProtobufModule,
        WSModule,
        RepositoryModule,
        AuthModule,
        OpenAPIModule,
        GraphQLModule,
        SandboxModule,
        EmailModule,
        //ThrottlerModule,
        IndexModule,
    ],
    providers: [Repository],
});
