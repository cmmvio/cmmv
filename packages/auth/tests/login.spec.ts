import { describe, it, expect, beforeEach, vi } from 'vitest';
import { AuthService } from '../services/auth.service';
import { Repository } from '@cmmv/repository';
import { Config } from '@cmmv/core';
import { HttpException, HttpStatus } from '@cmmv/http';
import * as crypto from 'node:crypto';
import * as jwt from 'jsonwebtoken';

vi.mock('@cmmv/repository');
vi.mock('@cmmv/core');
vi.mock('jsonwebtoken', () => ({
    sign: vi.fn().mockReturnValue('mockedAccessToken'),
    verify: vi.fn().mockReturnValue({ id: '123', username: 'testUser' }),
}));
vi.mock('../utils/fingerprint', () => ({
    generateFingerprint: vi.fn().mockReturnValue('mockedFingerprint'),
}));

describe('AuthService - User Login', () => {
    let authService: AuthService;

    beforeEach(() => {
        authService = new AuthService(
            {} as any, // Mock das dependências
            {} as any,
        );
    });

    it('should login a user successfully', async () => {
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

        const mockReq = { req: { headers: { 'user-agent': 'test-agent' } } };
        const result = await authService.login.call(
            mockReq,
            { username: 'testUser', password: 'testPass' },
            mockReq,
        );

        expect(result).toHaveProperty('result.success', true);
        expect(result).toHaveProperty('result.token', 'mockedAccessToken');
    });

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
