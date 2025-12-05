import { describe, it, expect, beforeEach, vi } from 'vitest';
import { AuthUsersController } from '../../controllers/users.controller';
import { AuthUsersService } from '../../services/users.service';
import * as fs from 'fs';
import * as path from 'path';
import { Config } from '@cmmv/core';

vi.mock('fs');
vi.mock('path');
vi.mock('@cmmv/core', async (importOriginal) => {
    const actual = await importOriginal();
    return {
        ...(actual as any),
        Config: {
            get: vi.fn(),
        },
    };
});

describe('AuthUsersController', () => {
    let controller: AuthUsersController;
    let mockUsersService: Partial<AuthUsersService>;
    let mockRes: any;

    beforeEach(() => {
        vi.clearAllMocks();

        mockUsersService = {
            blockUser: vi.fn(),
            unblockUser: vi.fn(),
            assignGroupsToUser: vi.fn(),
            removeGroupsFromUser: vi.fn(),
        };

        mockRes = {
            res: {
                writeHead: vi.fn(),
                end: vi.fn(),
            },
        };

        controller = new AuthUsersController(
            mockUsersService as AuthUsersService,
        );
    });

    describe('user', () => {
        it('should return the current user', async () => {
            const user = {
                id: 'user-1',
                username: 'testuser',
                email: 'test@test.com',
            };

            const result = await controller.user(user);

            expect(result).toEqual(user);
        });
    });

    describe('handlerUnsubscribe', () => {
        it('should render unsubscribe template from custom path', async () => {
            const customTemplate = '/custom/path/unsubscribe.html';
            const templateContent = '<html>Unsubscribe Page</html>';

            vi.mocked(Config.get).mockReturnValue(customTemplate);
            vi.mocked(fs.existsSync).mockReturnValue(true);
            vi.mocked(fs.readFileSync).mockReturnValue(templateContent);

            const result = await controller.handlerUnsubscribe(
                'user-1',
                'token-123',
                mockRes,
            );

            expect(result).toBe(false);
            expect(mockRes.res.writeHead).toHaveBeenCalledWith(200, {
                'Content-Type': 'text/html',
                'Content-Length': templateContent.length,
            });
            expect(mockRes.res.end).toHaveBeenCalledWith(templateContent);
        });

        it('should render default unsubscribe template when no custom path', async () => {
            const templateContent = '<html>Default Unsubscribe</html>';
            const defaultPath = '/default/templates/unsubscribe.html';

            vi.mocked(Config.get).mockReturnValue(undefined);
            vi.mocked(path.join).mockReturnValue(defaultPath);
            vi.mocked(fs.existsSync).mockReturnValue(true);
            vi.mocked(fs.readFileSync).mockReturnValue(templateContent);

            const result = await controller.handlerUnsubscribe(
                'user-1',
                'token-123',
                mockRes,
            );

            expect(result).toBe(false);
            expect(mockRes.res.end).toHaveBeenCalledWith(templateContent);
        });

        it('should throw HttpException when template not found', async () => {
            vi.mocked(Config.get).mockReturnValue(undefined);
            vi.mocked(path.join).mockReturnValue('/some/path');
            vi.mocked(fs.existsSync).mockReturnValue(false);

            await expect(
                controller.handlerUnsubscribe('user-1', 'token-123', mockRes),
            ).rejects.toThrow('Template not found');
        });
    });

    describe('handlerBlockUser', () => {
        it('should block a user', async () => {
            const blockResult = { success: true };
            vi.mocked(mockUsersService.blockUser).mockResolvedValue(
                blockResult as any,
            );

            const result = await controller.handlerBlockUser('user-123');

            expect(result).toEqual(blockResult);
            expect(mockUsersService.blockUser).toHaveBeenCalledWith('user-123');
        });
    });

    describe('handlerUnblockUser', () => {
        it('should unblock a user', async () => {
            const unblockResult = { success: true };
            vi.mocked(mockUsersService.unblockUser).mockResolvedValue(
                unblockResult as any,
            );

            const result = await controller.handlerUnblockUser('user-123');

            expect(result).toEqual(unblockResult);
            expect(mockUsersService.unblockUser).toHaveBeenCalledWith(
                'user-123',
            );
        });
    });

    describe('handlerAssignGroupsToUser', () => {
        it('should assign groups to user with string group', async () => {
            const assignResult = { success: true };
            vi.mocked(mockUsersService.assignGroupsToUser).mockResolvedValue(
                assignResult as any,
            );

            const result = await controller.handlerAssignGroupsToUser(
                'user-123',
                {
                    groups: 'group-1',
                },
            );

            expect(result).toEqual(assignResult);
            expect(mockUsersService.assignGroupsToUser).toHaveBeenCalledWith(
                'user-123',
                'group-1',
            );
        });

        it('should assign multiple groups to user with array', async () => {
            const assignResult = { success: true };
            vi.mocked(mockUsersService.assignGroupsToUser).mockResolvedValue(
                assignResult as any,
            );

            const result = await controller.handlerAssignGroupsToUser(
                'user-123',
                {
                    groups: ['group-1', 'group-2'],
                },
            );

            expect(result).toEqual(assignResult);
            expect(mockUsersService.assignGroupsToUser).toHaveBeenCalledWith(
                'user-123',
                ['group-1', 'group-2'],
            );
        });
    });

    describe('handlerRemoveGroups', () => {
        it('should remove groups from user', async () => {
            const removeResult = { success: true };
            vi.mocked(mockUsersService.removeGroupsFromUser).mockResolvedValue(
                removeResult as any,
            );

            const result = await controller.handlerRemoveGroups('user-123', {
                groups: 'group-1',
            });

            expect(result).toEqual(removeResult);
            expect(mockUsersService.removeGroupsFromUser).toHaveBeenCalledWith(
                'user-123',
                'group-1',
            );
        });

        it('should remove multiple groups from user', async () => {
            const removeResult = { success: true };
            vi.mocked(mockUsersService.removeGroupsFromUser).mockResolvedValue(
                removeResult as any,
            );

            const result = await controller.handlerRemoveGroups('user-123', {
                groups: ['group-1', 'group-2'],
            });

            expect(result).toEqual(removeResult);
            expect(mockUsersService.removeGroupsFromUser).toHaveBeenCalledWith(
                'user-123',
                ['group-1', 'group-2'],
            );
        });
    });
});
