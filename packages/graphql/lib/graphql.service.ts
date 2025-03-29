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
import GraphQLJSON from 'graphql-type-json';

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

        const resolvers = [];
        for (const file of resolversFiles) {
            try {
                const resolverModule = await import(file);

                for (const key in resolverModule) {
                    const resolverClass = resolverModule[key];

                    if (
                        typeof resolverClass === 'function' &&
                        resolverClass.prototype
                    )
                        resolvers.push(resolverClass);
                }
            } catch (error) {
                console.error(`Error loading resolver from ${file}:`, error);
            }
        }

        const modulesResolvers = Application.getResolvers();
        resolvers.push(...modulesResolvers);

        try {
            const schema = await buildSchema({
                resolvers: resolvers as [Function, ...Function[]],
                authChecker,
                nullableByDefault: true,
                validate: false,
                orphanedTypes: [GraphQLJSON as unknown as Function],
            });

            const server = new ApolloServer({
                schema,
                introspection: true,
                includeStacktraceInErrorResponses: true,
                formatError: (error) => {
                    console.error('GraphQL Error:', error);
                    return {
                        message: error.message,
                        path: error.path,
                        extensions: error.extensions,
                    };
                },
            });

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
        } catch (error) {
            console.error(
                'Error building GraphQL schema or starting server:',
                error,
            );
            throw error;
        }
    }
}
