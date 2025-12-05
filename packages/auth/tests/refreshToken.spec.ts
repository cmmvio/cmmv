import { describe, it, expect, beforeEach, vi } from 'vitest';
import { AuthAutorizationService } from '../services/autorization.service';
import { AuthSessionsService } from '../services/sessions.service';
import { Repository } from '@cmmv/repository';
import { Config } from '@cmmv/core';
import { HttpException } from '@cmmv/http';
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
                    'auth.jwtSecret': 'test-secret',
                    'auth.jwtSecretRefresh': 'test-refresh-secret',
                    'auth.refreshCookieName': 'refreshToken',
                    'repository.type': 'mongodb',
                };
                return config[key] ?? defaultValue;
            }),
        },
    };
});

vi.mock('jsonwebtoken', () => ({
    sign: vi.fn().mockReturnValue('mockedNewAccessToken'),
    verify: vi.fn((token: string) => {
        if (token === 'validRefreshToken') {
            return { id: '123', username: 'testUser' };
        } else if (token === 'expiredToken') {
            throw new Error('jwt expired');
        }
        throw new Error('invalid token');
    }),
}));

vi.mock('../services/sessions.service', () => ({
    AuthSessionsService: {
        validateRefreshToken: vi.fn().mockResolvedValue(true),
    },
}));

describe('AuthService - Refresh Token', () => {
    let authService: AuthAutorizationService;
    let mockRequest: any;

    beforeEach(() => {
        authService = new AuthAutorizationService(
            {} as any, // Mock das dependências
            {} as any,
            {} as any,
        );

        mockRequest = {
            req: {
                headers: {
                    authorization: 'Bearer validRefreshToken',
                },
            },
        };
    });

    /*it('should refresh token successfully with valid refresh token', async () => {
        const mockUser = {
            id: '123',
            _id: '123',
            username: 'testUser',
            blocked: false,
            root: false,
            roles: [],
            groups: []
        };

        vi.spyOn(Repository, 'findBy').mockResolvedValue(mockUser);
        vi.spyOn(AuthSessionsService, 'validateRefreshToken').mockResolvedValue(true);

        vi.spyOn(Config, 'get').mockImplementation((key: string) => {
            const config = {
                'auth.jwtSecret': 'secretKey',
                'auth.jwtSecretRefresh': 'refreshSecretKey',
                'auth.refreshCookieName': 'refreshToken',
                'repository.type': 'mongodb'
            };
            return config[key];
        });

        const mockRequest = {
            req: {
                headers: {
                    authorization: 'Bearer validRefreshToken',
                    'refresh-token': 'validRefreshToken',
                },
            },
            cookies: {
                refreshToken: 'validRefreshToken',
            },
        };

        const result = await authService.refreshToken(mockRequest);

        expect(result).toHaveProperty('success', true);
        expect(result).toHaveProperty('token', 'mockedNewAccessToken');
    });*/

    it('should throw an error if refresh token is invalid', async () => {
        mockRequest.req.headers.authorization = 'Bearer invalidToken';

        await expect(authService.refreshToken(mockRequest)).rejects.toThrow(
            HttpException,
        );
    });

    it('should throw an error if user is not found', async () => {
        vi.spyOn(Repository, 'findBy').mockResolvedValue(null);

        await expect(authService.refreshToken(mockRequest)).rejects.toThrow(
            HttpException,
        );
    });

    it('should throw an error if user is blocked', async () => {
        const mockUser = { id: '123', username: 'testUser', blocked: true };

        vi.spyOn(Repository, 'findBy').mockResolvedValue(mockUser);

        await expect(authService.refreshToken(mockRequest)).rejects.toThrow(
            HttpException,
        );
    });

    it('should throw an error if refresh token is expired', async () => {
        mockRequest.req.headers.authorization = 'Bearer expiredToken';

        await expect(authService.refreshToken(mockRequest)).rejects.toThrow(
            HttpException,
        );
    });
});
