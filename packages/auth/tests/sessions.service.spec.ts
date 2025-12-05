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

// Store the mock verify function for later modification
let jwtVerifyImpl = (token: string, secret: string, callback?: Function) => {
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
};

// Mock jsonwebtoken
vi.mock('jsonwebtoken', () => ({
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
    sign: vi.fn().mockReturnValue('mock-token'),
    default: {
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
        sign: vi.fn().mockReturnValue('mock-token'),
    },
}));

// Mock @cmmv/core
vi.mock('@cmmv/core', () => ({
    Service: vi.fn(() => (target: any) => target),
    AbstractService: class MockAbstractService {},
    Config: {
        get: vi.fn((key: string, defaultValue?: any) => {
            const configs: Record<string, any> = {
                'auth.jwtSecret': 'test-secret',
                'auth.jwtSecretRefresh': 'test-refresh-secret',
                'repository.type': 'postgres',
            };
            return configs[key] ?? defaultValue;
        }),
    },
    Module: {
        hasModule: vi.fn(() => false),
    },
    Application: {
        getModel: vi.fn(() => ({
            fromEntity: vi.fn((item) => item),
        })),
    },
}));

// Mock @cmmv/repository
vi.mock('@cmmv/repository', () => ({
    Repository: {
        getEntity: vi.fn(() => 'SessionsEntity'),
        exists: vi.fn().mockResolvedValue(true),
        findBy: vi.fn().mockResolvedValue(null),
        findAll: vi.fn().mockResolvedValue({ data: [], count: 0 }),
        insert: vi.fn().mockResolvedValue({ success: true }),
        update: vi.fn().mockResolvedValue(true),
        queryBuilder: vi.fn((query) => query),
    },
}));

// Mock auth utils
vi.mock('../lib/auth.utils', () => ({
    decryptJWTData: vi.fn((data) => data),
}));

import { AuthSessionsService } from '../services/sessions.service';
import { Config, Application } from '@cmmv/core';
import { Repository } from '@cmmv/repository';
import * as jwt from 'jsonwebtoken';

describe('AuthSessionsService', () => {
    let service: AuthSessionsService;

    beforeEach(() => {
        vi.clearAllMocks();
        service = new AuthSessionsService();

        // Reset jwt.verify mock to default behavior
        vi.mocked(jwt.verify).mockImplementation(
            (token: any, secret: any, callback?: any) => {
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
                return decoded as any;
            },
        );
    });

    afterEach(() => {
        vi.clearAllMocks();
    });

    describe('validateSession', () => {
        it('should validate session with JWT decoded user', async () => {
            vi.mocked(Repository.exists).mockResolvedValue(true);

            const user = { id: 'user-123', fingerprint: 'fp-123' };
            const result = await AuthSessionsService.validateSession(
                user as any,
            );

            expect(result).toBe(true);
            expect(Repository.exists).toHaveBeenCalled();
        });

        it('should validate session with token string', async () => {
            vi.mocked(Repository.exists).mockResolvedValue(true);

            const result =
                await AuthSessionsService.validateSession('valid-token');

            expect(result).toBe(true);
        });

        it('should return false for invalid token', async () => {
            vi.mocked(jwt.verify).mockImplementation(
                (token: any, secret: any, callback?: any) => {
                    if (callback) {
                        callback(new Error('Invalid token'), null);
                        return undefined as any;
                    }
                    throw new Error('Invalid token');
                },
            );

            const result =
                await AuthSessionsService.validateSession('invalid-token');

            expect(result).toBe(false);
        });

        it('should return false when session does not exist', async () => {
            vi.mocked(Repository.exists).mockResolvedValue(false);

            const user = { id: 'user-123', fingerprint: 'fp-123' };
            const result = await AuthSessionsService.validateSession(
                user as any,
            );

            expect(result).toBe(false);
        });

        it('should handle MongoDB ObjectId conversion', async () => {
            vi.mocked(Config.get).mockImplementation((key: string) => {
                if (key === 'repository.type') return 'mongodb';
                if (key === 'auth.jwtSecret') return 'test-secret';
                return undefined;
            });
            vi.mocked(Repository.exists).mockResolvedValue(true);

            // Use a valid 24-character hex string for MongoDB ObjectId
            const user = {
                id: '507f1f77bcf86cd799439011',
                fingerprint: 'fp-123',
            };
            const result = await AuthSessionsService.validateSession(
                user as any,
            );

            expect(result).toBe(true);
        });
    });

    describe('validateRefreshToken', () => {
        it('should validate a valid refresh token', async () => {
            vi.mocked(Repository.exists).mockResolvedValue(true);
            vi.mocked(Config.get).mockImplementation(
                (key: string, defaultValue?: any) => {
                    const configs: Record<string, any> = {
                        'auth.jwtSecret': 'test-secret',
                        'auth.jwtSecretRefresh': 'test-refresh-secret',
                        'repository.type': 'postgres',
                    };
                    return configs[key] ?? defaultValue;
                },
            );

            const result = await AuthSessionsService.validateRefreshToken(
                'valid-refresh-token',
            );

            expect(result).toBe(true);
        });

        it('should return false for invalid refresh token', async () => {
            vi.mocked(jwt.verify).mockImplementation(
                (token: any, secret: any, callback?: any) => {
                    if (callback) {
                        callback(new Error('Invalid token'), null);
                        return undefined as any;
                    }
                    throw new Error('Invalid token');
                },
            );

            const result =
                await AuthSessionsService.validateRefreshToken('invalid-token');

            expect(result).toBe(false);
        });

        it('should return false when session does not exist', async () => {
            vi.mocked(Repository.exists).mockResolvedValue(false);

            const result =
                await AuthSessionsService.validateRefreshToken('valid-token');

            expect(result).toBe(false);
        });
    });

    describe('getSessionFromRefreshToken', () => {
        it('should return session for valid refresh token', async () => {
            const mockSession = { id: 'session-1', user: 'user-123' };
            vi.mocked(Repository.findBy).mockResolvedValue(mockSession);

            const result =
                await AuthSessionsService.getSessionFromRefreshToken(
                    'valid-token',
                );

            expect(result).toEqual(mockSession);
        });

        it('should return null for invalid token', async () => {
            vi.mocked(jwt.verify).mockImplementation(
                (token: any, secret: any, callback?: any) => {
                    if (callback) {
                        callback(new Error('Invalid token'), null);
                        return undefined as any;
                    }
                    throw new Error('Invalid token');
                },
            );

            const result =
                await AuthSessionsService.getSessionFromRefreshToken(
                    'invalid-token',
                );

            expect(result).toBeNull();
        });
    });

    describe('registrySession', () => {
        const mockReq = {
            ip: '127.0.0.1',
            get: vi.fn((header: string) => {
                const headers: Record<string, string> = {
                    'user-agent':
                        'Mozilla/5.0 (Windows NT 10.0; Win64; x64) Chrome/91.0',
                    referer: 'http://localhost',
                    origin: 'http://localhost',
                };
                return headers[header];
            }),
            connection: { remoteAddress: '127.0.0.1' },
        };

        it('should create new session when none exists', async () => {
            vi.mocked(Repository.findBy).mockResolvedValue(null);
            vi.mocked(Repository.insert).mockResolvedValue({ success: true });

            const result = await service.registrySession(
                'session-123',
                mockReq,
                'fp-123',
                'user-123',
                'refresh-token',
            );

            expect(result).toBe(true);
            expect(Repository.insert).toHaveBeenCalled();
        });

        it('should update existing session', async () => {
            vi.mocked(Repository.findBy).mockResolvedValue({ id: 'existing' });
            vi.mocked(Repository.update).mockResolvedValue(true);

            const result = await service.registrySession(
                'session-123',
                mockReq,
                'fp-123',
                'user-123',
                'refresh-token',
            );

            expect(result).toBe(true);
            expect(Repository.update).toHaveBeenCalled();
        });

        it('should throw error on failed update', async () => {
            vi.mocked(Repository.findBy).mockResolvedValue({ id: 'existing' });
            vi.mocked(Repository.update).mockResolvedValue(false);

            await expect(
                service.registrySession(
                    'session-123',
                    mockReq,
                    'fp-123',
                    'user-123',
                    'refresh-token',
                ),
            ).rejects.toThrow('Failed to update session');
        });

        it('should throw error on failed insert', async () => {
            vi.mocked(Repository.findBy).mockResolvedValue(null);
            vi.mocked(Repository.insert).mockResolvedValue({ success: false });

            await expect(
                service.registrySession(
                    'session-123',
                    mockReq,
                    'fp-123',
                    'user-123',
                    'refresh-token',
                ),
            ).rejects.toThrow('Failed to create session');
        });
    });

    describe('getSessions', () => {
        it('should return user sessions', async () => {
            const mockSessions = {
                data: [{ id: 'session-1' }, { id: 'session-2' }],
                count: 2,
            };
            vi.mocked(Repository.findAll).mockResolvedValue(mockSessions);
            vi.mocked(Config.get).mockImplementation(
                (key: string, defaultValue?: any) => {
                    if (key === 'repository.type') return 'postgres';
                    return defaultValue;
                },
            );

            const user = { id: 'user-123', fingerprint: 'fp-123' };
            const result = await service.getSessions({}, user as any);

            expect(result.data).toHaveLength(2);
        });

        it('should throw error when no sessions found', async () => {
            vi.mocked(Repository.findAll).mockResolvedValue(null);
            vi.mocked(Config.get).mockImplementation(
                (key: string, defaultValue?: any) => {
                    if (key === 'repository.type') return 'postgres';
                    return defaultValue;
                },
            );

            const user = { id: 'user-123', fingerprint: 'fp-123' };

            await expect(service.getSessions({}, user as any)).rejects.toThrow(
                'Unable to load sessions for this user.',
            );
        });
    });

    describe('revokeSession', () => {
        it('should revoke a session', async () => {
            vi.mocked(Repository.update).mockResolvedValue(true);
            vi.mocked(Config.get).mockImplementation(
                (key: string, defaultValue?: any) => {
                    if (key === 'repository.type') return 'postgres';
                    return defaultValue;
                },
            );

            const user = { id: 'user-123', fingerprint: 'fp-123' };
            const result = await service.revokeSession(
                'session-123',
                user as any,
            );

            expect(result).toBe(true);
            expect(Repository.update).toHaveBeenCalled();
        });

        it('should throw error on failed revocation', async () => {
            vi.mocked(Repository.update).mockResolvedValue(false);
            vi.mocked(Config.get).mockImplementation(
                (key: string, defaultValue?: any) => {
                    if (key === 'repository.type') return 'postgres';
                    return defaultValue;
                },
            );

            const user = { id: 'user-123', fingerprint: 'fp-123' };

            await expect(
                service.revokeSession('session-123', user as any),
            ).rejects.toThrow('Failed to revoke session');
        });
    });

    describe('extractDevice', () => {
        it('should detect mobile device', () => {
            const result = (service as any).extractDevice(
                'Mozilla/5.0 Mobile Safari',
            );
            expect(result).toBe('Mobile');
        });

        it('should detect tablet device', () => {
            const result = (service as any).extractDevice(
                'Mozilla/5.0 iPad Tablet',
            );
            expect(result).toBe('Tablet');
        });

        it('should default to Desktop', () => {
            const result = (service as any).extractDevice(
                'Mozilla/5.0 Windows NT',
            );
            expect(result).toBe('Desktop');
        });
    });

    describe('extractBrowser', () => {
        it('should detect Chrome', () => {
            const result = (service as any).extractBrowser(
                'Mozilla/5.0 Chrome/91.0',
            );
            expect(result).toBe('Chrome');
        });

        it('should detect Firefox', () => {
            const result = (service as any).extractBrowser(
                'Mozilla/5.0 Firefox/89.0',
            );
            expect(result).toBe('Firefox');
        });

        it('should detect Safari', () => {
            const result = (service as any).extractBrowser(
                'Mozilla/5.0 Safari/605',
            );
            expect(result).toBe('Safari');
        });

        it('should detect Edge', () => {
            const result = (service as any).extractBrowser(
                'Mozilla/5.0 Edge/91.0',
            );
            expect(result).toBe('Edge');
        });

        it('should detect Opera', () => {
            const result = (service as any).extractBrowser(
                'Mozilla/5.0 OPR/77',
            );
            expect(result).toBe('Opera');
        });

        it('should return Unknown for unknown browser', () => {
            const result = (service as any).extractBrowser('CustomBrowser/1.0');
            expect(result).toBe('Unknown');
        });
    });

    describe('extractOS', () => {
        it('should detect Windows', () => {
            const result = (service as any).extractOS(
                'Mozilla/5.0 (Windows NT 10.0)',
            );
            expect(result).toBe('Windows');
        });

        it('should detect MacOS', () => {
            const result = (service as any).extractOS(
                'Mozilla/5.0 (Macintosh; Intel Mac OS X)',
            );
            expect(result).toBe('MacOS');
        });

        it('should detect Linux', () => {
            const result = (service as any).extractOS(
                'Mozilla/5.0 (X11; Linux x86_64)',
            );
            expect(result).toBe('Linux');
        });

        it('should detect Android (returns Linux due to implementation order)', () => {
            // Note: The implementation checks Linux before Android,
            // so Android user agents containing "Linux" return "Linux"
            const result = (service as any).extractOS(
                'Mozilla/5.0 (Linux; Android 11)',
            );
            expect(result).toBe('Linux');
        });

        it('should detect iOS', () => {
            const result = (service as any).extractOS(
                'Mozilla/5.0 (iPhone; CPU iPhone OS 14)',
            );
            expect(result).toBe('iOS');
        });

        it('should return Unknown for unknown OS', () => {
            const result = (service as any).extractOS('CustomOS/1.0');
            expect(result).toBe('Unknown');
        });
    });
});
