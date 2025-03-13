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
} from '@cmmv/core';

import { Repository } from '@cmmv/repository';
import { HttpException, HttpStatus } from '@cmmv/http';

import {
    generateFingerprint,
    encryptJWTData,
    decryptJWTData,
} from '../lib/auth.utils';

import { LoginPayload, IGetRolesResponse } from '../lib/auth.interface';
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

    private isLocalhost(req: any): boolean {
        const localIPs = ['127.0.0.1', '::1', 'localhost'];
        const clientIP =
            req.ip ||
            req.connection?.remoteAddress ||
            req.header['x-forwarded-for'];
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

        const passwordHashed = crypto
            .createHash('sha256')
            .update(payload.password)
            .digest('hex');

        let user: any = await Repository.findBy(UserEntity, {
            username: usernameHashed,
            password: passwordHashed,
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

        const sesssionId = uuidv4();
        const fingerprint = generateFingerprint(req.req || req, usernameHashed);
        const roles = await this.getGroupsRoles(user);

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
                roles: roles || [],
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

        // Preparing session cookie
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
                roles: roles || [],
                groups: user.groups || [],
            };

            session.save();
        }

        return {
            result: {
                token: accessToken,
                refreshToken,
            },
            user,
        };
    }

    public async register(payload: any) {
        const User = Application.getModel('User');
        const UserEntity = Repository.getEntity('UserEntity');
        //@ts-ignore
        const newUser = User.fromPartial(payload) as User;
        const data: any = await this.validate(newUser);
        console.log(data);

        const result = await Repository.insert(UserEntity, {
            username: data.username,
            password: data.password,
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

        return { message: 'User registered successfully!' };
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
        const refreshTokenHeader =
            request.headers['refresh-token'] ||
            request.headers['refreshToken'] ||
            request.req?.headers['refresh-token'] ||
            request.req?.headers['refreshToken'] ||
            ctx['refreshToken'];

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
            { expiresIn: '15m' },
        );

        return {
            token: accessToken,
        };
    }

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

    /* Roles */
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

    public async hasRole(name: string | string[]): Promise<boolean> {
        const rolesObj = await this.getRoles();
        const allRoles = Object.values(rolesObj.contracts)
            .map((contract) => contract.roles)
            .flat();

        if (Array.isArray(name))
            return name.some((role) => allRoles.includes(role));

        return allRoles.includes(name);
    }

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
}
