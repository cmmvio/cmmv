import { Config } from '@cmmv/core';

import {
    Controller,
    Post,
    Body,
    Request,
    Response,
    Get,
    User,
    Session,
    Header,
} from '@cmmv/http';

import { AuthService } from '../services/auth.service';
import { Auth } from '../lib/auth.decorator';

@Controller('auth')
export class AuthController {
    constructor(private readonly authService: AuthService) {}

    @Get('user')
    @Auth()
    async user(@User() user) {
        return user;
    }

    @Get('check')
    @Auth()
    async handlerCheckToken() {
        return { success: true };
    }

    @Post('login')
    async handlerLogin(
        @Body() payload,
        @Request() req,
        @Response() res,
        @Session() session,
    ) {
        const localLogin = Config.get('auth.localLogin', false);

        if (localLogin) {
            const { result } = await this.authService.login(
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

        if (localRegister) return await this.authService.register(payload);

        return false;
    }

    @Post('check-username')
    async handlerCheckUsername(
        @Body() payload: { username: string },
        @Response() res,
    ) {
        const exists = await this.authService.checkUsernameExists(
            payload.username,
        );
        res.type('text/json').send(exists.toString());
    }

    @Post('refresh')
    async handlerRefreshToken(@Request() req) {
        return this.authService.refreshToken(req);
    }
}
