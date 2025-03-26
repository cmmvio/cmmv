"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const vitest_1 = require("vitest");
const autorization_service_1 = require("../services/autorization.service");
const repository_1 = require("@cmmv/repository");
const http_1 = require("@cmmv/http");
vitest_1.vi.mock('@cmmv/repository');
vitest_1.vi.mock('fast-json-stringify', async () => {
    const actual = await vitest_1.vi.importActual('fast-json-stringify');
    return {
        default: vitest_1.vi
            .fn()
            .mockImplementation((schema) => actual.default(schema)),
    };
});
(0, vitest_1.describe)('AuthAutorizationService - Roles Management', () => {
    let authService;
    (0, vitest_1.beforeEach)(() => {
        authService = new autorization_service_1.AuthAutorizationService({}, // Mock das dependências de sessão e recaptcha
        {});
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
    (0, vitest_1.it)('should return roles structure from getRoles', async () => {
        vitest_1.vi.spyOn(authService, 'getRoles').mockResolvedValue(mockRolesResponse);
        const result = await authService.getRoles();
        (0, vitest_1.expect)(result).toEqual(mockRolesResponse);
    });
    (0, vitest_1.it)('should return true for a valid role in hasRole', async () => {
        vitest_1.vi.spyOn(authService, 'getRoles').mockResolvedValue(mockRolesResponse);
        const result = await authService.hasRole('user:get');
        (0, vitest_1.expect)(result).toBe(true);
    });
    (0, vitest_1.it)('should return false for an invalid role in hasRole', async () => {
        vitest_1.vi.spyOn(authService, 'getRoles').mockResolvedValue(mockRolesResponse);
        const result = await authService.hasRole('invalid:role');
        (0, vitest_1.expect)(result).toBe(false);
    });
    (0, vitest_1.it)('should assign valid roles to a user', async () => {
        const mockUser = { id: '123', roles: '[]' };
        vitest_1.vi.spyOn(authService, 'getRoles').mockResolvedValue(mockRolesResponse);
        vitest_1.vi.spyOn(repository_1.Repository, 'findBy').mockResolvedValue(mockUser);
        vitest_1.vi.spyOn(repository_1.Repository, 'update').mockResolvedValue(1);
        const result = await authService.assignRoles('123', ['order:get']);
        (0, vitest_1.expect)(result).toEqual({
            message: 'Roles assigned successfully',
        });
    });
    (0, vitest_1.it)('should throw error when assigning an invalid role', async () => {
        vitest_1.vi.spyOn(authService, 'getRoles').mockResolvedValue(mockRolesResponse);
        await (0, vitest_1.expect)(authService.assignRoles('123', ['invalid:role'])).rejects.toThrow(http_1.HttpException);
    });
    (0, vitest_1.it)('should remove valid roles from a user', async () => {
        const mockUser = {
            id: '123',
            roles: JSON.stringify(['order:get', 'user:get']),
        };
        vitest_1.vi.spyOn(authService, 'getRoles').mockResolvedValue(mockRolesResponse);
        vitest_1.vi.spyOn(repository_1.Repository, 'findBy').mockResolvedValue(mockUser);
        vitest_1.vi.spyOn(repository_1.Repository, 'update').mockResolvedValue(1);
        const result = await authService.removeRoles('123', 'order:get');
        (0, vitest_1.expect)(result).toEqual({
            success: true,
            message: 'Roles removed successfully',
        });
    });
    (0, vitest_1.it)('should throw error when removing an invalid role', async () => {
        vitest_1.vi.spyOn(authService, 'getRoles').mockResolvedValue(mockRolesResponse);
        vitest_1.vi.spyOn(repository_1.Repository, 'findBy').mockResolvedValue({
            id: '123',
            roles: '[]',
        });
        await (0, vitest_1.expect)(authService.removeRoles('123', ['invalid:role'])).rejects.toThrow(http_1.HttpException);
    });
    (0, vitest_1.it)('should throw error if user not found when assigning roles', async () => {
        vitest_1.vi.spyOn(authService, 'getRoles').mockResolvedValue(mockRolesResponse);
        vitest_1.vi.spyOn(repository_1.Repository, 'findBy').mockResolvedValue(null);
        await (0, vitest_1.expect)(authService.assignRoles('123', 'order:get')).rejects.toThrow(http_1.HttpException);
    });
    (0, vitest_1.it)('should throw error if user not found when removing roles', async () => {
        vitest_1.vi.spyOn(authService, 'getRoles').mockResolvedValue(mockRolesResponse);
        vitest_1.vi.spyOn(repository_1.Repository, 'findBy').mockResolvedValue(null);
        await (0, vitest_1.expect)(authService.removeRoles('123', 'order:get')).rejects.toThrow(http_1.HttpException);
    });
});
