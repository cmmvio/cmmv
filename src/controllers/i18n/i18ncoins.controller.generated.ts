/**                                                                               
    **********************************************
    This script was generated automatically by CMMV.
    It is recommended not to modify this file manually, 
    as it may be overwritten by the application.
    **********************************************
**/

import { Cache, CacheService } from '@cmmv/cache';
import { Auth } from '@cmmv/auth';

import {
    Controller,
    Get,
    Post,
    Put,
    Delete,
    Queries,
    Param,
    Body,
    Req,
} from '@cmmv/http';

import {
    I18nCoins,
    I18nCoinsFastSchema,
} from '../../models/i18n/i18ncoins.model';

import { I18nCoinsService } from '../../services/i18n/i18ncoins.service';

@Controller('/i18n/coins')
export class I18nCoinsControllerGenerated {
    constructor(private readonly i18ncoinsservice: I18nCoinsService) {}

    @Get()
    @Auth('i18ncoins:get')
    @Cache('coins:getAll', {
        ttl: 3000,
        compress: true,
        schema: I18nCoinsFastSchema,
    })
    async getAll(
        @Queries() queries: any,
        @Req() req,
    ): Promise<I18nCoins[] | null> {
        let result = await this.i18ncoinsservice.getAll(queries, req);
        return result;
    }

    @Get(':id')
    @Auth('i18ncoins:get')
    @Cache('coins:getAll', {
        ttl: 3000,
        compress: true,
        schema: I18nCoinsFastSchema,
    })
    async getById(
        @Param('id') id: string,
        @Req() req,
    ): Promise<I18nCoins | null> {
        let result = await this.i18ncoinsservice.getById(id, req);
        return result;
    }

    @Post()
    @Auth('i18ncoins:insert')
    async add(@Body() item: I18nCoins, @Req() req): Promise<I18nCoins | null> {
        let result = await this.i18ncoinsservice.add(item, req);
        CacheService.del('coins:getAll');
        return result;
    }

    @Put(':id')
    @Auth('i18ncoins:update')
    async update(
        @Param('id') id: string,
        @Body() item: I18nCoins,
        @Req() req,
    ): Promise<{ success: boolean; affected: number }> {
        let result = await this.i18ncoinsservice.update(id, item, req);
        CacheService.del(`coins:${id}`);
        CacheService.del('coins:getAll');
        return result;
    }

    @Delete(':id')
    @Auth('i18ncoins:delete')
    async delete(
        @Param('id') id: string,
        @Req() req,
    ): Promise<{ success: boolean; affected: number }> {
        let result = await this.i18ncoinsservice.delete(id, req);
        CacheService.del(`coins:${id}`);
        CacheService.del('coins:getAll');
        return result;
    }
}
