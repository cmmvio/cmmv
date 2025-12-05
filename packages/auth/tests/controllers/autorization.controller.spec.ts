import { describe, it, expect, beforeEach, vi } from 'vitest';
import { AutorizationController } from '../../controllers/autorization.controller';
import { AuthAutorizationService } from '../../services/autorization.service';
import { AuthUsersService } from '../../services/users.service';
import { Config } from '@cmmv/core';

vi.mock('@cmmv/core', async (importOriginal) => {
    const actual = await importOriginal();
    return {
        ...(actual as any),
        Config: {
            get: vi.fn(),
        },
    };
});

describe('AutorizationController', () => {
    let controller: AutorizationController;
    let mockAuthService: Partial<AuthAutorizationService>;
    let mockUsersService: Partial<AuthUsersService>;
    let mockReq: any;
    let mockRes: any;
    let mockSession: any;

    beforeEach(() => {
        vi.clearAllMocks();

        mockAuthService = {
            login: vi.fn(),
            register: vi.fn(),
            checkUsernameExists: vi.fn(),
            refreshToken: vi.fn(),
            getRoles: vi.fn(),
            assignRoles: vi.fn(),
            removeRoles: vi.fn(),
        };

        mockUsersService = {
            forgotPassword: vi.fn(),
        };

        mockReq = {
            headers: {
                authorization: 'Bearer test-token',
            },
        };

        mockRes = {
            type: vi.fn().mockReturnThis(),
            send: vi.fn(),
        };

        mockSession = {};

        controller = new AutorizationController(
            mockAuthService as AuthAutorizationService,
            mockUsersService as AuthUsersService,
        );
    });

    describe('handlerLogin', () => {
        it('should return false when localLogin is disabled', async () => {
            vi.mocked(Config.get).mockReturnValue(false);

            const payload = { username: 'test', password: 'password' };
            const result = await controller.handlerLogin(
                payload,
                mockReq,
                mockRes,
                mockSession,
            );

            expect(result).toBe(false);
            expect(mockAuthService.login).not.toHaveBeenCalled();
        });

        it('should call login service when localLogin is enabled', async () => {
            vi.mocked(Config.get).mockReturnValue(true);
            const loginResult = { token: 'jwt-token', user: { id: '1' } };
            vi.mocked(mockAuthService.login).mockResolvedValue({
                result: loginResult,
            } as any);

            const payload = { username: 'test', password: 'password' };
            const result = await controller.handlerLogin(
                payload,
                mockReq,
                mockRes,
                mockSession,
            );

            expect(result).toEqual(loginResult);
            expect(mockAuthService.login).toHaveBeenCalledWith(
                payload,
                mockReq,
                mockRes,
                mockSession,
            );
        });
    });

    describe('handlerRegister', () => {
        it('should return false when localRegister is disabled', async () => {
            vi.mocked(Config.get).mockReturnValue(false);

            const payload = {
                username: 'test',
                password: 'password',
                email: 'test@test.com',
            };
            const result = await controller.handlerRegister(payload);

            expect(result).toBe(false);
            expect(mockAuthService.register).not.toHaveBeenCalled();
        });

        it('should call register service when localRegister is enabled', async () => {
            vi.mocked(Config.get).mockReturnValue(true);
            const registerResult = { success: true, userId: '123' };
            vi.mocked(mockAuthService.register).mockResolvedValue(
                registerResult as any,
            );

            const payload = {
                username: 'test',
                password: 'password',
                email: 'test@test.com',
            };
            const result = await controller.handlerRegister(payload);

            expect(result).toEqual(registerResult);
            expect(mockAuthService.register).toHaveBeenCalledWith(payload);
        });
    });

    describe('handlerForgotPassword', () => {
        it('should call forgotPassword service', async () => {
            const forgotResult = { success: true };
            vi.mocked(mockUsersService.forgotPassword).mockResolvedValue(
                forgotResult as any,
            );

            const result = await controller.handlerForgotPassword({
                email: 'test@test.com',
            });

            expect(result).toEqual(forgotResult);
            expect(mockUsersService.forgotPassword).toHaveBeenCalledWith(
                'test@test.com',
            );
        });
    });

    describe('handlerCheckToken', () => {
        it('should return success true', async () => {
            const result = await controller.handlerCheckToken();
            expect(result).toEqual({ success: true });
        });
    });

    describe('handlerCheckUsername', () => {
        it('should return true when username exists', async () => {
            vi.mocked(mockAuthService.checkUsernameExists).mockResolvedValue(
                true,
            );

            await controller.handlerCheckUsername(
                { username: 'existinguser' },
                mockRes,
            );

            expect(mockAuthService.checkUsernameExists).toHaveBeenCalledWith(
                'existinguser',
            );
            expect(mockRes.type).toHaveBeenCalledWith('text/plain');
            expect(mockRes.send).toHaveBeenCalledWith('true');
        });

        it('should return false when username does not exist', async () => {
            vi.mocked(mockAuthService.checkUsernameExists).mockResolvedValue(
                false,
            );

            await controller.handlerCheckUsername(
                { username: 'newuser' },
                mockRes,
            );

            expect(mockRes.send).toHaveBeenCalledWith('false');
        });
    });

    describe('handlerRefreshToken', () => {
        it('should call refreshToken service', async () => {
            const refreshResult = { token: 'new-token' };
            vi.mocked(mockAuthService.refreshToken).mockResolvedValue(
                refreshResult as any,
            );

            const result = await controller.handlerRefreshToken(mockReq);

            expect(result).toEqual(refreshResult);
            expect(mockAuthService.refreshToken).toHaveBeenCalledWith(mockReq);
        });
    });

    describe('handlerGetRoles', () => {
        it('should return all roles', async () => {
            const roles = ['admin', 'user', 'moderator'];
            vi.mocked(mockAuthService.getRoles).mockResolvedValue(roles as any);

            const result = await controller.handlerGetRoles();

            expect(result).toEqual(roles);
            expect(mockAuthService.getRoles).toHaveBeenCalled();
        });
    });

    describe('handlerAssignRoles', () => {
        it('should assign roles to user with string role', async () => {
            const assignResult = { success: true };
            vi.mocked(mockAuthService.assignRoles).mockResolvedValue(
                assignResult as any,
            );

            const result = await controller.handlerAssignRoles('user-123', {
                roles: 'admin',
            });

            expect(result).toEqual(assignResult);
            expect(mockAuthService.assignRoles).toHaveBeenCalledWith(
                'user-123',
                'admin',
            );
        });

        it('should assign multiple roles to user with array', async () => {
            const assignResult = { success: true };
            vi.mocked(mockAuthService.assignRoles).mockResolvedValue(
                assignResult as any,
            );

            const result = await controller.handlerAssignRoles('user-123', {
                roles: ['admin', 'moderator'],
            });

            expect(result).toEqual(assignResult);
            expect(mockAuthService.assignRoles).toHaveBeenCalledWith(
                'user-123',
                ['admin', 'moderator'],
            );
        });
    });

    describe('handlerRemoveRoles', () => {
        it('should remove roles from user', async () => {
            const removeResult = { success: true };
            vi.mocked(mockAuthService.removeRoles).mockResolvedValue(
                removeResult as any,
            );

            const result = await controller.handlerRemoveRoles('user-123', {
                roles: 'admin',
            });

            expect(result).toEqual(removeResult);
            expect(mockAuthService.removeRoles).toHaveBeenCalledWith(
                'user-123',
                'admin',
            );
        });
    });
});
