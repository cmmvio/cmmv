import * as crypto from 'node:crypto';
import * as jwt from 'jsonwebtoken';
import { promisify } from 'util';
import { v4 as uuidv4 } from 'uuid';

import {
    Service,
    AbstractService,
    Scope,
    IContract,
    Application,
    Config,
    Hook,
    HooksType,
} from '@cmmv/core';

import { Repository } from '@cmmv/repository';
import { HttpException, HttpCode, HttpStatus } from '@cmmv/http';

import {
    generateFingerprint,
    encryptJWTData,
    decryptJWTData,
} from '../lib/auth.utils';

import { LoginPayload } from '../lib/auth.interface';
import { AuthSessionsService } from '../services/sessions.service';
import { AuthRecaptchaService } from '../services/recaptcha.service';

@Service('auth')
export class AuthService extends AbstractService {
    constructor(
        private readonly sessionsService: AuthSessionsService,
        private readonly recaptchaService: AuthRecaptchaService,
    ) {
        super();
    }

    private isLocalhost(req: any): boolean {
        const localIPs = ['127.0.0.1', '::1', 'localhost'];
        const clientIP =
            req.ip ||
            req.connection?.remoteAddress ||
            req.get('x-forwarded-for');
        return localIPs.includes(clientIP);
    }

    public async login(
        payload: LoginPayload,
        req?: any,
        res?: any,
        session?: any,
    ) {
        const UserEntity = Repository.getEntity('UserEntity');
        const env = Config.get<string>('env', process.env.NODE_ENV);
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

        const sessionEnabled = Config.get<boolean>(
            'server.session.enabled',
            true,
        );
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
        const recaptchaRequired = Config.get<boolean>(
            'auth.recaptcha.required',
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

        let user: any = await Repository.findBy(UserEntity, {
            username: usernameHashed,
            password: crypto
                .createHash('sha256')
                .update(payload.password)
                .digest('hex'),
        });

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
        }

        if (!user)
            throw new HttpException(
                'Invalid credentials',
                HttpStatus.UNAUTHORIZED,
            );
        else if (user.blocked)
            throw new HttpException('User Blocked', HttpStatus.FORBIDDEN);

        const sesssionId = uuidv4();
        const fingerprint = generateFingerprint(req.req, usernameHashed);

        // Creating JWT token
        const accessToken = jwt.sign(
            {
                id:
                    Config.get('repository.type') === 'mongodb'
                        ? user._id
                        : user.id,
                username: encryptJWTData(payload.username, jwtSecret),
                fingerprint,
                root: user.root || false,
                roles: user.roles || [],
                groups: user.groups || [],
            },
            jwtSecret,
            { expiresIn: '15m' },
        );

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

        // Recording session
        if (!user.root) {
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

        // Preparing session cookie
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

        // Creating a session if a session plugin is active
        if (sessionEnabled && session) {
            session.user = {
                id:
                    Config.get('repository.type') === 'mongodb'
                        ? user._id
                        : user.id,
                username: payload.username,
                fingerprint,
                token: accessToken,
                refreshToken: refreshToken,
                root: user.root || false,
                roles: user.roles || [],
                groups: user.groups || [],
            };

            session.save();
        }

        return {
            result: {
                success: true,
                token: accessToken,
                refreshToken,
                message: 'Login successful',
            },
            user,
        };
    }

    public async register(payload: any) {
        const User = Application.getModel('User');
        const UserEntity = Repository.getEntity('UserEntity');
        //@ts-ignore
        const newUser = User.fromPartial(payload);
        const data: any = await this.validate(newUser);
        const result = await Repository.insert(UserEntity, {
            username: data.username,
            password: data.password,
            root: false,
            blocked: false,
            validated: false,
        });

        if (!result.success)
            throw new HttpException(
                'Error trying to register new user',
                HttpStatus.INTERNAL_SERVER_ERROR,
            );

        return { success: true, message: 'User registered successfully!' };
    }

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

    public async refreshToken(request: any) {
        const { authorization } = request.req.headers;

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

        const token = authorization.split(' ')[1] || null;
        const refreshTokenHeader =
            request.req.headers['refresh-token'] ||
            request.req.headers['refreshToken'];
        const refreshToken =
            request.cookies?.[refreshCookieName] || refreshTokenHeader;

        if (!refreshToken || !token)
            throw new HttpException(
                'Invalid credentials',
                HttpStatus.UNAUTHORIZED,
            );

        if (!(await AuthSessionsService.validateRefreshToken(refreshToken)))
            throw new HttpException(
                'Invalid refresh token',
                HttpStatus.UNAUTHORIZED,
            );

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

        if (!tokenDecoded)
            throw new HttpException(
                'Invalid access token',
                HttpStatus.UNAUTHORIZED,
            );

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

        const fingerprint = generateFingerprint(request.req, usernameHashed);

        const accessToken = jwt.sign(
            {
                id:
                    Config.get('repository.type') === 'mongodb'
                        ? user._id
                        : user.id,
                username: encryptJWTData(tokenDecoded.username, jwtSecret),
                fingerprint,
                root: user.root || false,
                roles: user.roles || [],
                groups: user.groups || [],
            },
            jwtSecret,
            { expiresIn: '15m' },
        );

        return {
            success: true,
            token: accessToken,
            message: 'Refresh successful',
        };
    }

    /* Roles */
    public async getRoles() {
        const contracts = Scope.getArray<any>('__contracts');
        const rolesSufixs = [
            'get',
            'insert',
            'update',
            'delete',
            'export',
            'import',
        ];
        const roles = new Map<string, Array<string>>();

        contracts?.forEach((contract: IContract) => {
            if (contract.auth && contract.generateController) {
                let controllerRoles = new Array<string>();

                rolesSufixs.map((sufix: string) => {
                    controllerRoles.push(
                        `${contract.controllerName.toLowerCase()}:${sufix}`,
                    );
                });

                roles.set(contract.controllerName, controllerRoles);
            }
        });

        const returnRoles: any = {};

        roles.forEach((value, key) => {
            returnRoles[key] = value;
        });

        return { roles: returnRoles };
    }

    public async hasRole(name: string): Promise<boolean> {
        const rolesObj = await this.getRoles();
        return Object.values(rolesObj.roles).flat().includes(name);
    }

    public async assignRoles(
        userId: string,
        rolesInput: string | string[],
    ): Promise<{ success: boolean; message: string }> {
        const UserEntity = Repository.getEntity('UserEntity');
        const rolesToAssign = Array.isArray(rolesInput)
            ? rolesInput
            : [rolesInput];
        const validRoles = Object.values((await this.getRoles()).roles).flat();
        const invalidRoles = rolesToAssign.filter(
            (role) => !validRoles.includes(role),
        );

        if (invalidRoles.length > 0)
            throw new HttpException(
                `Invalid roles: ${invalidRoles.join(', ')}`,
                HttpStatus.BAD_REQUEST,
            );

        const user = await Repository.findBy(
            UserEntity,
            Repository.queryBuilder({ id: userId }),
        );

        if (!user)
            throw new HttpException('User not found', HttpStatus.BAD_REQUEST);

        const rolesJson = JSON.stringify(rolesToAssign);
        const result = await Repository.update(UserEntity, userId, {
            roles: rolesJson,
        });

        if (result <= 0)
            throw new HttpException(
                'Failed to update roles',
                HttpStatus.BAD_REQUEST,
            );

        return { success: true, message: 'Roles assigned successfully' };
    }

    public async removeRoles(
        userId: string,
        rolesInput: string | string[],
    ): Promise<{ success: boolean; message: string }> {
        const UserEntity = Repository.getEntity('UserEntity');
        const rolesToRemove = Array.isArray(rolesInput)
            ? rolesInput
            : [rolesInput];
        const validRoles = Object.values((await this.getRoles()).roles).flat();
        const invalidRoles = rolesToRemove.filter(
            (role) => !validRoles.includes(role),
        );

        if (invalidRoles.length > 0)
            throw new HttpException(
                `Invalid roles: ${invalidRoles.join(', ')}`,
                HttpStatus.BAD_REQUEST,
            );

        const user = await Repository.findBy(
            UserEntity,
            Repository.queryBuilder({ id: userId }),
        );

        if (!user)
            throw new HttpException('User not found', HttpStatus.BAD_REQUEST);

        let currentRoles: string[] = [];

        try {
            currentRoles = user.roles ? JSON.parse(user.roles) : [];
        } catch (error) {
            throw new HttpException(
                'Failed to parse user roles',
                HttpStatus.INTERNAL_SERVER_ERROR,
            );
        }

        const updatedRoles = currentRoles.filter(
            (role) => !rolesToRemove.includes(role),
        );
        const rolesJson = JSON.stringify(updatedRoles);
        const result = await Repository.update(UserEntity, userId, {
            roles: rolesJson,
        });

        if (result <= 0)
            throw new HttpException(
                'Failed to update roles',
                HttpStatus.BAD_REQUEST,
            );

        return { success: true, message: 'Roles removed successfully' };
    }

    /* Block */
    public async blockUser(
        userId: string,
    ): Promise<{ success: boolean; message: string }> {
        const UserEntity = Repository.getEntity('UserEntity');
        const user = await Repository.findBy(
            UserEntity,
            Repository.queryBuilder({ id: userId }),
        );

        if (!user)
            throw new HttpException('User not found', HttpStatus.BAD_REQUEST);

        if (user.blocked)
            throw new HttpException(
                'User is already blocked',
                HttpStatus.BAD_REQUEST,
            );

        const result = await Repository.update(UserEntity, userId, {
            blocked: true,
        });

        if (result <= 0)
            throw new HttpException(
                'Failed to block user',
                HttpStatus.INTERNAL_SERVER_ERROR,
            );

        return { success: true, message: 'User blocked successfully' };
    }

    public async unblockUser(
        userId: string,
    ): Promise<{ success: boolean; message: string }> {
        const UserEntity = Repository.getEntity('UserEntity');
        const user = await Repository.findBy(
            UserEntity,
            Repository.queryBuilder({ id: userId }),
        );

        if (!user)
            throw new HttpException('User not found', HttpStatus.BAD_REQUEST);

        if (!user.blocked)
            throw new HttpException(
                'User is already unblocked',
                HttpStatus.BAD_REQUEST,
            );

        const result = await Repository.update(UserEntity, userId, {
            blocked: false,
        });

        if (result <= 0)
            throw new HttpException(
                'Failed to unblock user',
                HttpStatus.INTERNAL_SERVER_ERROR,
            );

        return { success: true, message: 'User unblocked successfully' };
    }
}
