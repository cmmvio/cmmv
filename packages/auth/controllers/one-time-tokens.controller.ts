import {
    Controller,
    Get,
    Param,
    RouterSchema,
    Req,
    Res,
    Query,
    Post,
    Body,
} from '@cmmv/http';

import { OneTimeTokenContract } from '../contracts/one-time-tokens.contract';

import { AuthOneTimeTokenService } from '../services/one-time-token.service';

import { Auth } from '../lib/auth.decorator';
import { ITokenReturn } from '../lib/auth.interface';

@Controller('auth')
export class AuthOneTimeTokensController {
    constructor(
        private readonly oneTimeTokenService: AuthOneTimeTokenService,
    ) {}

    @Get('one-time-token/generate/:userId', { exclude: true })
    @Auth({ rootOnly: true })
    async handlerOneTimeTokenGenerate(
        @Param('userId') userId: string,
    ): Promise<string> {
        return this.oneTimeTokenService.createOneTimeToken(userId);
    }

    @Get('one-time-token/:token', {
        contract: OneTimeTokenContract,
        schema: RouterSchema.GetByID,
        summary: 'Returns the one time token validation',
        exposeFilters: false,
        exclude: true,
    })
    async handlerOneTimeTokenValidation(
        @Param('token') token: string,
        @Query('redirect') redirect: string,
        @Req() req: any,
        @Res() res: any,
    ): Promise<ITokenReturn | boolean> {
        return this.oneTimeTokenService.validateOneTimeToken(
            token,
            req,
            res,
            redirect,
        );
    }

    @Post('one-time-token/:token', {
        exclude: true,
    })
    async handlerOneTimeTokenChangePassword(
        @Param('token') token: string,
        @Query('token') forgotPasswordToken: string,
        @Body() body: { password: string },
        @Req() req: any,
        @Res() res: any,
    ) {
        return this.oneTimeTokenService.changePasswordByLink(
            token,
            forgotPasswordToken,
            body.password,
            req,
        );
    }
}
