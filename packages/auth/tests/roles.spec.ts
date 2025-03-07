import { describe, it, expect, beforeEach, vi } from 'vitest';
import { AuthAutorizationService } from '../services/autorization.service';
import { Repository } from '@cmmv/repository';
import { HttpException } from '@cmmv/http';

vi.mock('@cmmv/repository');

vi.mock('fast-json-stringify', async () => {
    const actual = await vi.importActual<any>('fast-json-stringify');
    return {
        default: vi
            .fn()
            .mockImplementation((schema: any) => actual.default(schema)),
    };
});

describe('AuthAutorizationService - Roles Management', () => {
    let authService: AuthAutorizationService;

    beforeEach(() => {
        authService = new AuthAutorizationService(
            {} as any, // Mock das dependências de sessão e recaptcha
            {} as any,
        );
    });

    const mockRolesResponse = {
        contracts: {
            User: {
                rootOnly: true,
                roles: ['user:get', 'user:insert', 'user:update'],
            },
            Order: {
                rootOnly: false,
                roles: ['order:get', 'order:insert', 'order:update'],
            },
        },
    };

    it('should return roles structure from getRoles', async () => {
        vi.spyOn(authService, 'getRoles').mockResolvedValue(mockRolesResponse);

        const result = await authService.getRoles();

        expect(result).toEqual(mockRolesResponse);
    });

    it('should return true for a valid role in hasRole', async () => {
        vi.spyOn(authService, 'getRoles').mockResolvedValue(mockRolesResponse);

        const result = await authService.hasRole('user:get');
        expect(result).toBe(true);
    });

    it('should return false for an invalid role in hasRole', async () => {
        vi.spyOn(authService, 'getRoles').mockResolvedValue(mockRolesResponse);

        const result = await authService.hasRole('invalid:role');
        expect(result).toBe(false);
    });

    it('should assign valid roles to a user', async () => {
        const mockUser = { id: '123', roles: '[]' };
        vi.spyOn(authService, 'getRoles').mockResolvedValue(mockRolesResponse);
        vi.spyOn(Repository, 'findBy').mockResolvedValue(mockUser);
        vi.spyOn(Repository, 'update').mockResolvedValue(1);

        const result = await authService.assignRoles('123', ['order:get']);

        expect(result).toEqual({
            success: true,
            message: 'Roles assigned successfully',
        });
    });

    it('should throw error when assigning an invalid role', async () => {
        vi.spyOn(authService, 'getRoles').mockResolvedValue(mockRolesResponse);

        await expect(
            authService.assignRoles('123', ['invalid:role']),
        ).rejects.toThrow(HttpException);
    });

    it('should remove valid roles from a user', async () => {
        const mockUser = {
            id: '123',
            roles: JSON.stringify(['order:get', 'user:get']),
        };
        vi.spyOn(authService, 'getRoles').mockResolvedValue(mockRolesResponse);
        vi.spyOn(Repository, 'findBy').mockResolvedValue(mockUser);
        vi.spyOn(Repository, 'update').mockResolvedValue(1);

        const result = await authService.removeRoles('123', 'order:get');

        expect(result).toEqual({
            success: true,
            message: 'Roles removed successfully',
        });
    });

    it('should throw error when removing an invalid role', async () => {
        vi.spyOn(authService, 'getRoles').mockResolvedValue(mockRolesResponse);
        vi.spyOn(Repository, 'findBy').mockResolvedValue({
            id: '123',
            roles: '[]',
        });
        await expect(
            authService.removeRoles('123', ['invalid:role']),
        ).rejects.toThrow(HttpException);
    });

    it('should throw error if user not found when assigning roles', async () => {
        vi.spyOn(authService, 'getRoles').mockResolvedValue(mockRolesResponse);
        vi.spyOn(Repository, 'findBy').mockResolvedValue(null);

        await expect(
            authService.assignRoles('123', 'order:get'),
        ).rejects.toThrow(HttpException);
    });

    it('should throw error if user not found when removing roles', async () => {
        vi.spyOn(authService, 'getRoles').mockResolvedValue(mockRolesResponse);
        vi.spyOn(Repository, 'findBy').mockResolvedValue(null);

        await expect(
            authService.removeRoles('123', 'order:get'),
        ).rejects.toThrow(HttpException);
    });
});
