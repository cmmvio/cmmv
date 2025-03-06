import { describe, it, expect, beforeEach, vi } from 'vitest';
import { AuthOptService } from '../services/opt.service';
import { Repository } from '@cmmv/repository';
import { Config } from '@cmmv/core';
import { jwtVerify } from '../lib/auth.utils';
import * as speakeasy from 'speakeasy';
import { QRCodeCanvas } from '@loskir/styled-qr-code-node';
import { HttpException } from '@cmmv/http';

vi.mock('@cmmv/repository');
vi.mock('@cmmv/core');
vi.mock('../lib/auth.utils', () => ({
    jwtVerify: vi.fn().mockResolvedValue({ id: '123', username: 'testUser' }),
    decryptJWTData: vi
        .fn()
        .mockImplementation(
            (encryptedText: string) => 'mockedDecryptedUsername',
        ),
}));
vi.mock('speakeasy', () => ({
    generateSecret: vi.fn().mockReturnValue({ base32: 'mockedBase32Secret' }),
    otpauthURL: vi.fn().mockReturnValue('mockedOtpUrl'),
    totp: {
        verify: vi.fn((opts) => opts.token === 'validOtpToken'),
    },
}));
vi.mock('@loskir/styled-qr-code-node', () => ({
    QRCodeCanvas: vi.fn().mockImplementation(() => ({
        toDataUrl: vi.fn().mockResolvedValue('mockedQrCodeDataUrl'),
    })),
}));

describe('AuthOptService', () => {
    let authOptService: AuthOptService;
    let mockToken: string;

    beforeEach(() => {
        authOptService = new AuthOptService();
        mockToken = 'mockedJwtToken';
    });

    it('should generate OTP secret and return QR code', async () => {
        vi.spyOn(Repository, 'findBy').mockResolvedValue(null);
        vi.spyOn(Repository, 'updateById').mockResolvedValue(true);
        class MockUserEntity {}
        vi.spyOn(Repository, 'getEntity').mockReturnValue(MockUserEntity);

        const result = await authOptService.generateOptSecret(mockToken);

        expect(result).toBe('mockedQrCodeDataUrl');
        expect(Repository.updateById).toHaveBeenCalledWith(
            expect.anything(),
            '123',
            { optSecret: 'mockedBase32Secret', optSecretVerify: false },
        );
    });

    it('should throw error if user already has active OTP', async () => {
        vi.spyOn(Repository, 'findBy').mockResolvedValue({
            id: '123',
            optSecretVerify: true,
        });

        await expect(
            authOptService.generateOptSecret(mockToken),
        ).rejects.toThrow('The user already has an active OPT.');
    });

    it('should validate OTP secret successfully', async () => {
        vi.spyOn(Repository, 'findBy').mockResolvedValue({
            id: '123',
            optSecret: 'mockedBase32Secret',
            optSecretVerify: true,
        });

        const result = await authOptService.validateOptSecret(
            mockToken,
            'validOtpToken',
        );
        expect(result).toEqual({ success: true });
    });

    it('should throw error on invalid OTP secret', async () => {
        vi.spyOn(Repository, 'findBy').mockResolvedValue({
            id: '123',
            optSecret: 'mockedBase32Secret',
            optSecretVerify: true,
        });

        await expect(
            authOptService.validateOptSecret(mockToken, 'invalidOtpToken'),
        ).rejects.toThrow('Invalid code');
    });

    it('should activate OTP secret successfully', async () => {
        vi.spyOn(Repository, 'findBy').mockResolvedValue({
            id: '123',
            optSecret: 'mockedBase32Secret',
            optSecretVerify: false,
        });
        vi.spyOn(Repository, 'updateById').mockResolvedValue(true);

        const result = await authOptService.updateOptSecret(
            mockToken,
            'validOtpToken',
        );
        expect(result).toEqual({ success: true });
    });

    it('should throw error if OTP activation fails', async () => {
        vi.spyOn(Repository, 'findBy').mockResolvedValue({
            id: '123',
            optSecret: 'mockedBase32Secret',
            optSecretVerify: false,
        });
        vi.spyOn(Repository, 'updateById').mockResolvedValue(false);

        await expect(
            authOptService.updateOptSecret(mockToken, 'validOtpToken'),
        ).rejects.toThrow('Unable to activate OPT');
    });

    it('should remove OTP secret successfully', async () => {
        vi.spyOn(Repository, 'findBy').mockResolvedValue({
            id: '123',
            optSecret: 'mockedBase32Secret',
            optSecretVerify: true,
        });
        vi.spyOn(Repository, 'updateById').mockResolvedValue(true);

        const result = await authOptService.removeOptSecret(
            mockToken,
            'validOtpToken',
        );
        expect(result).toEqual({ success: true });
    });

    it('should throw error if OTP removal fails', async () => {
        vi.spyOn(Repository, 'findBy').mockResolvedValue({
            id: '123',
            optSecret: 'mockedBase32Secret',
            optSecretVerify: true,
        });
        vi.spyOn(Repository, 'updateById').mockResolvedValue(false);

        await expect(
            authOptService.removeOptSecret(mockToken, 'validOtpToken'),
        ).rejects.toThrow('Unable to activate OPT');
    });
});
