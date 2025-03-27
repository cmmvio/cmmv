import {
    AbstractContract,
    Contract,
    ContractMessage,
    ContractService,
} from '@cmmv/core';

@Contract({
    namespace: 'Auth',
    controllerName: 'OAuth2',
    protoPackage: 'auth',
    subPath: '/auth',
    generateController: false,
    generateBoilerplates: false,
    auth: false,
    rootOnly: false,
    options: {
        tags: ['oauth2'],
    },
})
export class OAuth2Contract extends AbstractContract {
    @ContractMessage({
        name: 'AuthorizationRequest',
        properties: {
            response_type: { type: 'string', required: true },
            client_id: { type: 'string', required: true },
            redirect_uri: { type: 'string', required: true },
            scope: { type: 'string', required: false },
            state: { type: 'string', required: false },
        },
    })
    AuthorizationRequest: {
        response_type: string;
        client_id: string;
        redirect_uri: string;
        scope?: string;
        state?: string;
    };

    @ContractMessage({
        name: 'AuthorizationResponse',
        properties: {
            code: { type: 'string', required: true },
            state: { type: 'string', required: false },
        },
    })
    AuthorizationResponse: {
        code: string;
        state?: string;
    };

    @ContractService({
        name: 'Authorize',
        path: 'authorize',
        method: 'GET',
        auth: false,
        functionName: 'authorize',
        request: 'AuthorizationRequest',
        response: 'AuthorizationResponse',
        createBoilerplate: false,
    })
    Authorize: Function;

    // Token Request
    @ContractMessage({
        name: 'TokenRequest',
        properties: {
            grant_type: { type: 'string', required: true },
            code: { type: 'string', required: false },
            refresh_token: { type: 'string', required: false },
            client_id: { type: 'string', required: true },
            client_secret: { type: 'string', required: true },
            redirect_uri: { type: 'string', required: false },
        },
    })
    TokenRequest: {
        grant_type: string;
        code?: string;
        refresh_token?: string;
        client_id: string;
        client_secret: string;
        redirect_uri?: string;
    };

    // Token Response
    @ContractMessage({
        name: 'TokenResponse',
        properties: {
            access_token: { type: 'string', required: true },
            token_type: { type: 'string', required: true, default: 'Bearer' },
            expires_in: { type: 'int', required: true },
            refresh_token: { type: 'string', required: false },
        },
    })
    TokenResponse: {
        access_token: string;
        token_type: string;
        expires_in: number;
        refresh_token?: string;
    };

    @ContractService({
        name: 'Token',
        path: 'token',
        method: 'POST',
        auth: false,
        functionName: 'token',
        request: 'TokenRequest',
        response: 'TokenResponse',
        createBoilerplate: false,
    })
    Token: Function;

    // Token Validation Request
    @ContractMessage({
        name: 'TokenValidationRequest',
        properties: {
            token: { type: 'string', required: true },
        },
    })
    TokenValidationRequest: {
        token: string;
    };

    // Token Validation Response
    @ContractMessage({
        name: 'TokenValidationResponse',
        properties: {
            valid: { type: 'bool', required: true },
            user_id: { type: 'string', required: false },
            expires_in: { type: 'int', required: false },
        },
    })
    TokenValidationResponse: {
        valid: boolean;
        user_id?: string;
        expires_in?: number;
    };

    @ContractService({
        name: 'ValidateToken',
        path: 'validate',
        method: 'GET',
        auth: true,
        functionName: 'validateToken',
        request: 'TokenValidationRequest',
        response: 'TokenValidationResponse',
        createBoilerplate: false,
    })
    ValidateToken: Function;

    // Token Revocation Request
    @ContractMessage({
        name: 'TokenRevocationRequest',
        properties: {
            token: { type: 'string', required: true },
        },
    })
    TokenRevocationRequest: {
        token: string;
    };

    // Token Revocation Response
    @ContractMessage({
        name: 'TokenRevocationResponse',
        properties: {
            success: { type: 'bool', required: true },
            message: { type: 'string', required: false },
        },
    })
    TokenRevocationResponse: {
        success: boolean;
        message?: string;
    };

    @ContractService({
        name: 'RevokeToken',
        path: 'revoke',
        method: 'DELETE',
        auth: true,
        functionName: 'revokeToken',
        request: 'TokenRevocationRequest',
        response: 'TokenRevocationResponse',
        createBoilerplate: false,
    })
    RevokeToken: Function;
}
