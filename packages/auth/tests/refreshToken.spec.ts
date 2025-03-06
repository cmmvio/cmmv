import { describe, it, expect, beforeEach, vi } from 'vitest';
import { AuthService } from '../services/auth.service';
import { AuthSessionsService } from '../services/sessions.service';
import { Repository } from '@cmmv/repository';
import { Config } from '@cmmv/core';
import { HttpException } from '@cmmv/http';
import * as jwt from 'jsonwebtoken';

vi.mock('@cmmv/repository');
vi.mock('@cmmv/core');

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
    let authService: AuthService;
    let mockRequest: any;

    beforeEach(() => {
        authService = new AuthService(
            {} as any, // Mock das dependências
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
