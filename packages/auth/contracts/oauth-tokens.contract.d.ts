import { AbstractContract } from '@cmmv/core';
export declare class OAuthTokensContract extends AbstractContract {
    access_token: string;
    refresh_token?: string;
    client_id: string;
    user_id: string;
    scope: string;
    expires_at: number;
}
