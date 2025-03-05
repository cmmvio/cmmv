import { Controller, Post, Body, Get, Param, Delete } from '@cmmv/http';

import { VaultService } from './vault.service';
import { VaultPayloadDTO } from './vault.interface';
import { Auth } from '@cmmv/auth';

@Controller('vault')
export class VaultController {
    constructor(private readonly vaultService: VaultService) {}

    @Post()
    @Auth({ rootOnly: true })
    async handlerInsertPayload(@Body() data: VaultPayloadDTO) {
        return this.vaultService.insert(data.key, data.payload);
    }

    @Get(':key')
    @Auth({ rootOnly: true })
    async handlerGetPayload(@Param('key') key) {
        return this.vaultService.get(key);
    }

    @Delete(':key')
    @Auth({ rootOnly: true })
    async handlerDeleteKey(@Param('key') key) {
        return this.vaultService.remove(key);
    }
}
