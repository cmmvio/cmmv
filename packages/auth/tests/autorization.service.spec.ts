import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';

// Mock crypto
vi.mock('node:crypto', () => ({
    createHash: vi.fn(() => ({
        update: vi.fn().mockReturnThis(),
        digest: vi.fn().mockReturnValue('mock-hash'),
    })),
    default: {
        createHash: vi.fn(() => ({
            update: vi.fn().mockReturnThis(),
            digest: vi.fn().mockReturnValue('mock-hash'),
        })),
    },
}));

// Mock jsonwebtoken
vi.mock('jsonwebtoken', () => ({
    sign: vi.fn().mockReturnValue('mock-jwt-token'),
    verify: vi.fn((token: string, secret: string, callback?: Function) => {
        const decoded = {
            id: 'user-123',
            fingerprint: 'fp-123',
            username: 'testuser',
            f: 'fp-123',
            u: 'user-123',
            root: false,
            roles: [],
        };
        if (callback) {
            callback(null, decoded);
        }
        return decoded;
    }),
    decode: vi.fn().mockReturnValue({
        id: 'user-123',
        fingerprint: 'fp-123',
        username: 'encrypted-username',
        root: false,
        roles: [],
    }),
    default: {
        sign: vi.fn().mockReturnValue('mock-jwt-token'),
        verify: vi.fn((token: string, secret: string, callback?: Function) => {
            const decoded = {
                id: 'user-123',
                fingerprint: 'fp-123',
                username: 'testuser',
                f: 'fp-123',
                u: 'user-123',
            };
            if (callback) {
                callback(null, decoded);
            }
            return decoded;
        }),
        decode: vi.fn().mockReturnValue({
            id: 'user-123',
            fingerprint: 'fp-123',
            username: 'encrypted-username',
        }),
    },
}));

// Mock uuid
vi.mock('uuid', () => ({
    v4: vi.fn().mockReturnValue('mock-uuid-v4'),
}));

// Mock @cmmv/core
vi.mock('@cmmv/core', () => ({
    Service: vi.fn(() => (target: any) => target),
    AbstractService: class MockAbstractService {
        validate = vi.fn((data) => Promise.resolve(data));
    },
    Scope: {
        getArray: vi.fn(() => []),
    },
    Application: {
        getModel: vi.fn(() => ({
            fromPartial: vi.fn((data) => data),
            fromEntities: vi.fn((data) => data),
        })),
        resolveProvider: vi.fn(),
    },
    Config: {
        get: vi.fn((key: string, defaultValue?: any) => {
            const configs: Record<string, any> = {
                'env': 'test',
                'auth.jwtSecret': 'test-secret',
                'auth.jwtSecretRefresh': 'test-refresh-secret',
                'auth.expiresIn': 86400,
                'auth.refreshCookieName': 'refreshToken',
                'auth.recaptcha.required': false,
                'auth.recaptcha.secret': 'recaptcha-secret',
                'auth.requireEmailValidation': false,
                'repository.type': 'postgres',
                'server.session.enabled': true,
                'server.session.options.sessionCookieName': 'token',
                'server.session.options.cookie.maxAge': 86400000,
                'server.session.options.cookie.secure': false,
            };
            return configs[key] ?? defaultValue;
        }),
    },
    Hooks: {
        execute: vi.fn(),
    },
    HooksType: {
        Log: 'Log',
    },
    Module: {
        hasModule: vi.fn(() => false),
    },
    IContract: class {},
}));

// Mock @cmmv/repository
vi.mock('@cmmv/repository', () => ({
    Repository: {
        getEntity: vi.fn(() => 'MockEntity'),
        findBy: vi.fn().mockResolvedValue(null),
        findOne: vi.fn().mockResolvedValue(null),
        findAll: vi.fn().mockResolvedValue({ data: [] }),
        insert: vi.fn().mockResolvedValue({ success: true, data: { id: 'new-user-id' } }),
        update: vi.fn().mockResolvedValue(1),
        exists: vi.fn().mockResolvedValue(false),
        queryBuilder: vi.fn((query) => query),
    },
}));

// Mock @cmmv/http
vi.mock('@cmmv/http', () => ({
    CMMVRenderer: class {},
    HttpException: class MockHttpException extends Error {
        constructor(message: string, public status: number) {
            super(message);
            this.name = 'HttpException';
        }
    },
    HttpStatus: {
        OK: 200,
        BAD_REQUEST: 400,
        UNAUTHORIZED: 401,
        FORBIDDEN: 403,
        NOT_FOUND: 404,
        INTERNAL_SERVER_ERROR: 500,
    },
}));

// Mock auth utils
vi.mock('../lib/auth.utils', () => ({
    generateFingerprint: vi.fn().mockReturnValue('mock-fingerprint'),
    encryptJWTData: vi.fn((data) => `encrypted-${data}`),
    decryptJWTData: vi.fn((data) => data.replace('encrypted-', '')),
}));

// Mock sessions service - create mutable static method mock
const mockValidateRefreshToken = vi.fn().mockResolvedValue(true);

vi.mock('./sessions.service', () => ({
    AuthSessionsService: {
        validateRefreshToken: (...args: any[]) => mockValidateRefreshToken(...args),
    },
}));

// Mock recaptcha service
vi.mock('./recaptcha.service', () => ({
    AuthRecaptchaService: class MockRecaptchaService {
        validateRecaptcha = vi.fn().mockResolvedValue(true);
    },
}));

// Mock email service
vi.mock('./email.service', () => ({
    AuthEmailService: class MockEmailService {
        sendEmail = vi.fn().mockResolvedValue(true);
    },
}));

import { AuthAutorizationService } from '../services/autorization.service';
import { Config, Application, Scope } from '@cmmv/core';
import { Repository } from '@cmmv/repository';
import { HttpException, HttpStatus } from '@cmmv/http';
import * as jwt from 'jsonwebtoken';

describe('AuthAutorizationService', () => {
    let service: AuthAutorizationService;
    let mockSessionsService: any;
    let mockRecaptchaService: any;
    let mockEmailService: any;

    const mockReq = {
        ip: '127.0.0.1',
        method: 'POST',
        path: '/auth/login',
        headers: {
            'user-agent': 'Mozilla/5.0',
            'authorization': 'Bearer mock-token',
        },
        get: vi.fn((header: string) => {
            const headers: Record<string, string> = {
                'user-agent': 'Mozilla/5.0',
            };
            return headers[header];
        }),
        connection: { remoteAddress: '127.0.0.1' },
        cookies: {},
    };

    const mockRes = {
        cookie: vi.fn(),
    };

    const mockSession = {
        user: null,
        save: vi.fn(),
    };

    beforeEach(() => {
        vi.clearAllMocks();

        mockSessionsService = {
            registrySession: vi.fn().mockResolvedValue(true),
        };
        mockRecaptchaService = {
            validateRecaptcha: vi.fn().mockResolvedValue(true),
        };
        mockEmailService = {
            sendEmail: vi.fn().mockResolvedValue(true),
        };

        service = new AuthAutorizationService(
            mockSessionsService,
            mockRecaptchaService,
            mockEmailService
        );
    });

    afterEach(() => {
        vi.clearAllMocks();
    });

    describe('isLocalhost', () => {
        it('should return true for 127.0.0.1', () => {
            const req = { ip: '127.0.0.1' };
            const result = (service as any).isLocalhost(req);
            expect(result).toBe(true);
        });

        it('should return true for ::1', () => {
            const req = { ip: '::1' };
            const result = (service as any).isLocalhost(req);
            expect(result).toBe(true);
        });

        it('should return true for localhost', () => {
            const req = { ip: 'localhost' };
            const result = (service as any).isLocalhost(req);
            expect(result).toBe(true);
        });

        it('should return false for external IP', () => {
            const req = { ip: '192.168.1.1' };
            const result = (service as any).isLocalhost(req);
            expect(result).toBe(false);
        });

        it('should check connection.remoteAddress if ip is not available', () => {
            const req = { ip: null, connection: { remoteAddress: '127.0.0.1' } };
            const result = (service as any).isLocalhost(req);
            expect(result).toBe(true);
        });
    });

    describe('login', () => {
        it('should throw error for invalid credentials', async () => {
            vi.mocked(Repository.findBy).mockResolvedValue(null);
            vi.mocked(Config.get).mockImplementation((key: string, defaultValue?: any) => {
                if (key === 'env') return 'production';
                return defaultValue;
            });

            const payload = { username: 'user', password: 'pass' };

            await expect(service.login(payload, mockReq, mockRes, mockSession))
                .rejects.toThrow('Invalid credentials');
        });

        it('should throw error for blocked user', async () => {
            vi.mocked(Repository.findBy).mockResolvedValue({
                blocked: true,
                username: 'user',
                password: 'mock-hash',
            });

            const payload = { username: 'user', password: 'pass' };

            await expect(service.login(payload, mockReq, mockRes, mockSession))
                .rejects.toThrow('User Blocked');
        });

        it('should throw error for unverified email', async () => {
            vi.mocked(Repository.findBy).mockResolvedValue({
                blocked: false,
                verifyEmail: false,
                root: false,
                username: 'user',
                password: 'mock-hash',
            });

            const payload = { username: 'user', password: 'pass' };

            await expect(service.login(payload, mockReq, mockRes, mockSession))
                .rejects.toThrow('Email not validated');
        });

        it('should login successfully with valid credentials', async () => {
            vi.mocked(Repository.findBy).mockResolvedValue({
                id: 'user-123',
                blocked: false,
                verifyEmail: true,
                root: false,
                username: 'user',
                password: 'mock-hash',
                groups: [],
                roles: [],
            });

            const payload = { username: 'user', password: 'pass' };
            const result = await service.login(payload, mockReq, mockRes, mockSession);

            expect(result).toHaveProperty('result');
            expect(result.result).toHaveProperty('token');
            expect(result.result).toHaveProperty('refreshToken');
        });

        it('should validate recaptcha when required', async () => {
            vi.mocked(Config.get).mockImplementation((key: string, defaultValue?: any) => {
                if (key === 'auth.recaptcha.required') return true;
                if (key === 'auth.recaptcha.secret') return 'secret';
                return defaultValue;
            });
            mockRecaptchaService.validateRecaptcha.mockResolvedValue(false);

            const payload = { username: 'user', password: 'pass', token: 'recaptcha-token' };

            await expect(service.login(payload, mockReq, mockRes, mockSession))
                .rejects.toThrow('Invalid reCAPTCHA');
        });
    });

    describe('loginWithOneTimeToken', () => {
        it('should throw error for non-existent user', async () => {
            vi.mocked(Repository.findBy).mockResolvedValue(null);

            await expect(service.loginWithOneTimeToken('user-123', mockReq, mockRes))
                .rejects.toThrow('User not found');
        });

        it('should login user with one-time token', async () => {
            vi.mocked(Repository.findBy).mockResolvedValue({
                id: 'user-123',
                username: 'testuser',
                root: false,
                groups: [],
                roles: [],
            });

            const result = await service.loginWithOneTimeToken('user-123', mockReq, mockRes);

            expect(result).toHaveProperty('token');
            expect(result).toHaveProperty('refreshToken');
        });
    });

    describe('register', () => {
        it('should throw error for existing email', async () => {
            vi.mocked(Repository.findOne).mockResolvedValueOnce({ id: 'existing-user' });

            const payload = { username: 'newuser', password: 'pass', email: 'existing@email.com' };

            await expect(service.register(payload))
                .rejects.toThrow('Email already in use');
        });

        it('should throw error for existing username', async () => {
            vi.mocked(Repository.findOne)
                .mockResolvedValueOnce(null)
                .mockResolvedValueOnce({ id: 'existing-user' });

            const payload = { username: 'existinguser', password: 'pass', email: 'new@email.com' };

            await expect(service.register(payload))
                .rejects.toThrow('Username already in use');
        });

        it('should register new user successfully', async () => {
            vi.mocked(Repository.findOne).mockResolvedValue(null);
            vi.mocked(Repository.insert).mockResolvedValue({
                success: true,
                data: { id: 'new-user-id' }
            });

            const payload = { username: 'newuser', password: 'pass', email: 'new@email.com' };
            const result = await service.register(payload);

            expect(result).toEqual({ message: 'User registered successfully!' });
            expect(Repository.insert).toHaveBeenCalled();
        });

        it('should throw error on failed insert', async () => {
            vi.mocked(Repository.findOne).mockResolvedValue(null);
            vi.mocked(Repository.insert).mockResolvedValue({ success: false });

            const payload = { username: 'newuser', password: 'pass', email: 'new@email.com' };

            await expect(service.register(payload))
                .rejects.toThrow('Error trying to register new user');
        });
    });

    describe('checkUsernameExists', () => {
        it('should return false for short username', async () => {
            const result = await service.checkUsernameExists('ab');
            expect(result).toBe(false);
        });

        it('should check repository for valid username', async () => {
            vi.mocked(Repository.exists).mockResolvedValue(true);

            const result = await service.checkUsernameExists('testuser');

            expect(result).toBe(true);
            expect(Repository.exists).toHaveBeenCalled();
        });

        it('should return false when username does not exist', async () => {
            vi.mocked(Repository.exists).mockResolvedValue(false);

            const result = await service.checkUsernameExists('newuser');

            expect(result).toBe(false);
        });
    });

    describe('refreshToken', () => {
        it('should throw error for missing authorization header', async () => {
            const req = { headers: {} };

            await expect(service.refreshToken(req))
                .rejects.toThrow('Authorization header missing');
        });

        it('should throw error for missing refresh token', async () => {
            const req = {
                headers: { authorization: 'Bearer token' },
                cookies: {},
            };

            await expect(service.refreshToken(req))
                .rejects.toThrow('Invalid credentials');
        });

        it('should throw error for invalid refresh token', async () => {
            mockValidateRefreshToken.mockResolvedValueOnce(false);

            const req = {
                headers: {
                    authorization: 'Bearer token',
                    'refresh-token': 'invalid-refresh',
                },
                cookies: {},
            };

            await expect(service.refreshToken(req))
                .rejects.toThrow('Invalid refresh token');
        });
    });

    describe('getGroupsRoles', () => {
        it('should return empty roles for user without groups', async () => {
            const user = { roles: [] };
            const result = await service.getGroupsRoles(user);
            expect(result).toEqual([]);
        });

        it('should return user roles when no groups', async () => {
            const user = { roles: ['admin', 'user'] };
            const result = await service.getGroupsRoles(user);
            expect(result).toEqual(['admin', 'user']);
        });

        it('should merge group roles with user roles', async () => {
            vi.mocked(Repository.findAll).mockResolvedValue({
                data: [{ roles: ['group-role1', 'group-role2'] }],
            });
            vi.mocked(Application.getModel).mockReturnValue({
                fromEntities: vi.fn((data) => data),
            });

            const user = {
                roles: ['user-role'],
                groups: ['group-1'],
            };

            const result = await service.getGroupsRoles(user);

            expect(result).toContain('user-role');
        });
    });

    describe('getRoles', () => {
        it('should return empty contracts when no contracts', async () => {
            vi.mocked(Scope.getArray).mockReturnValue([]);

            const result = await service.getRoles();

            expect(result).toEqual({ contracts: {} });
        });

        it('should return roles from contracts with auth enabled', async () => {
            vi.mocked(Scope.getArray).mockReturnValue([
                {
                    auth: true,
                    generateController: true,
                    controllerName: 'User',
                    rootOnly: false,
                },
            ]);

            const result = await service.getRoles();

            expect(result.contracts).toHaveProperty('User');
            expect(result.contracts.User.roles).toContain('user:get');
            expect(result.contracts.User.roles).toContain('user:insert');
            expect(result.contracts.User.roles).toContain('user:update');
            expect(result.contracts.User.roles).toContain('user:delete');
        });
    });

    describe('hasRole', () => {
        it('should return false for non-existent role', async () => {
            vi.mocked(Scope.getArray).mockReturnValue([]);

            const result = await service.hasRole('non-existent-role');

            expect(result).toBe(false);
        });

        it('should return true for existing role', async () => {
            vi.mocked(Scope.getArray).mockReturnValue([
                {
                    auth: true,
                    generateController: true,
                    controllerName: 'User',
                    rootOnly: false,
                },
            ]);

            const result = await service.hasRole('user:get');

            expect(result).toBe(true);
        });

        it('should check multiple roles', async () => {
            vi.mocked(Scope.getArray).mockReturnValue([
                {
                    auth: true,
                    generateController: true,
                    controllerName: 'User',
                    rootOnly: false,
                },
            ]);

            const result = await service.hasRole(['user:get', 'non-existent']);

            expect(result).toBe(true);
        });
    });

    describe('assignRoles', () => {
        it('should throw error for non-existent user', async () => {
            vi.mocked(Repository.findBy).mockResolvedValue(null);
            vi.mocked(Scope.getArray).mockReturnValue([
                {
                    auth: true,
                    generateController: true,
                    controllerName: 'User',
                    rootOnly: false,
                },
            ]);

            await expect(service.assignRoles('user-123', ['user:get']))
                .rejects.toThrow('User not found');
        });

        it('should throw error for invalid roles', async () => {
            vi.mocked(Scope.getArray).mockReturnValue([]);

            await expect(service.assignRoles('user-123', ['invalid-role']))
                .rejects.toThrow('Invalid roles');
        });

        it('should throw error for root-only roles', async () => {
            vi.mocked(Scope.getArray).mockReturnValue([
                {
                    auth: true,
                    generateController: true,
                    controllerName: 'Admin',
                    rootOnly: true,
                },
            ]);

            await expect(service.assignRoles('user-123', ['admin:get']))
                .rejects.toThrow('Cannot assign root-only roles');
        });

        it('should assign valid roles successfully', async () => {
            vi.mocked(Scope.getArray).mockReturnValue([
                {
                    auth: true,
                    generateController: true,
                    controllerName: 'User',
                    rootOnly: false,
                },
            ]);
            vi.mocked(Repository.findBy).mockResolvedValue({ id: 'user-123' });
            vi.mocked(Repository.update).mockResolvedValue(1);

            const result = await service.assignRoles('user-123', ['user:get']);

            expect(result).toEqual({ message: 'Roles assigned successfully' });
        });
    });

    describe('removeRoles', () => {
        it('should throw error for non-existent user', async () => {
            vi.mocked(Repository.findBy).mockResolvedValue(null);
            vi.mocked(Scope.getArray).mockReturnValue([
                {
                    auth: true,
                    generateController: true,
                    controllerName: 'User',
                    rootOnly: false,
                },
            ]);

            await expect(service.removeRoles('user-123', ['user:get']))
                .rejects.toThrow('User not found');
        });

        it('should throw error for invalid roles', async () => {
            vi.mocked(Scope.getArray).mockReturnValue([]);

            await expect(service.removeRoles('user-123', ['invalid-role']))
                .rejects.toThrow('Invalid roles');
        });

        it('should remove roles successfully', async () => {
            vi.mocked(Scope.getArray).mockReturnValue([
                {
                    auth: true,
                    generateController: true,
                    controllerName: 'User',
                    rootOnly: false,
                },
            ]);
            vi.mocked(Repository.findBy).mockResolvedValue({
                id: 'user-123',
                roles: ['user:get', 'user:update'],
            });
            vi.mocked(Repository.update).mockResolvedValue(1);

            const result = await service.removeRoles('user-123', ['user:get']);

            expect(result).toEqual({ success: true, message: 'Roles removed successfully' });
        });
    });

    describe('createAuthToken', () => {
        it('should create JWT token with user info', () => {
            const user = { id: 'user-123', root: false };
            const jwtSecret = 'secret';
            const fingerprint = 'fp-123';
            const roles = ['user:get'];
            const username = 'testuser';

            const result = (service as any).createAuthToken(
                user, jwtSecret, fingerprint, roles, username
            );

            expect(jwt.sign).toHaveBeenCalled();
            expect(result).toBe('mock-jwt-token');
        });
    });

    describe('createRefreshToken', () => {
        it('should create refresh token with user and fingerprint', () => {
            const user = { id: 'user-123' };
            const fingerprint = 'fp-123';
            const jwtSecretRefresh = 'refresh-secret';
            const expiresIn = 86400;

            const result = (service as any).createRefreshToken(
                user, fingerprint, jwtSecretRefresh, expiresIn
            );

            expect(jwt.sign).toHaveBeenCalled();
            expect(result).toBe('mock-jwt-token');
        });
    });

    describe('user (GraphQL)', () => {
        it('should throw error for unauthenticated user', async () => {
            const req = { user: null };

            await expect(service.user({}, req))
                .rejects.toThrow('User not authenticated');
        });

        it('should throw error for non-existent user', async () => {
            vi.mocked(Repository.findBy).mockResolvedValue(null);
            const req = { user: { id: 'user-123', username: 'testuser' } };

            await expect(service.user({}, req))
                .rejects.toThrow('User not found');
        });

        it('should return user info', async () => {
            vi.mocked(Repository.findBy).mockResolvedValue({
                id: 'user-123',
                groups: ['group-1'],
                profile: { name: 'Test User' },
                roles: ['user:get'],
            });
            const req = { user: { id: 'user-123', username: 'testuser' } };

            const result = await service.user({}, req);

            expect(result).toHaveProperty('id', 'user-123');
            expect(result).toHaveProperty('username', 'testuser');
        });
    });

    describe('loginGraphQL', () => {
        it('should return success response on valid login', async () => {
            vi.mocked(Repository.findBy).mockResolvedValue({
                id: 'user-123',
                blocked: false,
                verifyEmail: true,
                root: false,
                username: 'user',
                password: 'mock-hash',
                groups: [],
                roles: [],
            });

            const payload = { username: 'user', password: 'pass' };
            const result = await service.loginGraphQL(payload, mockReq);

            expect(result.success).toBe(true);
            expect(result).toHaveProperty('token');
        });

        it('should return error response on invalid login', async () => {
            vi.mocked(Repository.findBy).mockResolvedValue(null);
            vi.mocked(Config.get).mockImplementation((key: string, defaultValue?: any) => {
                if (key === 'env') return 'production';
                return defaultValue;
            });

            const payload = { username: 'invalid', password: 'invalid' };
            const result = await service.loginGraphQL(payload, mockReq);

            expect(result.success).toBe(false);
            expect(result.token).toBeNull();
        });
    });

    describe('registerGraphQL', () => {
        it('should return error response on failed registration', async () => {
            // First findOne returns existing email user
            vi.mocked(Repository.findOne).mockResolvedValueOnce({ id: 'existing' });

            const payload = { username: 'existing', password: 'pass', email: 'existing@email.com' };
            const result = await service.registerGraphQL(payload, mockReq);

            expect(result.success).toBe(false);
        });

        it('should catch any error from register and return failure response', async () => {
            // Test that registerGraphQL catches errors
            const result = await service.registerGraphQL(
                { username: '', password: '', email: '' },
                mockReq
            );

            // Should still return a result with success: false
            expect(result).toHaveProperty('success');
            expect(result).toHaveProperty('message');
        });
    });
});
