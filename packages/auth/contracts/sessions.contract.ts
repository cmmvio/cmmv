import {
    AbstractContract,
    Contract,
    ContractField,
    ContractMessage,
    ContractService,
} from '@cmmv/core';

import { UserContract } from './users.contract';

@Contract({
    namespace: 'Auth',
    controllerName: 'Sessions',
    protoPackage: 'auth',
    subPath: '/auth',
    generateController: false,
    options: {
        moduleContract: true,
        databaseSchemaName: 'auth_sessions',
        databaseTimestamps: true,
    },
})
export class SessionsContract extends AbstractContract {
    @ContractField({
        protoType: 'string',
        nullable: false,
        index: true,
        readOnly: true,
    })
    uuid: string;

    @ContractField({
        protoType: 'string',
        nullable: false,
        unique: true,
        index: true,
        exclude: true,
        readOnly: true,
    })
    fingerprint: string;

    @ContractField({
        protoType: 'string',
        objectType: 'object',
        entityType: 'UserEntity',
        protoRepeated: false,
        nullable: false,
        index: true,
        exclude: true,
        readOnly: true,
        link: [
            {
                contract: UserContract,
                contractName: 'UserContract',
                entityName: 'user',
                field: '_id',
            },
        ],
    })
    user: string;

    @ContractField({
        protoType: 'string',
        nullable: false,
        readOnly: true,
    })
    ipAddress: string;

    @ContractField({
        protoType: 'string',
        nullable: true,
        readOnly: true,
    })
    device: string;

    @ContractField({
        protoType: 'string',
        nullable: true,
        readOnly: true,
    })
    browser: string;

    @ContractField({
        protoType: 'string',
        nullable: true,
        readOnly: true,
    })
    os: string;

    @ContractField({
        protoType: 'bool',
        nullable: false,
        defaultValue: false,
    })
    revoked: boolean;

    @ContractField({
        protoType: 'string',
        nullable: true,
        readOnly: true,
    })
    userAgent: string;

    @ContractField({
        protoType: 'string',
        nullable: false,
        exclude: true,
        readOnly: true,
    })
    refreshToken: string;

    @ContractField({
        protoType: 'string',
        nullable: true,
        readOnly: true,
    })
    referer: string;

    @ContractField({
        protoType: 'string',
        nullable: true,
        readOnly: true,
    })
    origin: string;

    @ContractMessage({
        name: 'GetSessionsRequest',
        properties: {
            limit: {
                type: 'int',
                paramType: 'query',
                required: false,
            },
            offset: {
                type: 'int',
                paramType: 'query',
                required: false,
            },
            sortBy: {
                type: 'string',
                paramType: 'query',
                required: false,
            },
            sort: {
                type: 'string',
                paramType: 'query',
                required: false,
            },
        },
    })
    GetSessionsRequest: {
        limit?: number;
        offset?: number;
        sortBy?: string;
        sort?: string;
    };

    @ContractMessage({
        name: 'GetSessionsResponse',
        properties: {
            data: {
                type: 'any',
                paramType: 'body',
                required: true,
            },
            count: {
                type: 'int',
                paramType: 'body',
                required: true,
            },
            total: {
                type: 'int',
                paramType: 'body',
                required: true,
            },
        },
    })
    GetSessionsResponse: {
        data: any[];
        count: number;
        total: number;
    };

    @ContractService({
        name: 'GetSessions',
        path: '/sessions',
        method: 'GET',
        auth: true,
        functionName: 'getSessions',
        request: 'GetSessionsRequest',
        response: 'GetSessionsResponse',
        createBoilerplate: false,
    })
    GetSessions: Function;

    @ContractMessage({
        name: 'ValidateSessionRequest',
        properties: {
            token: {
                type: 'string',
                paramType: 'body',
                required: true,
            },
        },
    })
    ValidateSessionRequest: {
        token: string;
    };

    @ContractMessage({
        name: 'ValidateSessionResponse',
        properties: {
            valid: {
                type: 'bool',
                paramType: 'body',
                required: true,
            },
            user: {
                type: 'any',
                paramType: 'body',
                required: false,
            },
        },
    })
    ValidateSessionResponse: {
        valid: boolean;
        user?: any;
    };

    @ContractService({
        name: 'ValidateSession',
        path: 'sessions/validate',
        method: 'POST',
        auth: false,
        functionName: 'validateSession',
        request: 'ValidateSessionRequest',
        response: 'ValidateSessionResponse',
        createBoilerplate: false,
    })
    ValidateSession: Function;

    @ContractMessage({
        name: 'RevokeSessionRequest',
        properties: {
            sessionId: {
                type: 'string',
                paramType: 'body',
                required: true,
            },
        },
    })
    RevokeSessionRequest: {
        sessionId: string;
    };

    @ContractMessage({
        name: 'RevokeSessionResponse',
        properties: {
            success: {
                type: 'bool',
                paramType: 'body',
                required: true,
            },
            message: {
                type: 'string',
                paramType: 'body',
                required: false,
            },
        },
    })
    RevokeSessionResponse: {
        success: boolean;
        message?: string;
    };

    @ContractService({
        name: 'RevokeSession',
        path: 'sessions/revoke',
        method: 'POST',
        auth: true,
        functionName: 'revokeSession',
        request: 'RevokeSessionRequest',
        response: 'RevokeSessionResponse',
        createBoilerplate: false,
    })
    RevokeSession: Function;
}
