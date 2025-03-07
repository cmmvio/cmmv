import { Module } from '@cmmv/core';

import { AuthConfig } from './auth.config';
import { AuthTranspile } from './auth.transpiler';

import { GroupsContract, UserContract, SessionsContract } from '../contracts';

import {
    AuthOptService,
    AuthSessionsService,
    AuthService,
    AuthGroupsService,
} from '../services';

import {
    AuthOPTController,
    AuthController,
    AuthSessionsController,
    AuthGroupsController,
} from '../controllers';

export const AuthModule = new Module('auth', {
    configs: [AuthConfig],
    transpilers: [AuthTranspile],
    contracts: [GroupsContract, UserContract, SessionsContract],
    providers: [
        AuthOptService,
        AuthSessionsService,
        AuthService,
        AuthGroupsService,
    ],
    controllers: [
        AuthOPTController,
        AuthController,
        AuthSessionsController,
        AuthGroupsController,
    ],
});
