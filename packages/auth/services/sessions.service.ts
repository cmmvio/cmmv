import * as crypto from 'node:crypto';
import * as jwt from 'jsonwebtoken';
import { promisify } from 'util';

import { Service, AbstractService, Config, Module } from '@cmmv/core';
import { Repository } from '@cmmv/repository';

import { IJWTDecoded } from '../lib/auth.interface';
import { decryptJWTData } from '../lib/auth.utils';

@Service('auth_sessions')
export class AuthSessionsService extends AbstractService {
    public static async validateSession(user: IJWTDecoded): Promise<boolean> {
        const SessionsEntity = Repository.getEntity('SessionsEntity');
        let userId: any = user.id;

        if (Config.get('repository.type') === 'mongodb') {
            const { ObjectId } = await import('mongodb');
            userId = new ObjectId(userId as string);
        }

        let session = await Repository.exists(
            SessionsEntity,
            Repository.queryBuilder({
                user: userId,
                fingerprint: user.fingerprint,
            }),
        );

        if (session) return true;

        return false;
    }

    public static async validateRefreshToken(
        refreshToken: string,
    ): Promise<boolean> {
        try {
            const jwtSecret = Config.get<string>('auth.jwtSecret');
            const jwtSecretRefresh = Config.get<string>(
                'auth.jwtSecretRefresh',
                jwtSecret,
            );
            const SessionsEntity = Repository.getEntity('SessionsEntity');
            const verifyAsync = promisify(jwt.verify);
            const decoded = (await verifyAsync(
                refreshToken,
                jwtSecretRefresh,
            )) as { f: string; u: string };
            let userId: any = decoded.u;

            if (Config.get('repository.type') === 'mongodb') {
                const { ObjectId } = await import('mongodb');
                userId = new ObjectId(userId as string);
            }

            const refreshTokenHash = crypto
                .createHash('sha1')
                .update(refreshToken)
                .digest('hex');

            return await Repository.exists(
                SessionsEntity,
                Repository.queryBuilder({
                    user: userId,
                    fingerprint: decoded.f,
                    refreshToken: refreshTokenHash,
                }),
            );
        } catch (e) {
            console.error(e);
            return false;
        }
    }

    public static async getSessionFromRefreshToken(
        refreshToken: string,
    ): Promise<any | null> {
        try {
            const jwtSecret = Config.get<string>('auth.jwtSecret');
            const jwtSecretRefresh = Config.get<string>(
                'auth.jwtSecretRefresh',
                jwtSecret,
            );
            const SessionsEntity = Repository.getEntity('SessionsEntity');
            const verifyAsync = promisify(jwt.verify);
            const decoded = (await verifyAsync(
                refreshToken,
                jwtSecretRefresh,
            )) as IJWTDecoded;
            const usernameDecoded = decryptJWTData(decoded.username, jwtSecret);

            const refreshTokenHash = crypto
                .createHash('sha1')
                .update(refreshToken)
                .digest('hex');

            let session = await Repository.findBy(
                SessionsEntity,
                Repository.queryBuilder({
                    user: usernameDecoded,
                    fingerprint: decoded.fingerprint,
                    refreshToken: refreshTokenHash,
                }),
            );

            return session;
        } catch {
            return null;
        }
    }

    public async registrySession(
        sessionId: string,
        req: any,
        fingerprint: string,
        user: string,
        refreshToken: string,
    ): Promise<boolean> {
        const SessionsEntity = Repository.getEntity('SessionsEntity');
        const hasCacheModule = Module.hasModule('cache');
        const ipAddress =
            req.ip ||
            req.get('x-forwarded-for') ||
            req.connection.remoteAddress;
        const userAgent = req.get('user-agent') || 'Unknown';
        const device = this.extractDevice(userAgent);
        const browser = this.extractBrowser(userAgent);
        const os = this.extractOS(userAgent);

        let session = await Repository.findBy(
            SessionsEntity,
            Repository.queryBuilder({ fingerprint }),
        );

        const refreshTokenHash = crypto
            .createHash('sha1')
            .update(refreshToken)
            .digest('hex');

        if (session) {
            const result = await Repository.update(
                SessionsEntity,
                Repository.queryBuilder({ fingerprint }),
                {
                    ipAddress,
                    device,
                    browser,
                    os,
                    updatedAt: new Date(),
                    userAgent,
                    refreshToken: refreshTokenHash,
                },
            );

            if (!result) throw new Error('Failed to update session');

            return;
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

        const result = await Repository.insert(SessionsEntity, newSession);
        if (!result.success) throw new Error('Failed to create session');

        return true;
    }

    public async getSessions(queries: any, user: IJWTDecoded) {
        const SessionsEntity = Repository.getEntity('SessionsEntity');
        let userId: any = user.id;

        if (Config.get('repository.type') === 'mongodb') {
            const { ObjectId } = await import('mongodb');
            userId = new ObjectId(userId as string);
        }

        let session = await Repository.findAll(
            SessionsEntity,
            Repository.queryBuilder({ user: userId, ...queries }),
        );

        if (!session) throw new Error('Unable to load sessions for this user.');

        return session;
    }

    private extractDevice(userAgent: string): string {
        if (/mobile/i.test(userAgent)) return 'Mobile';
        if (/tablet/i.test(userAgent)) return 'Tablet';
        return 'Desktop';
    }

    private extractBrowser(userAgent: string): string {
        if (/chrome/i.test(userAgent)) return 'Chrome';
        if (/firefox/i.test(userAgent)) return 'Firefox';
        if (/safari/i.test(userAgent)) return 'Safari';
        if (/edge/i.test(userAgent)) return 'Edge';
        if (/opera|opr/i.test(userAgent)) return 'Opera';
        return 'Unknown';
    }

    private extractOS(userAgent: string): string {
        if (/windows/i.test(userAgent)) return 'Windows';
        if (/mac/i.test(userAgent)) return 'MacOS';
        if (/linux/i.test(userAgent)) return 'Linux';
        if (/android/i.test(userAgent)) return 'Android';
        if (/ios|iphone|ipad/i.test(userAgent)) return 'iOS';
        return 'Unknown';
    }
}
