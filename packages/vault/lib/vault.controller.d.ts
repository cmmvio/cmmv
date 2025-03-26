import { VaultService } from './vault.service';
import { VaultPayloadDTO } from './vault.interface';
export declare class VaultController {
    private readonly vaultService;
    constructor(vaultService: VaultService);
    handlerInsertPayload(data: VaultPayloadDTO): Promise<import("@cmmv/repository").IInsertResponse>;
    handlerGetPayload(key: any): Promise<string | object>;
    handlerDeleteKey(key: any): Promise<object>;
}
