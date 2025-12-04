import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';

// Mock @cmmv/core
vi.mock('@cmmv/core', () => ({
    Service: vi.fn(() => (target: any) => target),
    AbstractService: class MockAbstractService {},
    Application: {
        getModel: vi.fn(() => ({
            fromEntities: vi.fn((data) => data),
        })),
    },
}));

// Mock @cmmv/http
vi.mock('@cmmv/http', () => ({
    HttpException: class MockHttpException extends Error {
        constructor(message: string, public status: number) {
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
}));

// Mock @cmmv/repository
vi.mock('@cmmv/repository', () => ({
    Repository: {
        getEntity: vi.fn(() => 'GroupsEntity'),
        findAll: vi.fn().mockResolvedValue({ data: [], count: 0 }),
        findBy: vi.fn().mockResolvedValue(null),
        exists: vi.fn().mockResolvedValue(false),
        insert: vi.fn().mockResolvedValue({ success: true }),
        updateById: vi.fn().mockResolvedValue(true),
        delete: vi.fn().mockResolvedValue(true),
        queryBuilder: vi.fn((query) => query),
    },
}));

import { AuthGroupsService } from '../services/groups.service';
import { Application } from '@cmmv/core';
import { Repository } from '@cmmv/repository';

describe('AuthGroupsService', () => {
    let service: AuthGroupsService;

    beforeEach(() => {
        vi.clearAllMocks();
        service = new AuthGroupsService();
    });

    afterEach(() => {
        vi.clearAllMocks();
    });

    describe('getAllGroups', () => {
        it('should return all groups', async () => {
            const mockGroups = { data: [{ id: '1', name: 'Admin', roles: ['admin:*'] }], count: 1 };
            vi.mocked(Repository.findAll).mockResolvedValue(mockGroups);
            vi.mocked(Application.getModel).mockReturnValue({
                fromEntities: vi.fn((data) => data),
            });

            const result = await service.getAllGroups();

            expect(result.data).toEqual(mockGroups.data);
            expect(Repository.findAll).toHaveBeenCalled();
        });

        it('should return empty array when no groups', async () => {
            vi.mocked(Repository.findAll).mockResolvedValue({ data: [], count: 0 });

            const result = await service.getAllGroups();

            expect(result.data).toEqual([]);
        });
    });

    describe('getGroupsIn', () => {
        it('should throw error when inArr is undefined', async () => {
            await expect(service.getGroupsIn(undefined as any))
                .rejects.toThrow('Ids must be defined in the URL query');
        });

        it('should get groups by array of ids', async () => {
            const mockGroups = { data: [{ id: '1', name: 'Admin' }, { id: '2', name: 'User' }], count: 2 };
            vi.mocked(Repository.findAll).mockResolvedValue(mockGroups);

            const result = await service.getGroupsIn(['1', '2']);

            expect(result.data).toEqual(mockGroups.data);
            expect(Repository.findAll).toHaveBeenCalled();
        });

        it('should handle single id string', async () => {
            const mockGroups = { data: [{ id: '1', name: 'Admin' }], count: 1 };
            vi.mocked(Repository.findAll).mockResolvedValue(mockGroups);

            const result = await service.getGroupsIn('1');

            expect(result.data).toEqual(mockGroups.data);
        });
    });

    describe('createGroup', () => {
        it('should throw error if group name already exists', async () => {
            vi.mocked(Repository.exists).mockResolvedValue(true);

            await expect(service.createGroup({ name: 'Admin', roles: ['admin:*'] }))
                .rejects.toThrow('Group name already exists');
        });

        it('should create group successfully', async () => {
            vi.mocked(Repository.exists).mockResolvedValue(false);
            vi.mocked(Repository.insert).mockResolvedValue({ success: true });

            const result = await service.createGroup({ name: 'Admin', roles: ['admin:*'] });

            expect(result).toEqual({ message: 'Group created successfully' });
            expect(Repository.insert).toHaveBeenCalled();
        });

        it('should handle string role (convert to array)', async () => {
            vi.mocked(Repository.exists).mockResolvedValue(false);
            vi.mocked(Repository.insert).mockResolvedValue({ success: true });

            const result = await service.createGroup({ name: 'User', roles: 'user:read' as any });

            expect(result).toEqual({ message: 'Group created successfully' });
        });

        it('should throw error on failed insert', async () => {
            vi.mocked(Repository.exists).mockResolvedValue(false);
            vi.mocked(Repository.insert).mockResolvedValue({ success: false });

            await expect(service.createGroup({ name: 'Admin', roles: ['admin:*'] }))
                .rejects.toThrow('Failed to create group');
        });
    });

    describe('updateGroup', () => {
        it('should throw error if group not found', async () => {
            vi.mocked(Repository.findBy).mockResolvedValue(null);

            await expect(service.updateGroup('group-123', { name: 'Updated' }))
                .rejects.toThrow('Group not found');
        });

        it('should update group successfully', async () => {
            vi.mocked(Repository.findBy).mockResolvedValue({ id: 'group-123', name: 'Admin', roles: [] });
            vi.mocked(Repository.updateById).mockResolvedValue(true);

            const result = await service.updateGroup('group-123', { name: 'UpdatedAdmin', roles: ['admin:*'] });

            expect(result).toEqual({ message: 'Group updated successfully' });
            expect(Repository.updateById).toHaveBeenCalled();
        });

        it('should throw error on failed update', async () => {
            vi.mocked(Repository.findBy).mockResolvedValue({ id: 'group-123', name: 'Admin', roles: [] });
            vi.mocked(Repository.updateById).mockResolvedValue(false);

            await expect(service.updateGroup('group-123', { name: 'Updated' }))
                .rejects.toThrow('Failed to update group');
        });
    });

    describe('deleteGroup', () => {
        it('should throw error if group not found', async () => {
            vi.mocked(Repository.findBy).mockResolvedValue(null);

            await expect(service.deleteGroup('group-123'))
                .rejects.toThrow('Group not found');
        });

        it('should delete group successfully', async () => {
            vi.mocked(Repository.findBy).mockResolvedValue({ id: 'group-123', name: 'Admin' });
            vi.mocked(Repository.delete).mockResolvedValue(true);

            const result = await service.deleteGroup('group-123');

            expect(result).toEqual({ message: 'Group deleted successfully' });
            expect(Repository.delete).toHaveBeenCalledWith('GroupsEntity', 'group-123');
        });

        it('should throw error on failed delete', async () => {
            vi.mocked(Repository.findBy).mockResolvedValue({ id: 'group-123', name: 'Admin' });
            vi.mocked(Repository.delete).mockResolvedValue(false);

            await expect(service.deleteGroup('group-123'))
                .rejects.toThrow('Failed to delete group');
        });
    });

    describe('assignRolesToGroup', () => {
        it('should throw error if group not found', async () => {
            vi.mocked(Repository.findBy).mockResolvedValue(null);

            await expect(service.assignRolesToGroup('group-123', ['admin:*']))
                .rejects.toThrow('Group not found');
        });

        it('should assign roles successfully', async () => {
            vi.mocked(Repository.findBy).mockResolvedValue({
                id: 'group-123',
                name: 'Admin',
                roles: ['user:read'],
            });
            vi.mocked(Repository.updateById).mockResolvedValue(true);

            const result = await service.assignRolesToGroup('group-123', ['admin:*']);

            expect(result).toEqual({ message: 'Roles assigned to group successfully' });
        });

        it('should merge roles without duplicates', async () => {
            vi.mocked(Repository.findBy).mockResolvedValue({
                id: 'group-123',
                name: 'Admin',
                roles: ['user:read'],
            });
            vi.mocked(Repository.updateById).mockResolvedValue(true);

            await service.assignRolesToGroup('group-123', ['user:read', 'admin:*']);

            expect(Repository.updateById).toHaveBeenCalledWith(
                'GroupsEntity',
                'group-123',
                { roles: expect.arrayContaining(['user:read', 'admin:*']) }
            );
        });

        it('should handle single role string', async () => {
            vi.mocked(Repository.findBy).mockResolvedValue({
                id: 'group-123',
                name: 'Admin',
                roles: [],
            });
            vi.mocked(Repository.updateById).mockResolvedValue(true);

            const result = await service.assignRolesToGroup('group-123', 'admin:*');

            expect(result).toEqual({ message: 'Roles assigned to group successfully' });
        });

        it('should throw error on failed update', async () => {
            vi.mocked(Repository.findBy).mockResolvedValue({
                id: 'group-123',
                name: 'Admin',
                roles: [],
            });
            vi.mocked(Repository.updateById).mockResolvedValue(false);

            await expect(service.assignRolesToGroup('group-123', ['admin:*']))
                .rejects.toThrow('Failed to assign roles to group');
        });
    });

    describe('removeRolesFromGroup', () => {
        it('should throw error if group not found', async () => {
            vi.mocked(Repository.findBy).mockResolvedValue(null);

            await expect(service.removeRolesFromGroup('group-123', ['admin:*']))
                .rejects.toThrow('Group not found');
        });

        it('should remove roles successfully', async () => {
            vi.mocked(Repository.findBy).mockResolvedValue({
                id: 'group-123',
                name: 'Admin',
                roles: ['user:read', 'admin:*'],
            });
            vi.mocked(Repository.updateById).mockResolvedValue(true);

            const result = await service.removeRolesFromGroup('group-123', ['admin:*']);

            expect(result).toEqual({ message: 'Roles removed from group successfully' });
            expect(Repository.updateById).toHaveBeenCalledWith(
                'GroupsEntity',
                'group-123',
                { roles: ['user:read'] }
            );
        });

        it('should handle single role string', async () => {
            vi.mocked(Repository.findBy).mockResolvedValue({
                id: 'group-123',
                name: 'Admin',
                roles: ['user:read', 'admin:*'],
            });
            vi.mocked(Repository.updateById).mockResolvedValue(true);

            const result = await service.removeRolesFromGroup('group-123', 'admin:*');

            expect(result).toEqual({ message: 'Roles removed from group successfully' });
        });

        it('should throw error on failed update', async () => {
            vi.mocked(Repository.findBy).mockResolvedValue({
                id: 'group-123',
                name: 'Admin',
                roles: ['admin:*'],
            });
            vi.mocked(Repository.updateById).mockResolvedValue(false);

            await expect(service.removeRolesFromGroup('group-123', ['admin:*']))
                .rejects.toThrow('Failed to remove roles from group');
        });
    });

    describe('GraphQL Handlers', () => {
        describe('handlerGroupGetAll', () => {
            it('should return all groups', async () => {
                const mockGroups = { data: [{ id: '1', name: 'Admin' }], count: 1 };
                vi.mocked(Repository.findAll).mockResolvedValue(mockGroups);

                const result = await service.handlerGroupGetAll({}, {});

                expect(result.success).toBe(true);
                expect(result.data).toBeDefined();
            });
        });

        describe('handlerGroupGetIn', () => {
            it('should return groups by ids', async () => {
                const mockGroups = { data: [{ id: '1', name: 'Admin' }], count: 1 };
                vi.mocked(Repository.findAll).mockResolvedValue(mockGroups);

                const result = await service.handlerGroupGetIn({ ids: ['1'] }, {});

                expect(result.success).toBe(true);
                expect(result.data).toBeDefined();
            });
        });

        describe('handlerCreateGroup', () => {
            it('should create group and return success', async () => {
                vi.mocked(Repository.exists).mockResolvedValue(false);
                vi.mocked(Repository.insert).mockResolvedValue({ success: true });

                const result = await service.handlerCreateGroup({ name: 'Admin', roles: [] }, {});

                expect(result.success).toBe(true);
                expect(result.message).toBe('Group created successfully');
            });
        });

        describe('handlerUpdateGroup', () => {
            it('should update group and return success', async () => {
                vi.mocked(Repository.findBy).mockResolvedValue({ id: 'group-123', name: 'Old', roles: [] });
                vi.mocked(Repository.updateById).mockResolvedValue(true);

                const result = await service.handlerUpdateGroup({ groupId: 'group-123', name: 'New' }, {});

                expect(result.success).toBe(true);
                expect(result.message).toBe('Group updated successfully');
            });
        });

        describe('handlerDeleteGroup', () => {
            it('should delete group and return success', async () => {
                vi.mocked(Repository.findBy).mockResolvedValue({ id: 'group-123', name: 'Admin' });
                vi.mocked(Repository.delete).mockResolvedValue(true);

                const result = await service.handlerDeleteGroup({ groupId: 'group-123' }, {});

                expect(result.success).toBe(true);
                expect(result.message).toBe('Group deleted successfully');
            });
        });

        describe('handlerAssignRolesToGroup', () => {
            it('should assign roles and return success', async () => {
                vi.mocked(Repository.findBy).mockResolvedValue({
                    id: 'group-123',
                    name: 'Admin',
                    roles: [],
                });
                vi.mocked(Repository.updateById).mockResolvedValue(true);

                const result = await service.handlerAssignRolesToGroup(
                    { groupId: 'group-123', roles: ['admin:*'] },
                    {}
                );

                expect(result.success).toBe(true);
                expect(result.message).toBe('Roles assigned to group successfully');
            });
        });

        describe('handlerRemoveRolesFromGroup', () => {
            it('should remove roles and return success', async () => {
                vi.mocked(Repository.findBy).mockResolvedValue({
                    id: 'group-123',
                    name: 'Admin',
                    roles: ['admin:*'],
                });
                vi.mocked(Repository.updateById).mockResolvedValue(true);

                const result = await service.handlerRemoveRolesFromGroup(
                    { groupId: 'group-123', roles: ['admin:*'] },
                    {}
                );

                expect(result.success).toBe(true);
                expect(result.message).toBe('Roles removed from group successfully');
            });
        });
    });
});
