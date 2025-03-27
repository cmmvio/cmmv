import * as crypto from 'node:crypto';
import * as jwt from 'jsonwebtoken';
import * as fs from 'node:fs';
import * as path from 'node:path';
import { promisify } from 'util';
import { v4 as uuidv4 } from 'uuid';

import {
    Service,
    AbstractService,
    Scope,
    IContract,
    Application,
    Config,
    Hooks,
    HooksType,
    Module,
} from '@cmmv/core';

import { Repository } from '@cmmv/repository';
import { CMMVRenderer, HttpException, HttpStatus } from '@cmmv/http';

import {
    generateFingerprint,
    encryptJWTData,
    decryptJWTData,
} from '../lib/auth.utils';

import {
    LoginPayload,
    IGetRolesResponse,
    RegisterPayload,
    ETokenType,
} from '../lib/auth.interface';

import { AuthSessionsService } from './sessions.service';
import { AuthRecaptchaService } from './recaptcha.service';

@Service('auth')
export class AuthAutorizationService extends AbstractService {
    constructor(
        private readonly sessionsService: AuthSessionsService,
        private readonly recaptchaService: AuthRecaptchaService,
    ) {
        super();
    }

    /**
     * Check if the request is from localhost
     * @param req - The request
     * @returns True if the request is from localhost, false otherwise
     */
    private isLocalhost(req: any): boolean {
        const localIPs = ['127.0.0.1', '::1', 'localhost'];
        const clientIP =
            req.ip ||
            req.connection?.remoteAddress ||
            req.header['x-forwarded-for'];
        return localIPs.includes(clientIP);
    }

    /**
     * Login a user
     * @param payload - The login payload
     * @param req - The request
     * @param res - The response
     * @param session - The session
     * @returns The login response
     */
    public async login(
        payload: LoginPayload,
        req?: any,
        res?: any,
        session?: any,
    ) {
        const UserEntity = Repository.getEntity('UserEntity');
        const env = Config.get<string>('env', process.env.NODE_ENV);

        const recaptchaRequired = Config.get<boolean>(
            'auth.recaptcha.required',
            false,
        );

        const requireEmailValidation = Config.get<boolean>(
            'auth.requireEmailValidation',
            false,
        );

        const recaptchaSecret = Config.get<boolean>('auth.recaptcha.secret');

        if (recaptchaRequired) {
            if (
                !(await this.recaptchaService.validateRecaptcha(
                    recaptchaSecret,
                    payload.token,
                ))
            ) {
                throw new HttpException(
                    'Invalid reCAPTCHA',
                    HttpStatus.FORBIDDEN,
                );
            }
        }

        const usernameHashed = crypto
            .createHash('sha1')
            .update(payload.username)
            .digest('hex');

        const passwordHashed = crypto
            .createHash('sha256')
            .update(payload.password)
            .digest('hex');

        let user: any = await Repository.findBy(UserEntity, [
            {
                username: usernameHashed,
                password: passwordHashed,
            },
            {
                email: payload.username,
                password: passwordHashed,
            },
        ]);

        if (
            (!user || !user?.data) &&
            env === 'dev' &&
            payload.username === 'root' &&
            payload.password === 'root' &&
            this.isLocalhost(req)
        ) {
            const { ObjectId } =
                Config.get('repository.type') === 'mongodb'
                    ? await import('mongodb')
                    : { ObjectId: null };

            user = {
                [Config.get('repository.type') === 'mongodb' ? '_id' : 'id']:
                    Config.get('repository.type') === 'mongodb'
                        ? new ObjectId(9999)
                        : 9999,
                username: payload.username,
                root: true,
            };
        } else if (!user) {
            throw new HttpException(
                'Invalid credentials',
                HttpStatus.UNAUTHORIZED,
            );
        } else if (user.blocked) {
            throw new HttpException('User Blocked', HttpStatus.FORBIDDEN);
        } else if (user.password !== passwordHashed) {
            //Test
            throw new HttpException(
                'Invalid credentials',
                HttpStatus.UNAUTHORIZED,
            );
        }

        if (
            (requireEmailValidation && !user.verifyEmail) ||
            !requireEmailValidation
        )
            throw new HttpException(
                'Email not validated',
                HttpStatus.FORBIDDEN,
            );

        const { token, refreshToken } = await this.autorizeUser(
            user,
            req,
            res,
            session,
        );

        return {
            result: { token, refreshToken },
            user,
        };
    }

    /**
     * Login a user with a one-time token
     * @param userId - The user id
     * @param req - The request
     * @param res - The response
     * @returns The login response
     */
    public async loginWithOneTimeToken(userId: string, req: any, res: any) {
        const UserEntity = Repository.getEntity('UserEntity');
        const user = await Repository.findBy(
            UserEntity,
            Repository.queryBuilder({
                id: userId,
            }),
        );

        if (!user)
            throw new HttpException('User not found', HttpStatus.UNAUTHORIZED);

        return this.autorizeUser(user, req, res, null);
    }

    /**
     * Autorize a user
     * @param user - The user
     * @param req - The request
     * @param res - The response
     * @param session - The session
     * @returns The autorization response
     */
    public async autorizeUser(user: any, req: any, res: any, session: any) {
        const cookieName = Config.get<string>(
            'server.session.options.sessionCookieName',
            'token',
        );
        const cookieTTL = Config.get<number>(
            'server.session.options.cookie.maxAge',
            24 * 60 * 60 * 100,
        );
        const cookieSecure = Config.get<boolean>(
            'server.session.options.cookie.secure',
            process.env.NODE_ENV !== 'dev',
        );

        const jwtSecret = Config.get<string>('auth.jwtSecret');
        const jwtSecretRefresh = Config.get<string>(
            'auth.jwtSecretRefresh',
            jwtSecret,
        );
        const expiresIn = Config.get<number>('auth.expiresIn', 60 * 60 * 24);
        const refreshCookieName = Config.get<string>(
            'auth.refreshCookieName',
            'refreshToken',
        );

        const sesssionId = uuidv4();
        const fingerprint = generateFingerprint(req.req || req, user.username);
        const roles = await this.getGroupsRoles(user);

        const accessToken = this.createAuthToken(
            user,
            jwtSecret,
            fingerprint,
            roles,
            user.username,
        );

        const refreshToken = this.createRefreshToken(
            user,
            fingerprint,
            jwtSecretRefresh,
            expiresIn,
        );

        if (res) {
            res.cookie(cookieName, sesssionId, {
                httpOnly: true,
                secure: cookieSecure,
                sameSite: 'strict',
                maxAge: cookieTTL,
            });

            res.cookie(refreshCookieName, refreshToken, {
                httpOnly: true,
                secure: true,
                sameSite: 'strict',
                maxAge: 604800,
            });
        }

        if (!user.root) {
            await this.registrySession(
                sesssionId,
                user,
                req,
                fingerprint,
                refreshToken,
            );

            await this.createSession(
                user,
                session,
                user.username,
                fingerprint,
                accessToken,
                refreshToken,
                roles,
                user.groups,
            );
        }

        await this.createLogHook(req, accessToken, refreshToken, fingerprint);

        return {
            token: accessToken,
            refreshToken,
        };
    }

    /**
     * Register a user
     * @param payload - The register payload
     * @returns The register response
     */
    public async register(payload: RegisterPayload) {
        const User = Application.getModel('User');
        const UserEntity = Repository.getEntity('UserEntity');
        //@ts-ignore
        const newUser = User.fromPartial(payload) as User;
        const data: any = await this.validate(newUser);

        if (newUser.email) {
            const user = await Repository.findOne(UserEntity, {
                email: newUser.email,
            });

            if (user)
                throw new HttpException(
                    'Email already in use',
                    HttpStatus.BAD_REQUEST,
                );
        }

        if (newUser.username) {
            const user = await Repository.findOne(UserEntity, {
                username: newUser.username,
            });

            if (user)
                throw new HttpException(
                    'Username already in use',
                    HttpStatus.BAD_REQUEST,
                );
        }

        const result = await Repository.insert(UserEntity, {
            username: data.username,
            password: data.password,
            email: data.email,
            root: false,
            blocked: false,
            validated: false,
        });

        if (!result.success) {
            throw new HttpException(
                'Error trying to register new user',
                HttpStatus.INTERNAL_SERVER_ERROR,
            );
        }

        if (Module.hasModule('email')) {
            const customTemplate = Config.get<string>(
                'auth.templates.emailConfirmation',
            );

            const template = customTemplate
                ? customTemplate
                : path.join(
                      __dirname,
                      '..',
                      'templates',
                      `emailConfirmation.html`,
                  );

            if (!fs.existsSync(template))
                throw new HttpException(
                    'Template not found',
                    HttpStatus.NOT_FOUND,
                );

            //@ts-ignore
            const { EmailService } = await import('@cmmv/email');
            const emailService = Application.resolveProvider(EmailService);
            //@ts-ignore
            const pixelId = emailService.generatePixelId();
            //@ts-ignore
            const pixelUrl = emailService.getPixelUrl(pixelId);
            //@ts-ignore
            const unsubscribeLink = emailService.getUnsubscribeLink(
                result.data.id,
                pixelId,
            );
            const renderer = new CMMVRenderer();

            const { AuthOneTimeTokenService } = await import(
                '../services/one-time-token.service'
            );
            const oneTimeTokenService = Application.resolveProvider(
                AuthOneTimeTokenService,
            );

            const confirmationLink =
                await oneTimeTokenService.createOneTimeToken(
                    result.data.id,
                    ETokenType.EMAIL_VALIDATION,
                    Date.now() + 60 * 60 * 1000,
                );

            const templateParsed: string = await new Promise(
                (resolve, reject) => {
                    renderer.renderFile(
                        template,
                        {
                            title: 'Confirm Your Email',
                            confirmationLink,
                            pixelUrl,
                            unsubscribeLink,
                        },
                        {},
                        (err, content) => {
                            if (err) {
                                console.error(err);
                                throw new HttpException(
                                    'Failed to send reset password email',
                                    HttpStatus.INTERNAL_SERVER_ERROR,
                                );
                            }

                            resolve(content);
                        },
                    );
                },
            );

            //@ts-ignore
            await emailService.send(
                Config.get<string>('email.from'),
                data.email,
                'Confirm Your Email',
                templateParsed,
                'Email Confirmation',
                pixelId,
                {
                    unsubscribe: {
                        url: unsubscribeLink,
                        comment: 'Unsubscribe from newsletter',
                    },
                },
            );
        }

        return { message: 'User registered successfully!' };
    }

    /**
     * Check if a username exists
     * @param username - The username
     * @returns True if the username exists, false otherwise
     */
    public async checkUsernameExists(username: string): Promise<boolean> {
        if (username.length >= 3) {
            const UserEntity = Repository.getEntity('UserEntity');

            const usernameHash = crypto
                .createHash('sha1')
                .update(username)
                .digest('hex');

            return await Repository.exists(UserEntity, {
                username: usernameHash,
            });
        } else {
            return false;
        }
    }

    /**
     * Refresh a token
     * @param request - The request
     * @param ctx - The context
     * @returns The refresh token response
     */
    public async refreshToken(request: any, ctx?: any) {
        const { authorization } =
            request.req?.headers || request.headers || ctx['token'];

        if (!authorization) {
            throw new HttpException(
                'Authorization header missing',
                HttpStatus.UNAUTHORIZED,
            );
        }

        const refreshCookieName = Config.get<string>(
            'auth.refreshCookieName',
            'refreshToken',
        );
        const jwtSecret = Config.get<string>('auth.jwtSecret');
        const jwtSecretRefresh = Config.get<string>(
            'auth.jwtSecretRefresh',
            jwtSecret,
        );
        const UserEntity = Repository.getEntity('UserEntity');

        const token = authorization.startsWith('Bearer')
            ? authorization.split(' ')[1]
            : authorization || null;

        let refreshTokenHeader = null;

        try {
            refreshTokenHeader =
                request.headers['refresh-token'] ||
                request.headers['refreshToken'] ||
                request.req?.headers['refresh-token'] ||
                request.req?.headers['refreshToken'] ||
                ctx['refreshToken'];
        } catch {}

        const refreshToken =
            request.cookies?.[refreshCookieName] || refreshTokenHeader;

        if (!refreshToken || !token) {
            throw new HttpException(
                'Invalid credentials',
                HttpStatus.UNAUTHORIZED,
            );
        }

        if (!(await AuthSessionsService.validateRefreshToken(refreshToken))) {
            throw new HttpException(
                'Invalid refresh token',
                HttpStatus.UNAUTHORIZED,
            );
        }

        const verifyAsync = promisify(jwt.verify);
        const decoded = (await verifyAsync(refreshToken, jwtSecretRefresh)) as {
            f: string;
            u: string;
        };
        const tokenDecoded = jwt.decode(token) as any;

        tokenDecoded.username = decryptJWTData(
            tokenDecoded.username,
            jwtSecret,
        );

        if (!tokenDecoded) {
            throw new HttpException(
                'Invalid access token',
                HttpStatus.UNAUTHORIZED,
            );
        }

        if (
            tokenDecoded.fingerprint !== decoded.f ||
            tokenDecoded.id !== decoded.u
        ) {
            throw new HttpException('Token mismatch', HttpStatus.UNAUTHORIZED);
        }

        const user = await Repository.findBy(
            UserEntity,
            Repository.queryBuilder({
                id: decoded.u,
                blocked: false,
            }),
        );

        if (!user)
            throw new HttpException('User not found', HttpStatus.UNAUTHORIZED);

        const usernameHashed = crypto
            .createHash('sha1')
            .update(tokenDecoded.username)
            .digest('hex');

        const fingerprint = generateFingerprint(
            request.req || request,
            usernameHashed,
        );
        const roles = await this.getGroupsRoles(user);

        const accessToken = jwt.sign(
            {
                id:
                    Config.get('repository.type') === 'mongodb'
                        ? user._id
                        : user.id,
                username: encryptJWTData(tokenDecoded.username, jwtSecret),
                fingerprint,
                root: user.root || false,
                roles: roles || [],
            },
            jwtSecret,
            { expiresIn: user.root ? '1d' : '15m' },
        );

        return {
            token: accessToken,
        };
    }

    /**
     * Get the groups roles
     * @param user - The user
     * @returns The groups roles
     */
    public async getGroupsRoles(user: any) {
        let roles = [];

        if (user.roles) roles = [...user.roles];

        if (user.groups && user.groups.length > 0) {
            const GroupsEntity = Repository.getEntity('GroupsEntity');
            const Groups: any = Application.getModel('Groups');

            let groupsToAssign = Array.isArray(user.groups)
                ? user.groups
                : [user.groups];

            groupsToAssign = groupsToAssign.filter((item) => item);

            if (groupsToAssign.length > 0) {
                const groups = await Repository.findAll(
                    GroupsEntity,
                    Repository.queryBuilder({
                        id: { $in: groupsToAssign },
                    }),
                );

                const rolesSet = new Set<string>(roles ?? []);
                const groupsModels = Groups.fromEntities(groups.data);
                groupsModels.map((group) =>
                    group.roles?.map((roleName) => rolesSet.add(roleName)),
                );

                roles = Array.from(rolesSet);
            }
        }

        return roles;
    }

    /* Session */

    /**
     * Registry a session
     * @param sesssionId - The session id
     * @param user - The user
     * @param req - The request
     * @param fingerprint - The fingerprint
     * @param refreshToken - The refresh token
     */
    private async registrySession(
        sesssionId: string,
        user: any,
        req: any,
        fingerprint: string,
        refreshToken: string,
    ) {
        if (!user.root && this.sessionsService) {
            await this.sessionsService.registrySession(
                sesssionId,
                req,
                fingerprint,
                Config.get('repository.type') === 'mongodb'
                    ? user._id
                    : user.id,
                refreshToken,
            );
        }
    }

    /**
     * Create a session
     * @param user - The user
     * @param session - The session
     * @param username - The username
     * @param fingerprint - The fingerprint
     * @param accessToken - The access token
     * @param refreshToken - The refresh token
     * @param roles - The roles
     * @param groups - The groups
     */
    private async createSession(
        user: any,
        session: any,
        username: string,
        fingerprint: string,
        accessToken: string,
        refreshToken: string,
        roles: string[],
        groups: string[],
    ) {
        const sessionEnabled = Config.get<boolean>(
            'server.session.enabled',
            true,
        );

        if (sessionEnabled && session) {
            session.user = {
                id:
                    Config.get('repository.type') === 'mongodb'
                        ? user._id
                        : user.id,
                username,
                fingerprint,
                token: accessToken,
                refreshToken: refreshToken,
                root: user.root || false,
                roles: roles || [],
                groups: user.groups || [],
            };

            session.save();
        }
    }

    /* Tokens */

    /**
     * Create an access token
     * @param user - The user
     * @param jwtSecret - The jwt secret
     * @param fingerprint - The fingerprint
     * @param roles - The roles
     * @param username - The username
     */
    private createAuthToken(
        user: any,
        jwtSecret: string,
        fingerprint: string,
        roles: string[],
        username: string,
    ) {
        const accessToken = jwt.sign(
            {
                id:
                    Config.get('repository.type') === 'mongodb'
                        ? user._id
                        : user.id,
                username: encryptJWTData(username, jwtSecret),
                fingerprint,
                root: user.root || false,
                roles: roles || [],
            },
            jwtSecret,
            { expiresIn: user.root ? '1d' : '15m' },
        );

        return accessToken;
    }

    /**
     * Create a refresh token
     * @param user - The user
     * @param fingerprint - The fingerprint
     * @param jwtSecretRefresh - The jwt secret refresh
     * @param expiresIn - The expires in
     * @returns The refresh token
     */
    private createRefreshToken(
        user: any,
        fingerprint: string,
        jwtSecretRefresh: string,
        expiresIn: number,
    ) {
        const refreshToken = jwt.sign(
            {
                u:
                    Config.get('repository.type') === 'mongodb'
                        ? user._id.toString()
                        : user.id,
                f: fingerprint,
            },
            jwtSecretRefresh,
            { expiresIn },
        );

        return refreshToken;
    }

    /* Roles */

    /**
     * Get the roles
     * @returns The roles
     */
    public async getRoles(): Promise<IGetRolesResponse> {
        const contracts = Scope.getArray<any>('__contracts');
        const rolesSufixs = [
            'get',
            'insert',
            'update',
            'delete',
            'export',
            'import',
        ];
        const roles = new Map<
            string,
            {
                rootOnly: boolean;
                roles: Array<string>;
            }
        >();

        contracts?.forEach((contract: IContract) => {
            if (contract.auth && contract.generateController) {
                let controllerRoles = new Array<string>();

                rolesSufixs.map((sufix: string) => {
                    controllerRoles.push(
                        `${contract.controllerName.toLowerCase()}:${sufix}`,
                    );
                });

                roles.set(contract.controllerName, {
                    rootOnly: contract.rootOnly,
                    roles: controllerRoles,
                });
            }
        });

        const returnRoles: any = {};

        roles.forEach((value, key) => {
            returnRoles[key] = value;
        });

        return { contracts: returnRoles };
    }

    /**
     * Check if the user has a role
     * @param name - The role name
     * @returns True if the user has the role, false otherwise
     */
    public async hasRole(name: string | string[]): Promise<boolean> {
        const rolesObj = await this.getRoles();
        const allRoles = Object.values(rolesObj.contracts)
            .map((contract) => contract.roles)
            .flat();

        if (Array.isArray(name))
            return name.some((role) => allRoles.includes(role));

        return allRoles.includes(name);
    }

    /**
     * Assign roles to a user
     * @param userId - The user id
     * @param rolesInput - The roles input
     * @returns The message
     */
    public async assignRoles(
        userId: string,
        rolesInput: string | string[],
    ): Promise<{ message: string }> {
        const UserEntity = Repository.getEntity('UserEntity');
        const rolesToAssign = Array.isArray(rolesInput)
            ? rolesInput
            : [rolesInput];

        const rolesData = await this.getRoles();
        const allRoles = Object.values(rolesData.contracts).flatMap(
            (contract) => contract.roles,
        );
        const rootOnlyRoles = Object.values(rolesData.contracts)
            .filter((contract) => contract.rootOnly)
            .flatMap((contract) => contract.roles);

        const hasRootOnly = rolesToAssign.some((role) =>
            rootOnlyRoles.includes(role),
        );

        if (hasRootOnly) {
            throw new HttpException(
                'Cannot assign root-only roles',
                HttpStatus.FORBIDDEN,
            );
        }

        const invalidRoles = rolesToAssign.filter(
            (role) => !allRoles.includes(role),
        );

        if (invalidRoles.length > 0) {
            throw new HttpException(
                `Invalid roles: ${invalidRoles.join(', ')}`,
                HttpStatus.BAD_REQUEST,
            );
        }

        const user = await Repository.findBy(
            UserEntity,
            Repository.queryBuilder({ id: userId }),
        );

        if (!user)
            throw new HttpException('User not found', HttpStatus.BAD_REQUEST);

        const result = await Repository.update(UserEntity, userId, {
            roles: rolesToAssign,
        });

        if (result <= 0) {
            throw new HttpException(
                'Failed to update roles',
                HttpStatus.BAD_REQUEST,
            );
        }

        return { message: 'Roles assigned successfully' };
    }

    /**
     * Remove roles from a user
     * @param userId - The user id
     * @param rolesInput - The roles input
     * @returns The message
     */
    public async removeRoles(
        userId: string,
        rolesInput: string | string[],
    ): Promise<{ success: boolean; message: string }> {
        const UserEntity = Repository.getEntity('UserEntity');
        const rolesToRemove = Array.isArray(rolesInput)
            ? rolesInput
            : [rolesInput];

        const validRoles = Object.values(
            (await this.getRoles()).contracts,
        ).flatMap((contract) => contract.roles);

        const invalidRoles = rolesToRemove.filter(
            (role) => !validRoles.includes(role),
        );

        if (invalidRoles.length > 0) {
            throw new HttpException(
                `Invalid roles: ${invalidRoles.join(', ')}`,
                HttpStatus.BAD_REQUEST,
            );
        }

        const user = await Repository.findBy(
            UserEntity,
            Repository.queryBuilder({ id: userId }),
        );

        if (!user)
            throw new HttpException('User not found', HttpStatus.BAD_REQUEST);

        const updatedRoles = Array.from(user.roles)?.filter(
            (role: any) => !rolesToRemove.includes(role),
        );

        const result = await Repository.update(UserEntity, userId, {
            roles: updatedRoles,
        });

        if (result <= 0) {
            throw new HttpException(
                'Failed to update roles',
                HttpStatus.BAD_REQUEST,
            );
        }

        return { success: true, message: 'Roles removed successfully' };
    }

    /* Logs */

    /**
     * Create a log hook
     * @param req - The request
     * @param accessToken - The access token
     * @param refreshToken - The refresh token
     * @param fingerprint - The fingerprint
     */
    private async createLogHook(
        req: any,
        accessToken: string,
        refreshToken: string,
        fingerprint: string,
    ) {
        Hooks.execute(HooksType.Log, {
            message: `Authorized: method="${req.method.toUpperCase()}" path="${req.path}"`,
            context: 'AUTH',
            level: 'INFO',
            timestamp: Date.now(),
            metadata: {
                method: req.method.toUpperCase(),
                path: req.path,
                token: accessToken,
                refreshToken,
                fingerprint,
                ip: req.ip,
                userAgent: req.headers['user-agent'],
            },
        });
    }
}
