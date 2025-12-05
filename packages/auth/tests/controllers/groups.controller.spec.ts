import { describe, it, expect, beforeEach, vi } from 'vitest';
import { AuthGroupsController } from '../../controllers/groups.controller';
import { AuthGroupsService } from '../../services/groups.service';

describe('AuthGroupsController', () => {
    let controller: AuthGroupsController;
    let mockGroupsService: Partial<AuthGroupsService>;

    beforeEach(() => {
        vi.clearAllMocks();

        mockGroupsService = {
            getAllGroups: vi.fn(),
            getGroupsIn: vi.fn(),
            createGroup: vi.fn(),
            updateGroup: vi.fn(),
            deleteGroup: vi.fn(),
            assignRolesToGroup: vi.fn(),
            removeRolesFromGroup: vi.fn(),
        };

        controller = new AuthGroupsController(
            mockGroupsService as AuthGroupsService,
        );
    });

    describe('handlerGroupGetAll', () => {
        it('should return all groups', async () => {
            const groups = [
                { id: '1', name: 'Admins', roles: ['admin'] },
                { id: '2', name: 'Users', roles: ['user'] },
            ];
            vi.mocked(mockGroupsService.getAllGroups).mockResolvedValue(
                groups as any,
            );

            const result = await controller.handlerGroupGetAll();

            expect(result).toEqual(groups);
            expect(mockGroupsService.getAllGroups).toHaveBeenCalled();
        });
    });

    describe('handlerGroupGetIn', () => {
        it('should return groups by ids as string', async () => {
            const groups = [{ id: '1', name: 'Admins' }];
            vi.mocked(mockGroupsService.getGroupsIn).mockResolvedValue(
                groups as any,
            );

            const result = await controller.handlerGroupGetIn('1');

            expect(result).toEqual(groups);
            expect(mockGroupsService.getGroupsIn).toHaveBeenCalledWith('1');
        });

        it('should return groups by ids as array', async () => {
            const groups = [
                { id: '1', name: 'Admins' },
                { id: '2', name: 'Users' },
            ];
            vi.mocked(mockGroupsService.getGroupsIn).mockResolvedValue(
                groups as any,
            );

            const result = await controller.handlerGroupGetIn(['1', '2']);

            expect(result).toEqual(groups);
            expect(mockGroupsService.getGroupsIn).toHaveBeenCalledWith([
                '1',
                '2',
            ]);
        });
    });

    describe('handlerCreateGroup', () => {
        it('should create a new group', async () => {
            const newGroup = { id: '3', name: 'Moderators', roles: [] };
            vi.mocked(mockGroupsService.createGroup).mockResolvedValue(
                newGroup as any,
            );

            const payload = { name: 'Moderators', roles: [] };
            const result = await controller.handlerCreateGroup(payload);

            expect(result).toEqual(newGroup);
            expect(mockGroupsService.createGroup).toHaveBeenCalledWith(payload);
        });
    });

    describe('handlerUpdateGroup', () => {
        it('should update a group', async () => {
            const updatedGroup = {
                id: '1',
                name: 'Super Admins',
                roles: ['admin', 'superadmin'],
            };
            vi.mocked(mockGroupsService.updateGroup).mockResolvedValue(
                updatedGroup as any,
            );

            const payload = {
                name: 'Super Admins',
                roles: ['admin', 'superadmin'],
            };
            const result = await controller.handlerUpdateGroup('1', payload);

            expect(result).toEqual(updatedGroup);
            expect(mockGroupsService.updateGroup).toHaveBeenCalledWith(
                '1',
                payload,
            );
        });
    });

    describe('handlerDeleteGroup', () => {
        it('should delete a group', async () => {
            vi.mocked(mockGroupsService.deleteGroup).mockResolvedValue({
                affected: 1,
            } as any);

            const result = await controller.handlerDeleteGroup('1');

            expect(result).toEqual({ affected: 1 });
            expect(mockGroupsService.deleteGroup).toHaveBeenCalledWith('1');
        });
    });

    describe('handlerAssignRolesToGroup', () => {
        it('should assign roles to a group', async () => {
            const updatedGroup = { id: '1', roles: ['admin', 'moderator'] };
            vi.mocked(mockGroupsService.assignRolesToGroup).mockResolvedValue(
                updatedGroup as any,
            );

            const result = await controller.handlerAssignRolesToGroup('1', {
                roles: ['moderator'],
            });

            expect(result).toEqual(updatedGroup);
            expect(mockGroupsService.assignRolesToGroup).toHaveBeenCalledWith(
                '1',
                ['moderator'],
            );
        });
    });

    describe('handlerRemoveRolesFromGroup', () => {
        it('should remove roles from a group', async () => {
            const updatedGroup = { id: '1', roles: ['admin'] };
            vi.mocked(mockGroupsService.removeRolesFromGroup).mockResolvedValue(
                updatedGroup as any,
            );

            const result = await controller.handlerRemoveRolesFromGroup('1', {
                roles: ['moderator'],
            });

            expect(result).toEqual(updatedGroup);
            expect(mockGroupsService.removeRolesFromGroup).toHaveBeenCalledWith(
                '1',
                ['moderator'],
            );
        });
    });
});
