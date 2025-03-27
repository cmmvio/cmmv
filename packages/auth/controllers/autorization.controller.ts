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

import { Auth } from '../lib/auth.decorator';

import {
    LoginPayload,
    LoginPayloadSchema,
    LoginReturnSchema,
    RegistryPayloadSchema,
    RegistryReturnSchema,
    CheckTokenReturnSchema,
    CheckUsernameReturnSchema,
    CheckUsernamePayloadSchema,
    RefreshTokenHeadersSchema,
    RefreshTokenReturnSchema,
    ForgotPasswordPayloadSchema,
} from '../lib/auth.interface';

import { AuthAutorizationService } from '../services/autorization.service';
import { AuthUsersService } from '../services/users.service';
@Controller('auth')
export class AutorizationController {
    constructor(
        private readonly autorizationService: AuthAutorizationService,
        private readonly usersService: AuthUsersService,
    ) {}

    @Post('login', {
        summary:
            'Route to login using username and password, requires release and depends on authorization on the server',
        externalDocs: 'https://cmmv.io/docs/modules/authentication#login',
        docs: {
            body: LoginPayloadSchema,
            return: LoginReturnSchema,
        },
    })
    async handlerLogin(
        @Body() payload: LoginPayload,
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

    @Post('register', {
        summary:
            'Route to register a new public user, requires release depends on authorization on the server',
        externalDocs:
            'https://cmmv.io/docs/modules/authentication#user-registration',
        docs: {
            body: RegistryPayloadSchema,
            return: RegistryReturnSchema,
        },
    })
    async handlerRegister(@Body() payload) {
        const localRegister = Config.get('auth.localRegister', false);

        if (localRegister)
            return await this.autorizationService.register(payload);

        return false;
    }

    @Post('forgot-password', {
        summary: 'Route to send a reset password email',
        docs: {
            body: ForgotPasswordPayloadSchema,
        },
    })
    async handlerForgotPassword(@Body() payload) {
        return await this.usersService.forgotPassword(payload.email);
    }

    @Get('check', {
        summary: 'Check if authentication is still valid',
        docs: {
            return: CheckTokenReturnSchema,
        },
    })
    @Auth()
    async handlerCheckToken() {
        return { success: true };
    }

    @Post('check-username', {
        summary: 'Checks if the user is already in use',
        docs: {
            body: CheckUsernamePayloadSchema,
            return: CheckUsernameReturnSchema,
        },
    })
    async handlerCheckUsername(
        @Body() payload: { username: string },
        @Response() res,
    ) {
        const exists = await this.autorizationService.checkUsernameExists(
            payload.username,
        );
        res.type('text/plain').send(exists.toString());
    }

    @Post('refresh', {
        summary: 'Route to refresh authentication token using refresh token',
        externalDocs:
            'https://cmmv.io/docs/modules/authentication#refresh-token',
        docs: {
            headers: RefreshTokenHeadersSchema,
            return: RefreshTokenReturnSchema,
        },
    })
    async handlerRefreshToken(@Request() req) {
        return this.autorizationService.refreshToken(req);
    }

    /* Roles */
    @Get('roles', { exclude: true })
    @Auth({ rootOnly: true })
    async handlerGetRoles() {
        return this.autorizationService.getRoles();
    }

    @Put('roles/:userId', { exclude: true })
    @Auth({ rootOnly: true })
    async handlerAssignRoles(
        @Param('userId') userId,
        @Body() payload: { roles: string | string[] },
    ) {
        return this.autorizationService.assignRoles(userId, payload.roles);
    }

    @Delete('roles/:userId', { exclude: true })
    @Auth({ rootOnly: true })
    async handlerRemoveRoles(
        @Param('userId') userId,
        @Body() payload: { roles: string | string[] },
    ) {
        return this.autorizationService.removeRoles(userId, payload.roles);
    }
}
