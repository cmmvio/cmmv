import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';

// Mock jsonwebtoken
vi.mock('jsonwebtoken', () => ({
    verify: vi.fn(),
    default: {
        verify: vi.fn(),
    },
}));

// Mock @cmmv/core
vi.mock('@cmmv/core', () => ({
    Config: {
        get: vi.fn((key: string) => {
            if (key === 'auth.jwtSecret') return 'test-jwt-secret';
            return null;
        }),
    },
    Module: {
        hasModule: vi.fn().mockReturnValue(true),
    },
}));

import { authChecker } from '../lib/auth-checker';
import { Config, Module } from '@cmmv/core';
import * as jwt from 'jsonwebtoken';

describe('authChecker', () => {
    beforeEach(() => {
        vi.clearAllMocks();
    });

    afterEach(() => {
        vi.clearAllMocks();
    });

    describe('token validation', () => {
        it('should return false when no token is provided', async () => {
            const context = { token: undefined };
            const result = await authChecker({ context } as any, []);
            expect(result).toBe(false);
        });

        it('should return false when token is empty string', async () => {
            const context = { token: '' };
            const result = await authChecker({ context } as any, []);
            expect(result).toBe(false);
        });
    });

    describe('auth module check', () => {
        it('should return true if auth module is not present', async () => {
            vi.mocked(Module.hasModule).mockReturnValue(false);
            const context = { token: 'valid-token' };

            const result = await authChecker({ context } as any, []);

            expect(result).toBe(true);
        });

        it('should proceed with verification if auth module is present', async () => {
            vi.mocked(Module.hasModule).mockReturnValue(true);
            vi.mocked(jwt.verify).mockReturnValue({
                id: 'user-123',
                username: 'testuser',
                fingerprint: 'fp-123',
                root: true,
            } as any);

            const context = { token: 'valid-token' };
            const result = await authChecker({ context } as any, []);

            expect(result).toBe(true);
            expect(jwt.verify).toHaveBeenCalledWith(
                'valid-token',
                'test-jwt-secret',
            );
        });
    });

    describe('root user access', () => {
        it('should return true for root users', async () => {
            vi.mocked(Module.hasModule).mockReturnValue(true);
            vi.mocked(jwt.verify).mockReturnValue({
                id: 'user-123',
                username: 'admin',
                fingerprint: 'fp-123',
                root: true,
            } as any);

            const context = { token: 'valid-token' };
            const result = await authChecker({ context } as any, [
                'admin:read',
            ]);

            expect(result).toBe(true);
        });

        it('should return false for non-root users on root-only routes', async () => {
            vi.mocked(Module.hasModule).mockReturnValue(true);
            vi.mocked(jwt.verify).mockReturnValue({
                id: 'user-123',
                username: 'regular',
                fingerprint: 'fp-123',
                root: false,
                roles: ['user:read'],
            } as any);

            const context = { token: 'valid-token' };
            const result = await authChecker({ context } as any, [
                { rootOnly: true },
            ]);

            expect(result).toBe(false);
        });
    });

    describe('role-based access', () => {
        it('should return true when no roles are required', async () => {
            vi.mocked(Module.hasModule).mockReturnValue(true);
            vi.mocked(jwt.verify).mockReturnValue({
                id: 'user-123',
                username: 'user',
                fingerprint: 'fp-123',
                root: false,
                roles: [],
            } as any);

            const context = { token: 'valid-token' };
            const result = await authChecker({ context } as any, []);

            expect(result).toBe(true);
        });

        it('should return true when user has required role', async () => {
            vi.mocked(Module.hasModule).mockReturnValue(true);
            vi.mocked(jwt.verify).mockReturnValue({
                id: 'user-123',
                username: 'user',
                fingerprint: 'fp-123',
                root: false,
                roles: ['admin:read', 'user:read'],
            } as any);

            const context = { token: 'valid-token' };
            const result = await authChecker({ context } as any, [
                'admin:read',
            ]);

            expect(result).toBe(true);
        });

        it('should return true when user has any of required roles', async () => {
            vi.mocked(Module.hasModule).mockReturnValue(true);
            vi.mocked(jwt.verify).mockReturnValue({
                id: 'user-123',
                username: 'user',
                fingerprint: 'fp-123',
                root: false,
                roles: ['user:write'],
            } as any);

            const context = { token: 'valid-token' };
            const result = await authChecker({ context } as any, [
                'admin:read',
                'user:write',
            ]);

            expect(result).toBe(true);
        });

        it('should return false when user lacks required role', async () => {
            vi.mocked(Module.hasModule).mockReturnValue(true);
            vi.mocked(jwt.verify).mockReturnValue({
                id: 'user-123',
                username: 'user',
                fingerprint: 'fp-123',
                root: false,
                roles: ['user:read'],
            } as any);

            const context = { token: 'valid-token' };
            const result = await authChecker({ context } as any, [
                'admin:write',
            ]);

            expect(result).toBe(false);
        });

        it('should return false when user has no roles and roles are required', async () => {
            vi.mocked(Module.hasModule).mockReturnValue(true);
            vi.mocked(jwt.verify).mockReturnValue({
                id: 'user-123',
                username: 'user',
                fingerprint: 'fp-123',
                root: false,
                roles: undefined,
            } as any);

            const context = { token: 'valid-token' };
            const result = await authChecker({ context } as any, [
                'admin:read',
            ]);

            expect(result).toBe(false);
        });
    });

    describe('error handling', () => {
        it('should return false when JWT verification fails', async () => {
            vi.mocked(Module.hasModule).mockReturnValue(true);
            vi.mocked(jwt.verify).mockImplementation(() => {
                throw new Error('Invalid token');
            });

            const context = { token: 'invalid-token' };
            const result = await authChecker({ context } as any, []);

            expect(result).toBe(false);
        });

        it('should return false when token is expired', async () => {
            vi.mocked(Module.hasModule).mockReturnValue(true);
            vi.mocked(jwt.verify).mockImplementation(() => {
                const error = new Error('jwt expired');
                (error as any).name = 'TokenExpiredError';
                throw error;
            });

            const context = { token: 'expired-token' };
            const result = await authChecker({ context } as any, []);

            expect(result).toBe(false);
        });

        it('should return false when token is malformed', async () => {
            vi.mocked(Module.hasModule).mockReturnValue(true);
            vi.mocked(jwt.verify).mockImplementation(() => {
                const error = new Error('jwt malformed');
                (error as any).name = 'JsonWebTokenError';
                throw error;
            });

            const context = { token: 'malformed-token' };
            const result = await authChecker({ context } as any, []);

            expect(result).toBe(false);
        });
    });

    describe('mixed role types', () => {
        it('should handle rootOnly object in roles array', async () => {
            vi.mocked(Module.hasModule).mockReturnValue(true);
            vi.mocked(jwt.verify).mockReturnValue({
                id: 'user-123',
                username: 'admin',
                fingerprint: 'fp-123',
                root: true,
            } as any);

            const context = { token: 'valid-token' };
            const result = await authChecker({ context } as any, [
                { rootOnly: true },
                'admin:read',
            ]);

            expect(result).toBe(true);
        });

        it('should return false for non-root user with rootOnly in mixed roles', async () => {
            vi.mocked(Module.hasModule).mockReturnValue(true);
            vi.mocked(jwt.verify).mockReturnValue({
                id: 'user-123',
                username: 'user',
                fingerprint: 'fp-123',
                root: false,
                roles: ['admin:read'],
            } as any);

            const context = { token: 'valid-token' };
            const result = await authChecker({ context } as any, [
                { rootOnly: true },
            ]);

            expect(result).toBe(false);
        });
    });

    describe('string role check', () => {
        it('should handle string role parameter', async () => {
            vi.mocked(Module.hasModule).mockReturnValue(true);
            vi.mocked(jwt.verify).mockReturnValue({
                id: 'user-123',
                username: 'user',
                fingerprint: 'fp-123',
                root: false,
                roles: ['user:read', 'user:write'],
            } as any);

            const context = { token: 'valid-token' };
            // Even though authChecker expects array, test the edge case handling
            const result = await authChecker({ context } as any, ['user:read']);

            expect(result).toBe(true);
        });
    });
});
