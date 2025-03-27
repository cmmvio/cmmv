import { Module } from '@cmmv/core';

import { AuthConfig } from './auth.config';
import { AuthTranspile } from './auth.transpiler';

import {
    GroupsContract,
    UserContract,
    SessionsContract,
    OneTimeTokenContract,
    OAuthClientsContract,
    OAuthCodesContract,
    OAuthTokensContract,
    OAuthAutorizationsContract,
    OAuth2Contract,
} from '../contracts';

import {
    AuthOptService,
    AuthSessionsService,
    AuthAutorizationService,
    AuthGroupsService,
    AuthUsersService,
    AuthOneTimeTokenService,
    AuthLocationService,
    AuthEmailService,
    OAuth2Service,
} from '../services';

import {
    AuthOPTController,
    AutorizationController,
    AuthSessionsController,
    AuthGroupsController,
    AuthUsersController,
    AuthOneTimeTokensController,
    OAuth2Controller,
} from '../controllers';

export const AuthModule = new Module('auth', {
    configs: [AuthConfig],
    transpilers: [AuthTranspile],
    contracts: [
        GroupsContract,
        UserContract,
        SessionsContract,
        OneTimeTokenContract,
        OAuthClientsContract,
        OAuthCodesContract,
        OAuthTokensContract,
        OAuthAutorizationsContract,
        OAuth2Contract,
    ],
    providers: [
        AuthOneTimeTokenService,
        AuthAutorizationService,
        AuthOptService,
        AuthSessionsService,
        AuthGroupsService,
        AuthUsersService,
        AuthLocationService,
        AuthEmailService,
        OAuth2Service,
    ],
    controllers: [
        AutorizationController,
        AuthOPTController,
        AuthSessionsController,
        AuthGroupsController,
        AuthUsersController,
        AuthOneTimeTokensController,
        OAuth2Controller,
    ],
});
