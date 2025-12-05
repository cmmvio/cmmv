import { describe, it, expect, beforeEach, vi } from 'vitest';
import { AuthAutorizationService } from '../services/autorization.service';
import { Repository } from '@cmmv/repository';
import { Config } from '@cmmv/core';
import { HttpException, HttpStatus } from '@cmmv/http';
import * as crypto from 'node:crypto';
import * as jwt from 'jsonwebtoken';

vi.mock('@cmmv/repository', async (importOriginal) => {
    const actual = await importOriginal<typeof import('@cmmv/repository')>();
    return {
        ...actual,
        Repository: {
            ...actual.Repository,
            findBy: vi.fn(),
            getEntity: vi.fn().mockReturnValue({}),
        },
    };
});
vi.mock('@cmmv/core', async (importOriginal) => {
    const actual = await importOriginal<typeof import('@cmmv/core')>();
    return {
        ...actual,
        Config: {
            ...actual.Config,
            get: vi.fn().mockImplementation((key: string, defaultValue?: any) => {
                const config: Record<string, any> = {
                    'env': 'test',
                    'auth.recaptcha.required': false,
                    'auth.requireEmailValidation': false,
                    'auth.jwtSecret': 'test-secret',
                };
                return config[key] ?? defaultValue;
            }),
        },
    };
});
vi.mock('jsonwebtoken', () => ({
    sign: vi.fn().mockReturnValue('mockedAccessToken'),
    verify: vi.fn().mockReturnValue({ id: '123', username: 'testUser' }),
}));
vi.mock('../utils/fingerprint', () => ({
    generateFingerprint: vi.fn().mockReturnValue('mockedFingerprint'),
}));

describe('AuthService - User Login', () => {
    let authService: AuthAutorizationService;

    beforeEach(() => {
        authService = new AuthAutorizationService(
            {} as any, // Mock das dependências
            {} as any,
            {} as any,
        );
    });

    /*it('should login a user successfully', async () => {
        const mockUser = {
            id: '123',
            username: 'testUser',
            password: crypto
                .createHash('sha256')
                .update('testPass')
                .digest('hex'),
        };

        vi.spyOn(Repository, 'findBy').mockResolvedValue(mockUser);

        vi.spyOn(Config, 'get').mockImplementation((key: string) => {
            const config = {
                'auth.jwtSecret': 'secretKey',
                'auth.expiresIn': 60 * 60 * 24,
                'server.session.enabled': false,
            };
            return config[key];
        });

        vi.spyOn(authService, 'getGroupsRoles').mockImplementation(async (user: any) => {
            return [ ...user.roles ];
        });

        const mockReq = { req: { headers: { 'user-agent': 'test-agent' } } };
        const result = await authService.login.call(
            mockReq,
            { username: 'testUser', password: 'testPass' },
            mockReq,
        );

        expect(result).toHaveProperty('result.token', 'mockedAccessToken');
    });*/

    it('should throw an error if user is not found', async () => {
        vi.spyOn(Repository, 'findBy').mockResolvedValue(null);
        const mockReq = { req: { headers: { 'user-agent': 'test-agent' } } };

        await expect(
            authService.login.call(mockReq, {
                username: 'testUser',
                password: 'testPass',
            }),
        ).rejects.toThrow(HttpException);
    });

    it('should throw an error if password is incorrect', async () => {
        const mockUser = {
            id: '123',
            username: 'testUser',
            password: 'wrongPasswordHash',
        };

        vi.spyOn(Repository, 'findBy').mockResolvedValue(mockUser);
        const mockReq = { req: { headers: { 'user-agent': 'test-agent' } } };

        await expect(
            authService.login.call(
                mockReq,
                { username: 'testUser', password: 'testPass' },
                mockReq,
                null,
            ),
        ).rejects.toThrow(HttpException);
    });

    it('should throw an error if user is blocked', async () => {
        const mockUser = {
            id: '123',
            username: 'testUser',
            blocked: true,
        };

        vi.spyOn(Repository, 'findBy').mockResolvedValue(mockUser);
        const mockReq = { req: { headers: { 'user-agent': 'test-agent' } } };

        await expect(
            authService.login.call(mockReq, {
                username: 'testUser',
                password: 'testPass',
            }),
        ).rejects.toThrow(HttpException);
    });
});
