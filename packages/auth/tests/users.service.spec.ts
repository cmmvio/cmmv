import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';

// Mock crypto
vi.mock('node:crypto', () => ({
    createHash: vi.fn(() => ({
        update: vi.fn().mockReturnThis(),
        digest: vi.fn().mockReturnValue('mock-password-hash'),
    })),
    default: {
        createHash: vi.fn(() => ({
            update: vi.fn().mockReturnThis(),
            digest: vi.fn().mockReturnValue('mock-password-hash'),
        })),
    },
}));

// Mock fs
vi.mock('node:fs', () => ({
    existsSync: vi.fn().mockReturnValue(true),
    readFileSync: vi.fn().mockReturnValue('<html>template</html>'),
    default: {
        existsSync: vi.fn().mockReturnValue(true),
        readFileSync: vi.fn().mockReturnValue('<html>template</html>'),
    },
}));

// Mock path
vi.mock('node:path', () => ({
    join: vi.fn((...args) => args.join('/')),
    default: {
        join: vi.fn((...args) => args.join('/')),
    },
}));

// Mock uuid
vi.mock('uuid', () => ({
    v4: vi.fn().mockReturnValue('mock-uuid-v4'),
}));

// Mock @cmmv/core
vi.mock('@cmmv/core', () => ({
    Service: vi.fn(() => (target: any) => target),
    AbstractService: class MockAbstractService {},
    Resolver: vi.fn(() => (target: any, key: string) => {}),
    Application: {
        getModel: vi.fn(() => ({
            fromEntities: vi.fn((data) => data),
        })),
    },
    Config: {
        get: vi.fn((key: string, defaultValue?: any) => {
            return defaultValue;
        }),
    },
    Module: {
        hasModule: vi.fn(() => false),
    },
}));

// Mock @cmmv/http
vi.mock('@cmmv/http', () => ({
    HttpException: class MockHttpException extends Error {
        constructor(
            message: string,
            public status: number,
        ) {
            super(message);
            this.name = 'HttpException';
        }
    },
    HttpStatus: {
        OK: 200,
        BAD_REQUEST: 400,
        NOT_FOUND: 404,
        INTERNAL_SERVER_ERROR: 500,
    },
    CMMVRenderer: vi.fn(),
}));

// Mock @cmmv/repository
vi.mock('@cmmv/repository', () => ({
    Repository: {
        getEntity: vi.fn(() => 'MockEntity'),
        findBy: vi.fn().mockResolvedValue(null),
        findOne: vi.fn().mockResolvedValue(null),
        findAll: vi.fn().mockResolvedValue({ data: [], count: 0 }),
        update: vi.fn().mockResolvedValue(1),
        updateById: vi.fn().mockResolvedValue(true),
        queryBuilder: vi.fn((query) => query),
    },
}));

// Mock one-time-token service
vi.mock('./one-time-token.service', () => ({
    AuthOneTimeTokenService: class MockOneTimeTokenService {
        createOneTimeToken = vi
            .fn()
            .mockResolvedValue('http://localhost/reset?token=abc123');
    },
}));

// Mock location service
vi.mock('./location.service', () => ({
    AuthLocationService: class MockLocationService {
        getLocation = vi.fn().mockResolvedValue('New York, US');
    },
}));

// Mock email service
vi.mock('./email.service', () => ({
    AuthEmailService: class MockEmailService {
        sendEmail = vi.fn().mockResolvedValue(true);
    },
}));

import { AuthUsersService } from '../services/users.service';
import { Repository } from '@cmmv/repository';
import * as fs from 'node:fs';

describe('AuthUsersService', () => {
    let service: AuthUsersService;
    let mockOneTimeTokenService: any;
    let mockLocationService: any;
    let mockEmailService: any;

    const mockReq = {
        ip: '127.0.0.1',
        headers: {
            'user-agent': 'Mozilla/5.0',
        },
    };

    const mockRes = {
        res: {
            writeHead: vi.fn(),
            end: vi.fn(),
        },
    };

    beforeEach(() => {
        vi.clearAllMocks();

        mockOneTimeTokenService = {
            createOneTimeToken: vi
                .fn()
                .mockResolvedValue('http://localhost/reset?token=abc123'),
        };

        mockLocationService = {
            getLocation: vi.fn().mockResolvedValue('New York, US'),
        };

        mockEmailService = {
            sendEmail: vi.fn().mockResolvedValue(true),
        };

        service = new AuthUsersService(
            mockOneTimeTokenService,
            mockLocationService,
            mockEmailService,
        );
    });

    afterEach(() => {
        vi.clearAllMocks();
    });

    describe('getUserById', () => {
        it('should return user when found', async () => {
            const mockUser = {
                id: 'user-123',
                username: 'testuser',
                blocked: false,
            };
            vi.mocked(Repository.findBy).mockResolvedValue(mockUser);

            const result = await service.getUserById('user-123');

            expect(result).toEqual(mockUser);
            expect(Repository.findBy).toHaveBeenCalled();
        });

        it('should return null when user not found', async () => {
            vi.mocked(Repository.findBy).mockResolvedValue(null);

            const result = await service.getUserById('non-existent');

            expect(result).toBeNull();
        });
    });

    describe('validateEmail', () => {
        it('should update user email verification status', async () => {
            vi.mocked(Repository.updateById).mockResolvedValue(true);

            const result = await service.validateEmail('user-123', mockRes);

            expect(Repository.updateById).toHaveBeenCalledWith(
                'MockEntity',
                'user-123',
                { verifyEmail: true },
            );
            expect(mockRes.res.writeHead).toHaveBeenCalledWith(
                200,
                expect.any(Object),
            );
            expect(result).toBe(false);
        });

        it('should throw error when template not found', async () => {
            vi.mocked(fs.existsSync).mockReturnValue(false);

            await expect(
                service.validateEmail('user-123', mockRes),
            ).rejects.toThrow('Template not found');
        });
    });

    describe('forgotPassword', () => {
        it('should throw error when user not found', async () => {
            vi.mocked(Repository.findOne).mockResolvedValue(null);

            await expect(
                service.forgotPassword('unknown@email.com'),
            ).rejects.toThrow('User not found');
        });

        it('should throw error when reset requested too recently', async () => {
            vi.mocked(Repository.findOne).mockResolvedValue({
                id: 'user-123',
                email: 'test@email.com',
                forgotPasswordToken: 'existing-token',
                forgotSendAt: Date.now() - 1000, // Just sent
            });

            await expect(
                service.forgotPassword('test@email.com'),
            ).rejects.toThrow(
                'You can only request a password reset once every 1 hours',
            );
        });

        it('should send forgot password email successfully', async () => {
            vi.mocked(Repository.findOne).mockResolvedValue({
                id: 'user-123',
                email: 'test@email.com',
                forgotPasswordToken: null,
                forgotSendAt: null,
            });
            vi.mocked(Repository.updateById).mockResolvedValue(true);

            const result = await service.forgotPassword('test@email.com');

            expect(result).toEqual({
                message: 'Reset password email sent successfully',
            });
            expect(mockEmailService.sendEmail).toHaveBeenCalled();
        });

        it('should send email when previous request expired', async () => {
            vi.mocked(Repository.findOne).mockResolvedValue({
                id: 'user-123',
                email: 'test@email.com',
                forgotPasswordToken: 'old-token',
                forgotSendAt: Date.now() - 2 * 60 * 60 * 1000, // 2 hours ago
            });
            vi.mocked(Repository.updateById).mockResolvedValue(true);

            const result = await service.forgotPassword('test@email.com');

            expect(result).toEqual({
                message: 'Reset password email sent successfully',
            });
        });
    });

    describe('changePasswordByLink', () => {
        it('should change password successfully', async () => {
            vi.mocked(Repository.updateById).mockResolvedValue(true);

            const result = await service.changePasswordByLink(
                'user-123',
                'test@email.com',
                'newpassword123',
                mockReq,
            );

            expect(result).toBe(true);
            expect(Repository.updateById).toHaveBeenCalledWith(
                'MockEntity',
                'user-123',
                expect.objectContaining({
                    password: 'mock-password-hash',
                    forgotPasswordToken: null,
                }),
            );
            expect(mockEmailService.sendEmail).toHaveBeenCalled();
        });
    });

    describe('unsubscribeNewsletter', () => {
        it('should throw error when user not found', async () => {
            vi.mocked(Repository.findOne).mockResolvedValue(null);

            await expect(
                service.unsubscribeNewsletter('unknown@email.com'),
            ).rejects.toThrow('User not found');
        });

        it('should unsubscribe user successfully', async () => {
            vi.mocked(Repository.findOne).mockResolvedValue({
                id: 'user-123',
                email: 'test@email.com',
            });
            vi.mocked(Repository.updateById).mockResolvedValue(true);

            const result =
                await service.unsubscribeNewsletter('test@email.com');

            expect(result).toEqual({
                message: 'Newsletter unsubscribed successfully',
            });
            expect(Repository.updateById).toHaveBeenCalledWith(
                'MockEntity',
                'user-123',
                { unsubscribe: true },
            );
        });
    });

    describe('blockUser', () => {
        it('should throw error when user not found', async () => {
            vi.mocked(Repository.findBy).mockResolvedValue(null);

            await expect(service.blockUser('user-123')).rejects.toThrow(
                'User not found',
            );
        });

        it('should throw error when user already blocked', async () => {
            vi.mocked(Repository.findBy).mockResolvedValue({
                id: 'user-123',
                blocked: true,
            });

            await expect(service.blockUser('user-123')).rejects.toThrow(
                'User is already blocked',
            );
        });

        it('should block user successfully', async () => {
            vi.mocked(Repository.findBy).mockResolvedValue({
                id: 'user-123',
                blocked: false,
            });
            vi.mocked(Repository.update).mockResolvedValue(1);

            const result = await service.blockUser('user-123');

            expect(result).toEqual({ message: 'User blocked successfully' });
        });

        it('should throw error on failed block', async () => {
            vi.mocked(Repository.findBy).mockResolvedValue({
                id: 'user-123',
                blocked: false,
            });
            vi.mocked(Repository.update).mockResolvedValue(0);

            await expect(service.blockUser('user-123')).rejects.toThrow(
                'Failed to block user',
            );
        });
    });

    describe('unblockUser', () => {
        it('should throw error when user not found', async () => {
            vi.mocked(Repository.findBy).mockResolvedValue(null);

            await expect(service.unblockUser('user-123')).rejects.toThrow(
                'User not found',
            );
        });

        it('should throw error when user already unblocked', async () => {
            vi.mocked(Repository.findBy).mockResolvedValue({
                id: 'user-123',
                blocked: false,
            });

            await expect(service.unblockUser('user-123')).rejects.toThrow(
                'User is already unblocked',
            );
        });

        it('should unblock user successfully', async () => {
            vi.mocked(Repository.findBy).mockResolvedValue({
                id: 'user-123',
                blocked: true,
            });
            vi.mocked(Repository.update).mockResolvedValue(1);

            const result = await service.unblockUser('user-123');

            expect(result).toEqual({ message: 'User unblocked successfully' });
        });

        it('should throw error on failed unblock', async () => {
            vi.mocked(Repository.findBy).mockResolvedValue({
                id: 'user-123',
                blocked: true,
            });
            vi.mocked(Repository.update).mockResolvedValue(0);

            await expect(service.unblockUser('user-123')).rejects.toThrow(
                'Failed to unblock user',
            );
        });
    });

    describe('assignGroupsToUser', () => {
        it('should throw error when user not found', async () => {
            vi.mocked(Repository.findBy).mockResolvedValue(null);

            await expect(
                service.assignGroupsToUser('user-123', ['group-1']),
            ).rejects.toThrow('User not found');
        });

        it('should throw error for invalid groups', async () => {
            vi.mocked(Repository.findBy).mockResolvedValue({
                id: 'user-123',
                groups: [],
            });
            vi.mocked(Repository.findAll).mockResolvedValue({
                data: [],
                count: 0,
            });

            await expect(
                service.assignGroupsToUser('user-123', ['invalid-group']),
            ).rejects.toThrow('Invalid groups');
        });

        it('should assign groups successfully', async () => {
            vi.mocked(Repository.findBy).mockResolvedValue({
                id: 'user-123',
                groups: [],
            });
            vi.mocked(Repository.findAll).mockResolvedValue({
                data: [{ id: 'group-1' }],
                count: 1,
            });
            vi.mocked(Repository.updateById).mockResolvedValue(true);

            const result = await service.assignGroupsToUser('user-123', [
                'group-1',
            ]);

            expect(result).toEqual({
                message: 'Groups assigned to user successfully',
            });
        });

        it('should handle single group string', async () => {
            vi.mocked(Repository.findBy).mockResolvedValue({
                id: 'user-123',
                groups: [],
            });
            vi.mocked(Repository.findAll).mockResolvedValue({
                data: [{ id: 'group-1' }],
                count: 1,
            });
            vi.mocked(Repository.updateById).mockResolvedValue(true);

            const result = await service.assignGroupsToUser(
                'user-123',
                'group-1',
            );

            expect(result).toEqual({
                message: 'Groups assigned to user successfully',
            });
        });

        it('should throw error on failed update', async () => {
            vi.mocked(Repository.findBy).mockResolvedValue({
                id: 'user-123',
                groups: [],
            });
            vi.mocked(Repository.findAll).mockResolvedValue({
                data: [{ id: 'group-1' }],
                count: 1,
            });
            vi.mocked(Repository.updateById).mockResolvedValue(false);

            await expect(
                service.assignGroupsToUser('user-123', ['group-1']),
            ).rejects.toThrow('Failed to assign groups to user');
        });
    });

    describe('removeGroupsFromUser', () => {
        it('should throw error when user not found', async () => {
            vi.mocked(Repository.findBy).mockResolvedValue(null);

            await expect(
                service.removeGroupsFromUser('user-123', ['group-1']),
            ).rejects.toThrow('User not found');
        });

        it('should throw error for invalid groups', async () => {
            vi.mocked(Repository.findBy).mockResolvedValue({
                id: 'user-123',
                groups: ['group-1'],
            });
            vi.mocked(Repository.findAll).mockResolvedValue({
                data: [],
                count: 0,
            });

            await expect(
                service.removeGroupsFromUser('user-123', ['invalid-group']),
            ).rejects.toThrow('Invalid groups');
        });

        it('should remove groups successfully', async () => {
            vi.mocked(Repository.findBy).mockResolvedValue({
                id: 'user-123',
                groups: ['group-1', 'group-2'],
            });
            vi.mocked(Repository.findAll).mockResolvedValue({
                data: [{ id: 'group-1' }],
                count: 1,
            });
            vi.mocked(Repository.updateById).mockResolvedValue(true);

            const result = await service.removeGroupsFromUser('user-123', [
                'group-1',
            ]);

            expect(result).toEqual({
                success: true,
                message: 'Groups removed from user successfully',
            });
        });

        it('should throw error on failed update', async () => {
            vi.mocked(Repository.findBy).mockResolvedValue({
                id: 'user-123',
                groups: ['group-1'],
            });
            vi.mocked(Repository.findAll).mockResolvedValue({
                data: [{ id: 'group-1' }],
                count: 1,
            });
            vi.mocked(Repository.updateById).mockResolvedValue(false);

            await expect(
                service.removeGroupsFromUser('user-123', ['group-1']),
            ).rejects.toThrow('Failed to remove groups from user');
        });
    });

    describe('GraphQL Handlers', () => {
        describe('handlerBlockUser', () => {
            it('should block user and return success', async () => {
                vi.mocked(Repository.findBy).mockResolvedValue({
                    id: 'user-123',
                    blocked: false,
                });
                vi.mocked(Repository.update).mockResolvedValue(1);

                const result = await service.handlerBlockUser(
                    { userId: 'user-123' },
                    {},
                );

                expect(result.success).toBe(true);
                expect(result.message).toBe('User blocked successfully');
            });
        });

        describe('handlerUnblockUser', () => {
            it('should unblock user and return success', async () => {
                vi.mocked(Repository.findBy).mockResolvedValue({
                    id: 'user-123',
                    blocked: true,
                });
                vi.mocked(Repository.update).mockResolvedValue(1);

                const result = await service.handlerUnblockUser(
                    { userId: 'user-123' },
                    {},
                );

                expect(result.success).toBe(true);
                expect(result.message).toBe('User unblocked successfully');
            });
        });

        describe('handlerAssignGroupsToUser', () => {
            it('should assign groups and return success', async () => {
                vi.mocked(Repository.findBy).mockResolvedValue({
                    id: 'user-123',
                    groups: [],
                });
                vi.mocked(Repository.findAll).mockResolvedValue({
                    data: [{ id: 'group-1' }],
                    count: 1,
                });
                vi.mocked(Repository.updateById).mockResolvedValue(true);

                const result = await service.handlerAssignGroupsToUser(
                    { userId: 'user-123', groups: ['group-1'] },
                    {},
                );

                expect(result.success).toBe(true);
                expect(result.message).toBe(
                    'Groups assigned to user successfully',
                );
            });
        });

        describe('handlerRemoveGroups', () => {
            it('should remove groups and return success', async () => {
                vi.mocked(Repository.findBy).mockResolvedValue({
                    id: 'user-123',
                    groups: ['group-1'],
                });
                vi.mocked(Repository.findAll).mockResolvedValue({
                    data: [{ id: 'group-1' }],
                    count: 1,
                });
                vi.mocked(Repository.updateById).mockResolvedValue(true);

                const result = await service.handlerRemoveGroups(
                    { userId: 'user-123', groups: ['group-1'] },
                    {},
                );

                expect(result.success).toBe(true);
                expect(result.message).toBe(
                    'Groups removed from user successfully',
                );
            });
        });
    });

    describe('resolveGroups', () => {
        it('should resolve user groups with roles', async () => {
            const mockUser = {
                id: 'user-123',
                groups: ['group-1'],
                roles: ['existing-role'],
            };

            vi.mocked(Repository.findAll).mockResolvedValue({
                data: [{ id: 'group-1', roles: ['new-role'] }],
                count: 1,
            });

            const result = await AuthUsersService.resolveGroups(mockUser);

            expect(result.roles).toContain('existing-role');
        });

        it('should handle empty groups', async () => {
            const mockUser = {
                id: 'user-123',
                groups: [],
                roles: ['existing-role'],
            };

            const result = await AuthUsersService.resolveGroups(mockUser);

            expect(result.roles).toEqual(['existing-role']);
        });
    });
});
