import { v4 as uuidv4 } from 'uuid';

import { Service, AbstractService, Config, Application } from '@cmmv/core';

import { Repository } from '@cmmv/repository';
import { HttpException, HttpStatus } from '@cmmv/http';
import { ETokenType, ITokenReturn } from '../lib/auth.interface';
import { AuthUsersService } from './users.service';
import { AuthAutorizationService } from './autorization.service';

@Service('one-time-token')
export class AuthOneTimeTokenService extends AbstractService {
    constructor(
        private readonly authAutorizationService: AuthAutorizationService,
    ) {
        super();
    }

    /**
     * Create a one time token
     * @param userId - The user ID
     * @param type - The type of token
     * @returns The token URL
     */
    public async createOneTimeToken(
        userId: string,
        type: ETokenType = ETokenType.MAGIC_LINK,
    ): Promise<string> {
        const oneTimeTokenEnable = Config.get<boolean>(
            'auth.oneTimeToken.enabled',
            false,
        );

        if (!userId)
            throw new HttpException(
                'User ID is required',
                HttpStatus.BAD_REQUEST,
            );

        if (!oneTimeTokenEnable)
            throw new HttpException(
                'One time token is not enabled',
                HttpStatus.BAD_REQUEST,
            );

        const authUsersService = Application.resolveProvider(AuthUsersService);
        const user = await authUsersService.getUserById(userId);

        if (!user)
            throw new HttpException('User not found', HttpStatus.NOT_FOUND);

        const oneTimeTokenUrl = Config.get<string>('auth.oneTimeToken.urlLink');
        const expiresIn = Config.get<number>(
            'auth.oneTimeToken.expiresIn',
            60 * 10,
        );

        const OneTimeTokenEntity = Repository.getEntity('OneTimeTokenEntity');
        const token = uuidv4();

        const oneTimeToken = new OneTimeTokenEntity();
        oneTimeToken.token = token;
        oneTimeToken.user = userId;
        oneTimeToken.tokenType = type;
        oneTimeToken.expireAt = Date.now() + expiresIn * 1000;

        await Repository.insert(OneTimeTokenEntity, oneTimeToken);

        return `${oneTimeTokenUrl}/${token}`;
    }

    /**
     * Validate a one time token
     * @param token - The token
     * @param req - The request
     * @param res - The response
     * @param redirect - The redirect URL
     * @returns The result of the validation
     */
    public async validateOneTimeToken(
        token: string,
        req: any,
        res: any,
        redirect: string,
    ): Promise<ITokenReturn | boolean> {
        const oneTimeTokenEnable = Config.get<boolean>(
            'auth.oneTimeToken.enabled',
            false,
        );

        if (!oneTimeTokenEnable)
            throw new HttpException(
                'One time token is not enabled',
                HttpStatus.BAD_REQUEST,
            );

        const OneTimeTokenEntity = Repository.getEntity('OneTimeTokenEntity');
        const oneTimeToken = await Repository.findBy(OneTimeTokenEntity, {
            token,
        });

        if (!oneTimeToken)
            throw new HttpException(
                'One time token not found',
                HttpStatus.NOT_FOUND,
            );

        if (oneTimeToken.expireAt < Date.now())
            throw new HttpException(
                'One time token expired',
                HttpStatus.BAD_REQUEST,
            );

        await Repository.delete(OneTimeTokenEntity, oneTimeToken.id);

        if (oneTimeToken.tokenType === ETokenType.EMAIL_VALIDATION) {
            const authUsersService =
                Application.resolveProvider(AuthUsersService);
            await authUsersService.validateEmail(oneTimeToken.user);

            if (redirect) {
                res.res.writeHead(302, { Location: redirect });
                res.res.end();
            }

            return false;
        } else if (oneTimeToken.tokenType === ETokenType.MAGIC_LINK) {
            const tokens =
                await this.authAutorizationService.loginWithOneTimeToken(
                    oneTimeToken.user,
                    req,
                    res,
                );

            if (redirect) {
                if (req.get('X-Request-With') === 'XMLHttpRequest')
                    throw new HttpException(
                        'Redirect not allowed in AJAX requests',
                        HttpStatus.BAD_REQUEST,
                    );

                await this.redirectPage(
                    redirect,
                    res,
                    tokens.token,
                    tokens.refreshToken,
                );

                return false;
            } else {
                return tokens;
            }
        } else if (oneTimeToken.tokenType === ETokenType.PASSWORD_RESET) {
        }

        return false;
    }

    /**
     * Redirect the page
     * @param redirect - The redirect URL
     * @param res - The response
     * @param token - The token
     * @param refreshToken - The refresh token
     */
    private redirectPage(
        redirect: string,
        res: any,
        token: string,
        refreshToken: string,
    ): void {
        const redirectUrl = new URL(redirect);
        redirectUrl.searchParams.set('token', token);
        redirectUrl.searchParams.set('refreshToken', refreshToken);
        res.res.writeHead(302, { Location: redirectUrl.toString() });
        res.res.end();
    }
}
