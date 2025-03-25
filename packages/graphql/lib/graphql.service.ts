import * as path from 'node:path';
import { cwd } from 'node:process';
import * as fg from 'fast-glob';
import { buildSchema } from 'type-graphql';

import {
    Application,
    Service,
    AbstractService,
    Logger,
    Hook,
    HooksType,
    Config,
} from '@cmmv/core';

import { ApolloServer } from '@apollo/server';
import { startStandaloneServer } from '@apollo/server/standalone';
import { authChecker } from './auth-checker';

@Service('graphql')
export class GraphQLService extends AbstractService {
    @Hook(HooksType.onInitialize)
    async startApolloServer() {
        const sourceDir = Config.get<string>('app.sourceDir', 'src');
        const serverHost = Config.get<string>('graphql.host', 'localhost');
        const serverPort = Config.get<number>('graphql.port', 4000);
        const blacklog = Config.get<boolean>('graphql.blacklog', false);
        const resolversDir = path.join(cwd(), sourceDir, 'resolvers');
        const resolversGeneratedDir = path.join(
            cwd(),
            '.generated',
            'resolvers',
        );

        const resolversFiles = await fg([
            `${resolversDir}/**/*.resolver.ts`,
            `${resolversGeneratedDir}/**/*.resolver.ts`,
        ]);

        const resolvers = await Promise.all(
            resolversFiles.map(async (file) => {
                const resolverModule = await import(file);
                const resolverContructor = Object.values(resolverModule)[0];
                return resolverContructor;
            }),
        );

        const modulesResolvers = Application.getResolvers();
        resolvers.push(...modulesResolvers);

        const schema = await buildSchema({
            //@ts-ignore
            resolvers,
            authChecker,
        });

        const server = new ApolloServer({ schema });

        const { url } = await startStandaloneServer(server, {
            listen: {
                port: serverPort,
                backlog: blacklog ? 1000 : undefined,
            },
            context: async ({ req }) => {
                return {
                    token: req.headers.authorization,
                    refreshToken:
                        req.headers['refresh-token'] ||
                        req.headers['RefreshToken'] ||
                        req.headers['refreshtoken'],
                    req,
                };
            },
        });

        new Logger('GraphQLService').log(
            `Server GraphQL successfully started on ${url}`,
        );
    }
}
