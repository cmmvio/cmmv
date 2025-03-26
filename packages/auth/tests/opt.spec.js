"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const vitest_1 = require("vitest");
const opt_service_1 = require("../services/opt.service");
const repository_1 = require("@cmmv/repository");
vitest_1.vi.mock('@cmmv/repository');
vitest_1.vi.mock('@cmmv/core');
vitest_1.vi.mock('../lib/auth.utils', () => ({
    jwtVerify: vitest_1.vi.fn().mockResolvedValue({ id: '123', username: 'testUser' }),
    decryptJWTData: vitest_1.vi
        .fn()
        .mockImplementation((encryptedText) => 'mockedDecryptedUsername'),
}));
vitest_1.vi.mock('speakeasy', () => ({
    generateSecret: vitest_1.vi.fn().mockReturnValue({ base32: 'mockedBase32Secret' }),
    otpauthURL: vitest_1.vi.fn().mockReturnValue('mockedOtpUrl'),
    totp: {
        verify: vitest_1.vi.fn((opts) => opts.token === 'validOtpToken'),
    },
}));
vitest_1.vi.mock('@loskir/styled-qr-code-node', () => ({
    QRCodeCanvas: vitest_1.vi.fn().mockImplementation(() => ({
        toDataUrl: vitest_1.vi.fn().mockResolvedValue('mockedQrCodeDataUrl'),
    })),
}));
(0, vitest_1.describe)('AuthOptService', () => {
    let authOptService;
    let mockToken;
    (0, vitest_1.beforeEach)(() => {
        authOptService = new opt_service_1.AuthOptService();
        mockToken = 'mockedJwtToken';
    });
    (0, vitest_1.it)('should generate OTP secret and return QR code', async () => {
        vitest_1.vi.spyOn(repository_1.Repository, 'findBy').mockResolvedValue(null);
        vitest_1.vi.spyOn(repository_1.Repository, 'updateById').mockResolvedValue(true);
        class MockUserEntity {
        }
        vitest_1.vi.spyOn(repository_1.Repository, 'getEntity').mockReturnValue(MockUserEntity);
        const result = await authOptService.generateOptSecret(mockToken);
        (0, vitest_1.expect)(result).toBe('mockedQrCodeDataUrl');
        (0, vitest_1.expect)(repository_1.Repository.updateById).toHaveBeenCalledWith(vitest_1.expect.anything(), '123', { optSecret: 'mockedBase32Secret', optSecretVerify: false });
    });
    (0, vitest_1.it)('should throw error if user already has active OTP', async () => {
        vitest_1.vi.spyOn(repository_1.Repository, 'findBy').mockResolvedValue({
            id: '123',
            optSecretVerify: true,
        });
        await (0, vitest_1.expect)(authOptService.generateOptSecret(mockToken)).rejects.toThrow('The user already has an active OPT.');
    });
    (0, vitest_1.it)('should validate OTP secret successfully', async () => {
        vitest_1.vi.spyOn(repository_1.Repository, 'findBy').mockResolvedValue({
            id: '123',
            optSecret: 'mockedBase32Secret',
            optSecretVerify: true,
        });
        const result = await authOptService.validateOptSecret(mockToken, 'validOtpToken');
        (0, vitest_1.expect)(result).toEqual({ success: true });
    });
    (0, vitest_1.it)('should throw error on invalid OTP secret', async () => {
        vitest_1.vi.spyOn(repository_1.Repository, 'findBy').mockResolvedValue({
            id: '123',
            optSecret: 'mockedBase32Secret',
            optSecretVerify: true,
        });
        await (0, vitest_1.expect)(authOptService.validateOptSecret(mockToken, 'invalidOtpToken')).rejects.toThrow('Invalid code');
    });
    (0, vitest_1.it)('should activate OTP secret successfully', async () => {
        vitest_1.vi.spyOn(repository_1.Repository, 'findBy').mockResolvedValue({
            id: '123',
            optSecret: 'mockedBase32Secret',
            optSecretVerify: false,
        });
        vitest_1.vi.spyOn(repository_1.Repository, 'updateById').mockResolvedValue(true);
        const result = await authOptService.updateOptSecret(mockToken, 'validOtpToken');
        (0, vitest_1.expect)(result).toEqual({ success: true });
    });
    (0, vitest_1.it)('should throw error if OTP activation fails', async () => {
        vitest_1.vi.spyOn(repository_1.Repository, 'findBy').mockResolvedValue({
            id: '123',
            optSecret: 'mockedBase32Secret',
            optSecretVerify: false,
        });
        vitest_1.vi.spyOn(repository_1.Repository, 'updateById').mockResolvedValue(false);
        await (0, vitest_1.expect)(authOptService.updateOptSecret(mockToken, 'validOtpToken')).rejects.toThrow('Unable to activate OPT');
    });
    (0, vitest_1.it)('should remove OTP secret successfully', async () => {
        vitest_1.vi.spyOn(repository_1.Repository, 'findBy').mockResolvedValue({
            id: '123',
            optSecret: 'mockedBase32Secret',
            optSecretVerify: true,
        });
        vitest_1.vi.spyOn(repository_1.Repository, 'updateById').mockResolvedValue(true);
        const result = await authOptService.removeOptSecret(mockToken, 'validOtpToken');
        (0, vitest_1.expect)(result).toEqual({ success: true });
    });
    (0, vitest_1.it)('should throw error if OTP removal fails', async () => {
        vitest_1.vi.spyOn(repository_1.Repository, 'findBy').mockResolvedValue({
            id: '123',
            optSecret: 'mockedBase32Secret',
            optSecretVerify: true,
        });
        vitest_1.vi.spyOn(repository_1.Repository, 'updateById').mockResolvedValue(false);
        await (0, vitest_1.expect)(authOptService.removeOptSecret(mockToken, 'validOtpToken')).rejects.toThrow('Unable to activate OPT');
    });
});
