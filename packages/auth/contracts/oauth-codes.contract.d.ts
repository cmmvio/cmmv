import { AbstractContract } from '@cmmv/core';
export declare class OAuthCodesContract extends AbstractContract {
    code: string;
    client_id: string;
    user_id: string;
    redirect_uri: string;
    scope: string;
    expires_at: number;
}
