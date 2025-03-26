import { AbstractContract } from '@cmmv/core';
export declare class OAuthClientsContract extends AbstractContract {
    client_id: string;
    client_secret: string;
    redirect_uris: string[];
    scope: string;
    enabled: boolean;
}
