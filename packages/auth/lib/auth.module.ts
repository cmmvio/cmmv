import { Module } from '@cmmv/core';

import { AuthConfig } from './auth.config';
import { AuthTranspile } from './auth.transpiler';

import { GroupsContract, UserContract, SessionsContract } from '../contracts';

import {
    AuthOptService,
    AuthSessionsService,
    AuthAutorizationService,
    AuthGroupsService,
    AuthUsersService,
} from '../services';

import {
    AuthOPTController,
    AuthAutorizationController,
    AuthSessionsController,
    AuthGroupsController,
    AuthUsersController,
} from '../controllers';

export const AuthModule = new Module('auth', {
    configs: [AuthConfig],
    transpilers: [AuthTranspile],
    contracts: [GroupsContract, UserContract, SessionsContract],
    providers: [
        AuthAutorizationService,
        AuthOptService,
        AuthSessionsService,
        AuthGroupsService,
        AuthUsersService,
    ],
    controllers: [
        AuthAutorizationController,
        AuthOPTController,
        AuthSessionsController,
        AuthGroupsController,
        AuthUsersController,
    ],
});
