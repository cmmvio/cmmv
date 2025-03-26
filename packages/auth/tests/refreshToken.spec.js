"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const vitest_1 = require("vitest");
const autorization_service_1 = require("../services/autorization.service");
const repository_1 = require("@cmmv/repository");
const http_1 = require("@cmmv/http");
vitest_1.vi.mock('@cmmv/repository');
vitest_1.vi.mock('@cmmv/core');
vitest_1.vi.mock('jsonwebtoken', () => ({
    sign: vitest_1.vi.fn().mockReturnValue('mockedNewAccessToken'),
    verify: vitest_1.vi.fn((token) => {
        if (token === 'validRefreshToken') {
            return { id: '123', username: 'testUser' };
        }
        else if (token === 'expiredToken') {
            throw new Error('jwt expired');
        }
        throw new Error('invalid token');
    }),
}));
vitest_1.vi.mock('../services/sessions.service', () => ({
    AuthSessionsService: {
        validateRefreshToken: vitest_1.vi.fn().mockResolvedValue(true),
    },
}));
(0, vitest_1.describe)('AuthService - Refresh Token', () => {
    let authService;
    let mockRequest;
    (0, vitest_1.beforeEach)(() => {
        authService = new autorization_service_1.AuthAutorizationService({}, // Mock das dependências
        {});
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
    (0, vitest_1.it)('should throw an error if refresh token is invalid', async () => {
        mockRequest.req.headers.authorization = 'Bearer invalidToken';
        await (0, vitest_1.expect)(authService.refreshToken(mockRequest)).rejects.toThrow(http_1.HttpException);
    });
    (0, vitest_1.it)('should throw an error if user is not found', async () => {
        vitest_1.vi.spyOn(repository_1.Repository, 'findBy').mockResolvedValue(null);
        await (0, vitest_1.expect)(authService.refreshToken(mockRequest)).rejects.toThrow(http_1.HttpException);
    });
    (0, vitest_1.it)('should throw an error if user is blocked', async () => {
        const mockUser = { id: '123', username: 'testUser', blocked: true };
        vitest_1.vi.spyOn(repository_1.Repository, 'findBy').mockResolvedValue(mockUser);
        await (0, vitest_1.expect)(authService.refreshToken(mockRequest)).rejects.toThrow(http_1.HttpException);
    });
    (0, vitest_1.it)('should throw an error if refresh token is expired', async () => {
        mockRequest.req.headers.authorization = 'Bearer expiredToken';
        await (0, vitest_1.expect)(authService.refreshToken(mockRequest)).rejects.toThrow(http_1.HttpException);
    });
});
