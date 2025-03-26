"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const vitest_1 = require("vitest");
const autorization_service_1 = require("../services/autorization.service");
const repository_1 = require("@cmmv/repository");
const http_1 = require("@cmmv/http");
vitest_1.vi.mock('@cmmv/repository');
vitest_1.vi.mock('@cmmv/core');
vitest_1.vi.mock('jsonwebtoken', () => ({
    sign: vitest_1.vi.fn().mockReturnValue('mockedAccessToken'),
    verify: vitest_1.vi.fn().mockReturnValue({ id: '123', username: 'testUser' }),
}));
vitest_1.vi.mock('../utils/fingerprint', () => ({
    generateFingerprint: vitest_1.vi.fn().mockReturnValue('mockedFingerprint'),
}));
(0, vitest_1.describe)('AuthService - User Login', () => {
    let authService;
    (0, vitest_1.beforeEach)(() => {
        authService = new autorization_service_1.AuthAutorizationService({}, // Mock das dependências
        {});
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
    (0, vitest_1.it)('should throw an error if user is not found', async () => {
        vitest_1.vi.spyOn(repository_1.Repository, 'findBy').mockResolvedValue(null);
        const mockReq = { req: { headers: { 'user-agent': 'test-agent' } } };
        await (0, vitest_1.expect)(authService.login.call(mockReq, {
            username: 'testUser',
            password: 'testPass',
        })).rejects.toThrow(http_1.HttpException);
    });
    (0, vitest_1.it)('should throw an error if password is incorrect', async () => {
        const mockUser = {
            id: '123',
            username: 'testUser',
            password: 'wrongPasswordHash',
        };
        vitest_1.vi.spyOn(repository_1.Repository, 'findBy').mockResolvedValue(mockUser);
        const mockReq = { req: { headers: { 'user-agent': 'test-agent' } } };
        await (0, vitest_1.expect)(authService.login.call(mockReq, { username: 'testUser', password: 'testPass' }, mockReq, null)).rejects.toThrow(http_1.HttpException);
    });
    (0, vitest_1.it)('should throw an error if user is blocked', async () => {
        const mockUser = {
            id: '123',
            username: 'testUser',
            blocked: true,
        };
        vitest_1.vi.spyOn(repository_1.Repository, 'findBy').mockResolvedValue(mockUser);
        const mockReq = { req: { headers: { 'user-agent': 'test-agent' } } };
        await (0, vitest_1.expect)(authService.login.call(mockReq, {
            username: 'testUser',
            password: 'testPass',
        })).rejects.toThrow(http_1.HttpException);
    });
});
