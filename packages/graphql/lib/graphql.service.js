"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.GraphQLService = void 0;
const tslib_1 = require("tslib");
const path = require("node:path");
const node_process_1 = require("node:process");
const fg = require("fast-glob");
const type_graphql_1 = require("type-graphql");
const core_1 = require("@cmmv/core");
const server_1 = require("@apollo/server");
const standalone_1 = require("@apollo/server/standalone");
const auth_checker_1 = require("./auth-checker");
let GraphQLService = class GraphQLService extends core_1.AbstractService {
    async startApolloServer() {
        const sourceDir = core_1.Config.get('app.sourceDir', 'src');
        const serverHost = core_1.Config.get('graphql.host', 'localhost');
        const serverPort = core_1.Config.get('graphql.port', 4000);
        const blacklog = core_1.Config.get('graphql.blacklog', false);
        const resolversDir = path.join((0, node_process_1.cwd)(), sourceDir, 'resolvers');
        const resolversGeneratedDir = path.join((0, node_process_1.cwd)(), '.generated', 'resolvers');
        const resolversFiles = await fg([
            `${resolversDir}/**/*.resolver.ts`,
            `${resolversGeneratedDir}/**/*.resolver.ts`,
        ]);
        const resolvers = await Promise.all(resolversFiles.map(async (file) => {
            const resolverModule = await Promise.resolve(`${file}`).then(s => require(s));
            const resolverContructor = Object.values(resolverModule)[0];
            return resolverContructor;
        }));
        const modulesResolvers = core_1.Application.getResolvers();
        resolvers.push(...modulesResolvers);
        const schema = await (0, type_graphql_1.buildSchema)({
            //@ts-ignore
            resolvers,
            authChecker: auth_checker_1.authChecker,
        });
        const server = new server_1.ApolloServer({ schema });
        const { url } = await (0, standalone_1.startStandaloneServer)(server, {
            listen: {
                port: serverPort,
                backlog: blacklog ? 1000 : undefined,
            },
            context: async ({ req }) => {
                return {
                    token: req.headers.authorization,
                    refreshToken: req.headers['refresh-token'] ||
                        req.headers['RefreshToken'] ||
                        req.headers['refreshtoken'],
                    req,
                };
            },
        });
        new core_1.Logger('GraphQLService').log(`Server GraphQL successfully started on ${url}`);
    }
};
exports.GraphQLService = GraphQLService;
tslib_1.__decorate([
    (0, core_1.Hook)(core_1.HooksType.onInitialize),
    tslib_1.__metadata("design:type", Function),
    tslib_1.__metadata("design:paramtypes", []),
    tslib_1.__metadata("design:returntype", Promise)
], GraphQLService.prototype, "startApolloServer", null);
exports.GraphQLService = GraphQLService = tslib_1.__decorate([
    (0, core_1.Service)('graphql')
], GraphQLService);
