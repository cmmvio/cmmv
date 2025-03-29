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
        moduleContract: true,
    },
})
export class OAuth2Contract extends AbstractContract {
    // Auth Query para renderização da página de autenticação
    @ContractMessage({
        name: 'OAuthAuthQuery',
        properties: {
            client_id: { type: 'string', required: true },
            redirect_uri: { type: 'string', required: true },
            response_type: { type: 'string', required: true },
            scope: { type: 'string', required: false },
            state: { type: 'string', required: true },
        },
    })
    OAuthAuthQuery: {
        client_id: string;
        redirect_uri: string;
        response_type: string;
        scope?: string;
        state: string;
    };

    @ContractMessage({
        name: 'OAuthAuthResponse',
        properties: {
            content: { type: 'string', required: true },
        },
    })
    OAuthAuthResponse: {
        content: string;
    };

    @ContractService({
        name: 'Auth',
        path: 'oauth/auth',
        method: 'GET',
        auth: false,
        functionName: 'auth',
        request: 'OAuthAuthQuery',
        response: 'OAuthAuthResponse',
        createBoilerplate: false,
    })
    OAuthAuth: Function;

    // Aprovação de autorização
    @ContractMessage({
        name: 'OAuthApproveRequest',
        properties: {
            client_id: { type: 'string', required: true },
            redirect_uri: { type: 'string', required: true },
            response_type: { type: 'string', required: true },
            scope: { type: 'string', required: true },
            state: { type: 'string', required: true },
            origin: { type: 'string', required: false },
            referer: { type: 'string', required: false },
            agent: { type: 'string', required: false },
        },
    })
    OAuthApproveRequest: {
        client_id: string;
        redirect_uri: string;
        response_type: string;
        scope: string;
        state: string;
        origin?: string;
        referer?: string;
        agent?: string;
    };

    @ContractMessage({
        name: 'OAuthApproveResponse',
        properties: {
            success: { type: 'bool', required: true },
            message: { type: 'string', required: false },
            result: {
                type: 'json',
                required: false,
            },
        },
    })
    OAuthApproveResponse: {
        success: boolean;
        message?: string;
        result?: {
            code?: string;
            state?: string;
            response_type?: string;
            redirect_uri?: string;
            access_token?: string;
            token_type?: string;
            expires_in?: number;
        };
    };

    @ContractService({
        name: 'Approve',
        path: 'oauth/approve',
        method: 'POST',
        auth: true,
        functionName: 'authorize',
        request: 'OAuthApproveRequest',
        response: 'OAuthApproveResponse',
        createBoilerplate: false,
    })
    OAuthApprove: Function;

    @ContractMessage({
        name: 'OAuthHandlerQuery',
        properties: {
            code: { type: 'string', required: true },
            state: { type: 'string', required: true },
            client_secret: { type: 'string', required: true },
            redirect_uri: { type: 'string', required: false },
        },
    })
    OAuthHandlerQuery: {
        code: string;
        state: string;
        client_secret: string;
        redirect_uri?: string;
    };

    @ContractMessage({
        name: 'OAuthHandlerResponse',
        properties: {
            token: { type: 'string', required: false },
            refreshToken: { type: 'string', required: false },
        },
    })
    OAuthHandlerResponse: {
        token?: string;
        refreshToken?: string;
    };

    @ContractService({
        name: 'Handler',
        path: 'oauth/handler',
        method: 'GET',
        auth: false,
        functionName: 'handler',
        request: 'OAuthHandlerQuery',
        response: 'OAuthHandlerResponse',
        createBoilerplate: false,
    })
    OAuthHandler: Function;

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

    @ContractMessage({
        name: 'TokenResponse',
        properties: {
            access_token: { type: 'string', required: true },
            token_type: { type: 'string', required: true, default: 'Bearer' },
            expires_in: { type: 'int32', required: true },
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
        path: 'oauth/token',
        method: 'POST',
        auth: false,
        functionName: 'token',
        request: 'TokenRequest',
        response: 'TokenResponse',
        createBoilerplate: false,
    })
    Token: Function;

    @ContractMessage({
        name: 'TokenValidationRequest',
        properties: {
            token: { type: 'string', required: true },
        },
    })
    TokenValidationRequest: {
        token: string;
    };

    @ContractMessage({
        name: 'TokenValidationResponse',
        properties: {
            valid: { type: 'bool', required: true },
            user_id: { type: 'string', required: false },
            expires_in: { type: 'int32', required: false },
        },
    })
    TokenValidationResponse: {
        valid: boolean;
        user_id?: string;
        expires_in?: number;
    };

    @ContractService({
        name: 'ValidateToken',
        path: 'oauth/validate',
        method: 'GET',
        auth: true,
        functionName: 'validateToken',
        request: 'TokenValidationRequest',
        response: 'TokenValidationResponse',
        createBoilerplate: false,
    })
    ValidateToken: Function;

    @ContractMessage({
        name: 'TokenRevocationRequest',
        properties: {
            token: { type: 'string', required: true },
        },
    })
    TokenRevocationRequest: {
        token: string;
    };

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
        path: 'oauth/revoke',
        method: 'DELETE',
        auth: true,
        functionName: 'revokeToken',
        request: 'TokenRevocationRequest',
        response: 'TokenRevocationResponse',
        createBoilerplate: false,
    })
    RevokeToken: Function;
}
