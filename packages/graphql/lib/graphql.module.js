"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.GraphQLModule = void 0;
const core_1 = require("@cmmv/core");
const graphql_config_1 = require("./graphql.config");
const graphql_service_1 = require("./graphql.service");
const graphql_controller_1 = require("./graphql.controller");
const graphql_transpiler_1 = require("./graphql.transpiler");
const auth_resolvers_1 = require("./auth-resolvers");
exports.GraphQLModule = new core_1.Module('graphql', {
    configs: [graphql_config_1.GraphQLConfig],
    controllers: [graphql_controller_1.GraphQLController],
    providers: [graphql_service_1.GraphQLService],
    transpilers: [graphql_transpiler_1.GraphQLTranspile],
    resolvers: [...(core_1.Module.hasModule('auth') ? [auth_resolvers_1.AuthResolver] : [])],
});
