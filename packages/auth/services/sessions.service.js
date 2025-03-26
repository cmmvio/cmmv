"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.AuthSessionsService = void 0;
const tslib_1 = require("tslib");
const crypto = require("node:crypto");
const jwt = require("jsonwebtoken");
const util_1 = require("util");
const core_1 = require("@cmmv/core");
const repository_1 = require("@cmmv/repository");
const auth_utils_1 = require("../lib/auth.utils");
let AuthSessionsService = class AuthSessionsService extends core_1.AbstractService {
    static async validateSession(user) {
        const SessionsEntity = repository_1.Repository.getEntity('SessionsEntity');
        if (typeof user === 'string') {
            try {
                // Se for uma string, assumimos que é um token JWT
                const jwtSecret = core_1.Config.get('auth.jwtSecret');
                const verifyAsync = (0, util_1.promisify)(jwt.verify);
                const decoded = (await verifyAsync(user, jwtSecret));
                user = decoded;
            }
            catch (error) {
                return false;
            }
        }
        let userId = user.id;
        if (core_1.Config.get('repository.type') === 'mongodb') {
            const { ObjectId } = await Promise.resolve().then(() => require('mongodb'));
            userId = new ObjectId(userId);
        }
        let session = await repository_1.Repository.exists(SessionsEntity, repository_1.Repository.queryBuilder({
            user: userId,
            fingerprint: user.fingerprint,
            revoked: false,
        }));
        return !!session;
    }
    static async validateRefreshToken(refreshToken) {
        try {
            const jwtSecret = core_1.Config.get('auth.jwtSecret');
            const jwtSecretRefresh = core_1.Config.get('auth.jwtSecretRefresh', jwtSecret);
            const SessionsEntity = repository_1.Repository.getEntity('SessionsEntity');
            const verifyAsync = (0, util_1.promisify)(jwt.verify);
            const decoded = (await verifyAsync(refreshToken, jwtSecretRefresh));
            let userId = decoded.u;
            if (core_1.Config.get('repository.type') === 'mongodb') {
                const { ObjectId } = await Promise.resolve().then(() => require('mongodb'));
                userId = new ObjectId(userId);
            }
            const refreshTokenHash = crypto
                .createHash('sha1')
                .update(refreshToken)
                .digest('hex');
            return await repository_1.Repository.exists(SessionsEntity, repository_1.Repository.queryBuilder({
                user: userId,
                fingerprint: decoded.f,
                refreshToken: refreshTokenHash,
                revoked: false,
            }));
        }
        catch (e) {
            console.error(e);
            return false;
        }
    }
    static async getSessionFromRefreshToken(refreshToken) {
        try {
            const jwtSecret = core_1.Config.get('auth.jwtSecret');
            const jwtSecretRefresh = core_1.Config.get('auth.jwtSecretRefresh', jwtSecret);
            const SessionsEntity = repository_1.Repository.getEntity('SessionsEntity');
            const verifyAsync = (0, util_1.promisify)(jwt.verify);
            const decoded = (await verifyAsync(refreshToken, jwtSecretRefresh));
            const usernameDecoded = (0, auth_utils_1.decryptJWTData)(decoded.username, jwtSecret);
            const refreshTokenHash = crypto
                .createHash('sha1')
                .update(refreshToken)
                .digest('hex');
            let session = await repository_1.Repository.findBy(SessionsEntity, repository_1.Repository.queryBuilder({
                user: usernameDecoded,
                fingerprint: decoded.fingerprint,
                refreshToken: refreshTokenHash,
                revoked: false,
            }));
            return session;
        }
        catch {
            return null;
        }
    }
    async registrySession(sessionId, req, fingerprint, user, refreshToken) {
        const SessionsEntity = repository_1.Repository.getEntity('SessionsEntity');
        const hasCacheModule = core_1.Module.hasModule('cache');
        const ipAddress = req.ip ||
            req.get('x-forwarded-for') ||
            req.connection.remoteAddress;
        const userAgent = req.get('user-agent') || 'Unknown';
        const device = this.extractDevice(userAgent);
        const browser = this.extractBrowser(userAgent);
        const os = this.extractOS(userAgent);
        let session = await repository_1.Repository.findBy(SessionsEntity, repository_1.Repository.queryBuilder({ fingerprint }));
        const refreshTokenHash = crypto
            .createHash('sha1')
            .update(refreshToken)
            .digest('hex');
        if (session) {
            const result = await repository_1.Repository.update(SessionsEntity, repository_1.Repository.queryBuilder({ fingerprint }), {
                ipAddress,
                device,
                browser,
                os,
                updatedAt: new Date(),
                userAgent,
                refreshToken: refreshTokenHash,
            });
            if (!result)
                throw new Error('Failed to update session');
            return true;
        }
        const newSession = {
            uuid: sessionId,
            fingerprint,
            user,
            ipAddress,
            device,
            browser,
            os,
            revoked: false,
            userAgent,
            refreshToken: refreshTokenHash,
            createdAt: new Date(),
            updatedAt: new Date(),
        };
        const result = await repository_1.Repository.insert(SessionsEntity, newSession);
        if (!result.success)
            throw new Error('Failed to create session');
        return true;
    }
    async getSessions(queries, user) {
        const SessionsEntity = repository_1.Repository.getEntity('SessionsEntity');
        const Sessions = core_1.Application.getModel('Sessions');
        let userId = user.id;
        if (core_1.Config.get('repository.type') === 'mongodb') {
            const { ObjectId } = await Promise.resolve().then(() => require('mongodb'));
            userId = new ObjectId(userId);
        }
        let session = await repository_1.Repository.findAll(SessionsEntity, repository_1.Repository.queryBuilder({
            user: userId,
            revoked: false,
            ...queries,
        }));
        if (!session)
            throw new Error('Unable to load sessions for this user.');
        return {
            ...session,
            data: session.data.map((item) => Sessions.fromEntity(item)),
        };
    }
    async revokeSession(sessionId, user) {
        const SessionsEntity = repository_1.Repository.getEntity('SessionsEntity');
        let userId = user.id;
        if (core_1.Config.get('repository.type') === 'mongodb') {
            const { ObjectId } = await Promise.resolve().then(() => require('mongodb'));
            userId = new ObjectId(userId);
        }
        const result = await repository_1.Repository.update(SessionsEntity, repository_1.Repository.queryBuilder({
            uuid: sessionId,
            user: userId,
        }), {
            revoked: true,
            updatedAt: new Date(),
        });
        if (!result)
            throw new Error('Failed to revoke session');
        return true;
    }
    extractDevice(userAgent) {
        if (/mobile/i.test(userAgent))
            return 'Mobile';
        if (/tablet/i.test(userAgent))
            return 'Tablet';
        return 'Desktop';
    }
    extractBrowser(userAgent) {
        if (/chrome/i.test(userAgent))
            return 'Chrome';
        if (/firefox/i.test(userAgent))
            return 'Firefox';
        if (/safari/i.test(userAgent))
            return 'Safari';
        if (/edge/i.test(userAgent))
            return 'Edge';
        if (/opera|opr/i.test(userAgent))
            return 'Opera';
        return 'Unknown';
    }
    extractOS(userAgent) {
        if (/windows/i.test(userAgent))
            return 'Windows';
        if (/mac/i.test(userAgent))
            return 'MacOS';
        if (/linux/i.test(userAgent))
            return 'Linux';
        if (/android/i.test(userAgent))
            return 'Android';
        if (/ios|iphone|ipad/i.test(userAgent))
            return 'iOS';
        return 'Unknown';
    }
};
exports.AuthSessionsService = AuthSessionsService;
exports.AuthSessionsService = AuthSessionsService = tslib_1.__decorate([
    (0, core_1.Service)('auth_sessions')
], AuthSessionsService);
