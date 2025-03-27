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
    controllerName: 'OneTimeToken',
    protoPackage: 'auth',
    subPath: '/auth',
    generateController: false,
    generateBoilerplates: false,
    options: {
        tags: ['auth'],
        moduleContract: true,
        databaseSchemaName: 'auth_one_time_tokens',
        databaseTimestamps: true,
    },
})
export class OneTimeTokenContract extends AbstractContract {
    @ContractField({
        protoType: 'string',
        validations: [
            {
                type: 'IsString',
                message: 'Invalid user',
            },
        ],
        link: [
            {
                createRelationship: true,
                contract: UserContract,
                entityName: 'user',
                field: 'id',
            },
        ],
    })
    user: string;

    @ContractField({
        protoType: 'string',
        nullable: false,
        index: true,
    })
    tokenType: string;

    @ContractField({
        protoType: 'string',
        nullable: false,
        index: true,
    })
    token: string;

    @ContractField({
        protoType: 'int32',
        nullable: false,
        index: true,
    })
    expireAt: number;

    // Generate a one time token
    @ContractMessage({
        name: 'OneTimeTokenGenerateRequest',
        properties: {
            userId: {
                type: 'string',
                paramType: 'path',
                required: true,
            },
        },
    })
    OneTimeTokenGenerateRequest: {
        userId: string;
    };

    @ContractMessage({
        name: 'OneTimeTokenGenerateResponse',
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
            data: {
                type: 'string',
                paramType: 'body',
                required: false,
            },
        },
    })
    OneTimeTokenGenerateResponse: {
        success: boolean;
        message?: string;
        data?: string;
    };

    @ContractService({
        name: 'TokenGenerate',
        path: 'auth/one-time-token/generate/:userId',
        method: 'GET',
        auth: true,
        rootOnly: true,
        functionName: 'handlerOneTimeTokenGenerate',
        request: 'OneTimeTokenGenerateRequest',
        response: 'OneTimeTokenGenerateResponse',
        createBoilerplate: false,
    })
    OneTimeTokenGenerate: Function;

    // Validate a one time token
    @ContractMessage({
        name: 'OneTimeTokenValidateRequest',
        properties: {
            token: {
                type: 'string',
                paramType: 'path',
                required: true,
            },
            redirect: {
                type: 'string',
                paramType: 'query',
                required: false,
            },
        },
    })
    OneTimeTokenValidateRequest: {
        token: string;
        redirect?: string;
    };

    @ContractMessage({
        name: 'OneTimeTokenValidateResponse',
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
            data: {
                type: 'json',
                paramType: 'body',
                required: false,
            },
        },
    })
    OneTimeTokenValidateResponse: {
        success: boolean;
        message?: string;
        data?: object;
    };

    @ContractService({
        name: 'TokenValidate',
        path: 'auth/one-time-token/validate/:token',
        method: 'GET',
        auth: true,
        functionName: 'handlerOneTimeTokenValidate',
        request: 'OneTimeTokenValidateRequest',
        response: 'OneTimeTokenValidateResponse',
        createBoilerplate: false,
    })
    OneTimeTokenValidate: Function;
}
