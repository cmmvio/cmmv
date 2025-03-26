"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.AuthModule = void 0;
const core_1 = require("@cmmv/core");
const auth_config_1 = require("./auth.config");
const auth_transpiler_1 = require("./auth.transpiler");
const contracts_1 = require("../contracts");
const services_1 = require("../services");
const controllers_1 = require("../controllers");
exports.AuthModule = new core_1.Module('auth', {
    configs: [auth_config_1.AuthConfig],
    transpilers: [auth_transpiler_1.AuthTranspile],
    contracts: [
        contracts_1.GroupsContract,
        contracts_1.UserContract,
        contracts_1.SessionsContract,
        contracts_1.OAuthClientsContract,
        contracts_1.OAuthCodesContract,
        contracts_1.OAuthTokensContract,
        contracts_1.OAuth2Contract,
    ],
    providers: [
        services_1.AuthAutorizationService,
        services_1.AuthOptService,
        services_1.AuthSessionsService,
        services_1.AuthGroupsService,
        services_1.AuthUsersService,
        services_1.OAuth2Service,
    ],
    controllers: [
        controllers_1.AutorizationController,
        controllers_1.AuthOPTController,
        controllers_1.AuthSessionsController,
        controllers_1.AuthGroupsController,
        controllers_1.AuthUsersController,
        controllers_1.OAuth2Controller,
    ],
});
