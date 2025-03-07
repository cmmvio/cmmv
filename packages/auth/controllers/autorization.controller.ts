import { Config } from '@cmmv/core';

import {
    Controller,
    Post,
    Body,
    Request,
    Response,
    Get,
    Session,
    Put,
    Param,
    Delete,
} from '@cmmv/http';

import { AuthAutorizationService } from '../services/autorization.service';
import { Auth } from '../lib/auth.decorator';

@Controller('auth')
export class AuthAutorizationController {
    constructor(
        private readonly autorizationService: AuthAutorizationService,
    ) {}

    @Post('login')
    async handlerLogin(
        @Body() payload,
        @Request() req,
        @Response() res,
        @Session() session,
    ) {
        const localLogin = Config.get('auth.localLogin', false);

        if (localLogin) {
            const { result } = await this.autorizationService.login(
                payload,
                req,
                res,
                session,
            );
            return result;
        }

        return false;
    }

    @Post('register')
    async handlerRegister(@Body() payload) {
        const localRegister = Config.get('auth.localRegister', false);

        if (localRegister)
            return await this.autorizationService.register(payload);

        return false;
    }

    @Get('check')
    @Auth()
    async handlerCheckToken() {
        return { success: true };
    }

    @Post('check-username')
    async handlerCheckUsername(
        @Body() payload: { username: string },
        @Response() res,
    ) {
        const exists = await this.autorizationService.checkUsernameExists(
            payload.username,
        );
        res.type('text/json').send(exists.toString());
    }

    @Post('refresh')
    async handlerRefreshToken(@Request() req) {
        return this.autorizationService.refreshToken(req);
    }

    /* Roles */
    @Get('roles')
    @Auth({ rootOnly: true })
    async handlerGetRoles() {
        return this.autorizationService.getRoles();
    }

    @Put('roles/:userId')
    @Auth({ rootOnly: true })
    async handlerAssignRoles(
        @Param('userId') userId,
        @Body() payload: { roles: string | string[] },
    ) {
        return this.autorizationService.assignRoles(userId, payload.roles);
    }

    @Delete('roles/:userId')
    @Auth({ rootOnly: true })
    async handlerRemoveRoles(
        @Param('userId') userId,
        @Body() payload: { roles: string | string[] },
    ) {
        return this.autorizationService.removeRoles(userId, payload.roles);
    }
}
