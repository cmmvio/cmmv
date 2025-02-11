import * as crypto from 'node:crypto';
import * as jwt from 'jsonwebtoken';
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

import { generateFingerprint } from '../lib/auth.utils';

import { AuthSessionsService } from '../services/sessions.service';

@Service('auth')
export class AuthService extends AbstractService {
    constructor(private readonly sessionsService: AuthSessionsService) {
        super();
    }

    @Hook(HooksType.onListen)
    public async syncRoles() {
        const instance = Repository.getInstance();
        const RolesEntity = Repository.getEntity('RolesEntity');
        const contracts = Scope.getArray<any>('__contracts');
        const rolesSufixs = ['get', 'insert', 'update', 'delete', 'export'];
        const rolesNames = new Set<string>();

        if (!instance.dataSource) await Repository.loadConfig();

        contracts?.forEach((contract: IContract) => {
            if (contract.auth && contract.generateController) {
                rolesSufixs.map((sufix: string) => {
                    rolesNames.add(
                        `${contract.controllerName.toLowerCase()}:${sufix}`,
                    );
                });
            }
        });

        rolesNames.forEach((roleName: string) => {
            Repository.insertIfNotExists(
                RolesEntity,
                { name: roleName },
                'name',
            );
        });
    }

    private isLocalhost(req: any): boolean {
        const localIPs = ['127.0.0.1', '::1', 'localhost'];
        const clientIP =
            req.ip ||
            req.connection?.remoteAddress ||
            req.get('x-forwarded-for');
        return localIPs.includes(clientIP);
    }

    public async login(payload, req?: any, res?: any, session?: any) {
        const UserEntity = Repository.getEntity('UserEntity');
        const env = Config.get<string>('env', process.env.NODE_ENV);
        const jwtToken = Config.get<string>('auth.jwtSecret');
        const expiresIn = Config.get<number>('auth.expiresIn', 60 * 60 * 24);
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
        } else {
            user = user.data;
        }

        if (!user) {
            return {
                result: {
                    success: false,
                    token: '',
                    message: 'Invalid credentials',
                },
                user: null,
            };
        }

        const sesssionId = uuidv4();
        const fingerprint = generateFingerprint(req, usernameHashed);

        // Creating JWT token
        const token = jwt.sign(
            {
                id:
                    Config.get('repository.type') === 'mongodb'
                        ? user._id
                        : user.id,
                username: payload.username,
                fingerprint,
                root: user.root || false,
                roles: user.roles || [],
                groups: user.groups || [],
            },
            jwtToken,
            { expiresIn },
        );

        // Recording session
        await this.sessionsService.registrySession(
            sesssionId,
            req,
            fingerprint,
            Config.get('repository.type') === 'mongodb' ? user._id : user.id,
        );

        // Preparing session cookie
        res.cookie(cookieName, sesssionId, {
            httpOnly: true,
            secure: cookieSecure,
            sameSite: 'strict',
            maxAge: cookieTTL,
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
                token,
                root: user.root || false,
                roles: user.roles || [],
                groups: user.groups || [],
            };

            session.save();
        }

        return {
            result: {
                success: true,
                token,
                message: 'Login successful',
            },
            user,
        };
    }

    public async register(payload, req?: any) {
        const User = Application.getModel('User');
        const UserEntity = Repository.getEntity('UserEntity');
        //@ts-ignore
        const newUser = User.fromPartial(payload);

        const data = await this.validate(newUser);
        const result = await Repository.insert(UserEntity, data);

        return result.success
            ? { success: true, message: 'User registered successfully!' }
            : { success: false, message: 'Error trying to register new user' };
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
}
