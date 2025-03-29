import {
    Controller,
    Post,
    Get,
    Delete,
    Body,
    Req,
    Res,
    Param,
    Put,
    Queries,
    User,
} from '@cmmv/http';

import { Auth } from '../lib/auth.decorator';
import { OAuth2Service } from '../services/oauth2.service';
import {
    IOAuthAutorizeBody,
    IOAuthClient,
    IOAuthHandlerQuery,
} from '../lib/auth.interface';

@Controller('oauth')
export class OAuth2Controller {
    constructor(private readonly oauth2Service: OAuth2Service) {}

    @Get('auth', { exclude: true })
    public async handlerAuth(@Req() req, @Res() res, @Queries() queries) {
        return this.oauth2Service.auth(req, res, queries);
    }

    //Clients
    @Get('client/:clientId', { exclude: true })
    @Auth()
    public async getClient(@Param('clientId') clientId: string) {
        return this.oauth2Service.getClient(clientId);
    }

    @Get('client/admin/:clientId', { exclude: true })
    @Auth({ rootOnly: true })
    public async getClientAdmin(@Param('clientId') clientId: string) {
        return this.oauth2Service.getClientAdmin(clientId);
    }

    @Get('clients', { exclude: true })
    @Auth({ rootOnly: true })
    public async getClients() {
        return this.oauth2Service.getClients();
    }

    @Post('client', { exclude: true })
    @Auth({ rootOnly: true })
    public async createClient(@Body() payload: IOAuthClient) {
        return this.oauth2Service.createClient(payload);
    }

    @Put('client/:clientId', { exclude: true })
    @Auth({ rootOnly: true })
    public async updateClient(
        @Param('clientId') clientId: string,
        @Body() payload: IOAuthClient,
    ) {
        return this.oauth2Service.updateClient(clientId, payload);
    }

    @Delete('client/:clientId', { exclude: true })
    @Auth({ rootOnly: true })
    public async deleteClient(@Param('clientId') clientId: string) {
        return this.oauth2Service.deleteClient(clientId);
    }

    //Authorization
    @Post('approve', { exclude: true })
    @Auth()
    public async authorize(
        @Req() req,
        @Res() res,
        @Body() payload: IOAuthAutorizeBody,
        @User() user,
    ) {
        return this.oauth2Service.authorize(
            payload.client_id,
            payload,
            user,
            req,
            res,
        );
    }

    @Get('handler', { exclude: true })
    public async handler(
        @Queries() payload: IOAuthHandlerQuery,
        @Req() req,
        @Res() res,
    ) {
        return this.oauth2Service.handler(payload, req, res);
    }
}
