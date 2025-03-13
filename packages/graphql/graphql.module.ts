import { Module } from '@cmmv/core';

import { GraphQLConfig } from './graphql.config';
import { GraphQLService } from './graphql.service';
import { GraphQLController } from './graphql.controller';
import { GraphQLTranspile } from './graphql.transpiler';
import { AuthResolver } from './auth-resolvers';

export const GraphQLModule = new Module('graphql', {
    configs: [GraphQLConfig],
    controllers: [GraphQLController],
    providers: [GraphQLService],
    transpilers: [GraphQLTranspile],
    resolvers: [...(Module.hasModule('auth') ? [AuthResolver] : [])],
});
