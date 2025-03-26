"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.AuthAutorizationService = void 0;
const tslib_1 = require("tslib");
const crypto = require("node:crypto");
const jwt = require("jsonwebtoken");
const util_1 = require("util");
const uuid_1 = require("uuid");
const core_1 = require("@cmmv/core");
const repository_1 = require("@cmmv/repository");
const http_1 = require("@cmmv/http");
const auth_utils_1 = require("../lib/auth.utils");
const sessions_service_1 = require("./sessions.service");
const recaptcha_service_1 = require("./recaptcha.service");
let AuthAutorizationService = class AuthAutorizationService extends core_1.AbstractService {
    constructor(sessionsService, recaptchaService) {
        super();
        this.sessionsService = sessionsService;
        this.recaptchaService = recaptchaService;
    }
    isLocalhost(req) {
        const localIPs = ['127.0.0.1', '::1', 'localhost'];
        const clientIP = req.ip ||
            req.connection?.remoteAddress ||
            req.header['x-forwarded-for'];
        return localIPs.includes(clientIP);
    }
    async login(payload, req, res, session) {
        const UserEntity = repository_1.Repository.getEntity('UserEntity');
        const env = core_1.Config.get('env', process.env.NODE_ENV);
        const jwtSecret = core_1.Config.get('auth.jwtSecret');
        const jwtSecretRefresh = core_1.Config.get('auth.jwtSecretRefresh', jwtSecret);
        const expiresIn = core_1.Config.get('auth.expiresIn', 60 * 60 * 24);
        const refreshCookieName = core_1.Config.get('auth.refreshCookieName', 'refreshToken');
        const sessionEnabled = core_1.Config.get('server.session.enabled', true);
        const cookieName = core_1.Config.get('server.session.options.sessionCookieName', 'token');
        const cookieTTL = core_1.Config.get('server.session.options.cookie.maxAge', 24 * 60 * 60 * 100);
        const cookieSecure = core_1.Config.get('server.session.options.cookie.secure', process.env.NODE_ENV !== 'dev');
        const recaptchaRequired = core_1.Config.get('auth.recaptcha.required', false);
        const recaptchaSecret = core_1.Config.get('auth.recaptcha.secret');
        if (recaptchaRequired) {
            if (!(await this.recaptchaService.validateRecaptcha(recaptchaSecret, payload.token))) {
                throw new http_1.HttpException('Invalid reCAPTCHA', http_1.HttpStatus.FORBIDDEN);
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
        let user = await repository_1.Repository.findBy(UserEntity, {
            username: usernameHashed,
            password: passwordHashed,
        });
        if ((!user || !user?.data) &&
            env === 'dev' &&
            payload.username === 'root' &&
            payload.password === 'root' &&
            this.isLocalhost(req)) {
            const { ObjectId } = core_1.Config.get('repository.type') === 'mongodb'
                ? await Promise.resolve().then(() => require('mongodb'))
                : { ObjectId: null };
            user = {
                [core_1.Config.get('repository.type') === 'mongodb' ? '_id' : 'id']: core_1.Config.get('repository.type') === 'mongodb'
                    ? new ObjectId(9999)
                    : 9999,
                username: payload.username,
                root: true,
            };
        }
        else if (!user) {
            throw new http_1.HttpException('Invalid credentials', http_1.HttpStatus.UNAUTHORIZED);
        }
        else if (user.blocked) {
            throw new http_1.HttpException('User Blocked', http_1.HttpStatus.FORBIDDEN);
        }
        else if (user.password !== passwordHashed) {
            //Test
            throw new http_1.HttpException('Invalid credentials', http_1.HttpStatus.UNAUTHORIZED);
        }
        const sesssionId = (0, uuid_1.v4)();
        const fingerprint = (0, auth_utils_1.generateFingerprint)(req.req || req, usernameHashed);
        const roles = await this.getGroupsRoles(user);
        // Creating JWT token
        const accessToken = jwt.sign({
            id: core_1.Config.get('repository.type') === 'mongodb'
                ? user._id
                : user.id,
            username: (0, auth_utils_1.encryptJWTData)(payload.username, jwtSecret),
            fingerprint,
            root: user.root || false,
            roles: roles || [],
        }, jwtSecret, { expiresIn: user.root ? '1d' : '15m' });
        const refreshToken = jwt.sign({
            u: core_1.Config.get('repository.type') === 'mongodb'
                ? user._id.toString()
                : user.id,
            f: fingerprint,
        }, jwtSecretRefresh, { expiresIn });
        // Recording session
        if (!user.root && this.sessionsService) {
            await this.sessionsService.registrySession(sesssionId, req, fingerprint, core_1.Config.get('repository.type') === 'mongodb'
                ? user._id
                : user.id, refreshToken);
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
                id: core_1.Config.get('repository.type') === 'mongodb'
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
        core_1.Hooks.execute(core_1.HooksType.Log, {
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
        return {
            result: {
                token: accessToken,
                refreshToken,
            },
            user,
        };
    }
    async register(payload) {
        const User = core_1.Application.getModel('User');
        const UserEntity = repository_1.Repository.getEntity('UserEntity');
        //@ts-ignore
        const newUser = User.fromPartial(payload);
        const data = await this.validate(newUser);
        const result = await repository_1.Repository.insert(UserEntity, {
            username: data.username,
            password: data.password,
            root: false,
            blocked: false,
            validated: false,
        });
        if (!result.success) {
            throw new http_1.HttpException('Error trying to register new user', http_1.HttpStatus.INTERNAL_SERVER_ERROR);
        }
        return { message: 'User registered successfully!' };
    }
    async checkUsernameExists(username) {
        if (username.length >= 3) {
            const UserEntity = repository_1.Repository.getEntity('UserEntity');
            const usernameHash = crypto
                .createHash('sha1')
                .update(username)
                .digest('hex');
            return await repository_1.Repository.exists(UserEntity, {
                username: usernameHash,
            });
        }
        else {
            return false;
        }
    }
    async refreshToken(request, ctx) {
        const { authorization } = request.req?.headers || request.headers || ctx['token'];
        if (!authorization) {
            throw new http_1.HttpException('Authorization header missing', http_1.HttpStatus.UNAUTHORIZED);
        }
        const refreshCookieName = core_1.Config.get('auth.refreshCookieName', 'refreshToken');
        const jwtSecret = core_1.Config.get('auth.jwtSecret');
        const jwtSecretRefresh = core_1.Config.get('auth.jwtSecretRefresh', jwtSecret);
        const UserEntity = repository_1.Repository.getEntity('UserEntity');
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
        }
        catch { }
        const refreshToken = request.cookies?.[refreshCookieName] || refreshTokenHeader;
        if (!refreshToken || !token) {
            throw new http_1.HttpException('Invalid credentials', http_1.HttpStatus.UNAUTHORIZED);
        }
        if (!(await sessions_service_1.AuthSessionsService.validateRefreshToken(refreshToken))) {
            throw new http_1.HttpException('Invalid refresh token', http_1.HttpStatus.UNAUTHORIZED);
        }
        const verifyAsync = (0, util_1.promisify)(jwt.verify);
        const decoded = (await verifyAsync(refreshToken, jwtSecretRefresh));
        const tokenDecoded = jwt.decode(token);
        tokenDecoded.username = (0, auth_utils_1.decryptJWTData)(tokenDecoded.username, jwtSecret);
        if (!tokenDecoded) {
            throw new http_1.HttpException('Invalid access token', http_1.HttpStatus.UNAUTHORIZED);
        }
        if (tokenDecoded.fingerprint !== decoded.f ||
            tokenDecoded.id !== decoded.u) {
            throw new http_1.HttpException('Token mismatch', http_1.HttpStatus.UNAUTHORIZED);
        }
        const user = await repository_1.Repository.findBy(UserEntity, repository_1.Repository.queryBuilder({
            id: decoded.u,
            blocked: false,
        }));
        if (!user)
            throw new http_1.HttpException('User not found', http_1.HttpStatus.UNAUTHORIZED);
        const usernameHashed = crypto
            .createHash('sha1')
            .update(tokenDecoded.username)
            .digest('hex');
        const fingerprint = (0, auth_utils_1.generateFingerprint)(request.req || request, usernameHashed);
        const roles = await this.getGroupsRoles(user);
        const accessToken = jwt.sign({
            id: core_1.Config.get('repository.type') === 'mongodb'
                ? user._id
                : user.id,
            username: (0, auth_utils_1.encryptJWTData)(tokenDecoded.username, jwtSecret),
            fingerprint,
            root: user.root || false,
            roles: roles || [],
        }, jwtSecret, { expiresIn: user.root ? '1d' : '15m' });
        return {
            token: accessToken,
        };
    }
    async getGroupsRoles(user) {
        let roles = [];
        if (user.roles)
            roles = [...user.roles];
        if (user.groups && user.groups.length > 0) {
            const GroupsEntity = repository_1.Repository.getEntity('GroupsEntity');
            const Groups = core_1.Application.getModel('Groups');
            let groupsToAssign = Array.isArray(user.groups)
                ? user.groups
                : [user.groups];
            groupsToAssign = groupsToAssign.filter((item) => item);
            if (groupsToAssign.length > 0) {
                const groups = await repository_1.Repository.findAll(GroupsEntity, repository_1.Repository.queryBuilder({
                    id: { $in: groupsToAssign },
                }));
                const rolesSet = new Set(roles ?? []);
                const groupsModels = Groups.fromEntities(groups.data);
                groupsModels.map((group) => group.roles?.map((roleName) => rolesSet.add(roleName)));
                roles = Array.from(rolesSet);
            }
        }
        return roles;
    }
    /* Roles */
    async getRoles() {
        const contracts = core_1.Scope.getArray('__contracts');
        const rolesSufixs = [
            'get',
            'insert',
            'update',
            'delete',
            'export',
            'import',
        ];
        const roles = new Map();
        contracts?.forEach((contract) => {
            if (contract.auth && contract.generateController) {
                let controllerRoles = new Array();
                rolesSufixs.map((sufix) => {
                    controllerRoles.push(`${contract.controllerName.toLowerCase()}:${sufix}`);
                });
                roles.set(contract.controllerName, {
                    rootOnly: contract.rootOnly,
                    roles: controllerRoles,
                });
            }
        });
        const returnRoles = {};
        roles.forEach((value, key) => {
            returnRoles[key] = value;
        });
        return { contracts: returnRoles };
    }
    async hasRole(name) {
        const rolesObj = await this.getRoles();
        const allRoles = Object.values(rolesObj.contracts)
            .map((contract) => contract.roles)
            .flat();
        if (Array.isArray(name))
            return name.some((role) => allRoles.includes(role));
        return allRoles.includes(name);
    }
    async assignRoles(userId, rolesInput) {
        const UserEntity = repository_1.Repository.getEntity('UserEntity');
        const rolesToAssign = Array.isArray(rolesInput)
            ? rolesInput
            : [rolesInput];
        const rolesData = await this.getRoles();
        const allRoles = Object.values(rolesData.contracts).flatMap((contract) => contract.roles);
        const rootOnlyRoles = Object.values(rolesData.contracts)
            .filter((contract) => contract.rootOnly)
            .flatMap((contract) => contract.roles);
        const hasRootOnly = rolesToAssign.some((role) => rootOnlyRoles.includes(role));
        if (hasRootOnly) {
            throw new http_1.HttpException('Cannot assign root-only roles', http_1.HttpStatus.FORBIDDEN);
        }
        const invalidRoles = rolesToAssign.filter((role) => !allRoles.includes(role));
        if (invalidRoles.length > 0) {
            throw new http_1.HttpException(`Invalid roles: ${invalidRoles.join(', ')}`, http_1.HttpStatus.BAD_REQUEST);
        }
        const user = await repository_1.Repository.findBy(UserEntity, repository_1.Repository.queryBuilder({ id: userId }));
        if (!user)
            throw new http_1.HttpException('User not found', http_1.HttpStatus.BAD_REQUEST);
        const result = await repository_1.Repository.update(UserEntity, userId, {
            roles: rolesToAssign,
        });
        if (result <= 0) {
            throw new http_1.HttpException('Failed to update roles', http_1.HttpStatus.BAD_REQUEST);
        }
        return { message: 'Roles assigned successfully' };
    }
    async removeRoles(userId, rolesInput) {
        const UserEntity = repository_1.Repository.getEntity('UserEntity');
        const rolesToRemove = Array.isArray(rolesInput)
            ? rolesInput
            : [rolesInput];
        const validRoles = Object.values((await this.getRoles()).contracts).flatMap((contract) => contract.roles);
        const invalidRoles = rolesToRemove.filter((role) => !validRoles.includes(role));
        if (invalidRoles.length > 0) {
            throw new http_1.HttpException(`Invalid roles: ${invalidRoles.join(', ')}`, http_1.HttpStatus.BAD_REQUEST);
        }
        const user = await repository_1.Repository.findBy(UserEntity, repository_1.Repository.queryBuilder({ id: userId }));
        if (!user)
            throw new http_1.HttpException('User not found', http_1.HttpStatus.BAD_REQUEST);
        const updatedRoles = Array.from(user.roles)?.filter((role) => !rolesToRemove.includes(role));
        const result = await repository_1.Repository.update(UserEntity, userId, {
            roles: updatedRoles,
        });
        if (result <= 0) {
            throw new http_1.HttpException('Failed to update roles', http_1.HttpStatus.BAD_REQUEST);
        }
        return { success: true, message: 'Roles removed successfully' };
    }
};
exports.AuthAutorizationService = AuthAutorizationService;
exports.AuthAutorizationService = AuthAutorizationService = tslib_1.__decorate([
    (0, core_1.Service)('auth'),
    tslib_1.__metadata("design:paramtypes", [sessions_service_1.AuthSessionsService,
        recaptcha_service_1.AuthRecaptchaService])
], AuthAutorizationService);
