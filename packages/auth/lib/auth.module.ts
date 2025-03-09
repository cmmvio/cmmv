import { Module } from '@cmmv/core';

import { AuthConfig } from './auth.config';
import { AuthTranspile } from './auth.transpiler';

import {
    GroupsContract,
    UserContract,
    SessionsContract,
    OAuthClientsContract,
    OAuthCodesContract,
    OAuthTokensContract,
    OAuth2Contract,
} from '../contracts';

import {
    AuthOptService,
    AuthSessionsService,
    AuthAutorizationService,
    AuthGroupsService,
    AuthUsersService,
    OAuth2Service,
} from '../services';

import {
    AuthOPTController,
    AutorizationController,
    AuthSessionsController,
    AuthGroupsController,
    AuthUsersController,
    OAuth2Controller,
} from '../controllers';

export const AuthModule = new Module('auth', {
    configs: [AuthConfig],
    transpilers: [AuthTranspile],
    contracts: [
        GroupsContract,
        UserContract,
        SessionsContract,
        OAuthClientsContract,
        OAuthCodesContract,
        OAuthTokensContract,
        OAuth2Contract,
    ],
    providers: [
        AuthAutorizationService,
        AuthOptService,
        AuthSessionsService,
        AuthGroupsService,
        AuthUsersService,
        OAuth2Service,
    ],
    controllers: [
        AutorizationController,
        AuthOPTController,
        AuthSessionsController,
        AuthGroupsController,
        AuthUsersController,
        OAuth2Controller,
    ],
});
