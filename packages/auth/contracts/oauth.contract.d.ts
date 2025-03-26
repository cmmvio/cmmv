import { AbstractContract } from '@cmmv/core';
export declare class OAuth2Contract extends AbstractContract {
    AuthorizationRequest: {
        response_type: string;
        client_id: string;
        redirect_uri: string;
        scope?: string;
        state?: string;
    };
    AuthorizationResponse: {
        code: string;
        state?: string;
    };
    Authorize: Function;
    TokenRequest: {
        grant_type: string;
        code?: string;
        refresh_token?: string;
        client_id: string;
        client_secret: string;
        redirect_uri?: string;
    };
    TokenResponse: {
        access_token: string;
        token_type: string;
        expires_in: number;
        refresh_token?: string;
    };
    Token: Function;
    TokenValidationRequest: {
        token: string;
    };
    TokenValidationResponse: {
        valid: boolean;
        user_id?: string;
        expires_in?: number;
    };
    ValidateToken: Function;
    TokenRevocationRequest: {
        token: string;
    };
    TokenRevocationResponse: {
        success: boolean;
        message?: string;
    };
    RevokeToken: Function;
}
