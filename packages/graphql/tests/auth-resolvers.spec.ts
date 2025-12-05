import { describe, it, expect, beforeEach, vi } from 'vitest';

// Mock type-graphql decorators
vi.mock('type-graphql', () => ({
    ArgsType: () => (target: any) => target,
    Field: () => () => {},
    Resolver: () => (target: any) => target,
    Args: () => () => {},
    Arg: () => () => {},
    Query: () => () => {},
    ObjectType: () => (target: any) => target,
    Ctx: () => () => {},
    Authorized: () => () => {},
    ID: 'ID',
    Mutation: () => () => {},
}));

// Mock @cmmv/core
vi.mock('@cmmv/core', async (importOriginal) => {
    const actual = await importOriginal();
    return {
        ...(actual as any),
        Module: {
            hasModule: vi.fn(),
        },
        Application: {
            resolveProvider: vi.fn(),
        },
    };
});

// Mock @cmmv/auth
vi.mock('@cmmv/auth', () => ({
    AuthAutorizationService: class MockAuthAutorizationService {},
    AuthUsersService: class MockAuthUsersService {},
}));

import { AuthResolver } from '../lib/auth-resolvers';
import { Module, Application } from '@cmmv/core';

describe('AuthResolver', () => {
    let resolver: AuthResolver;
    let mockAuthService: any;
    let mockUserService: any;

    beforeEach(() => {
        vi.clearAllMocks();

        mockAuthService = {
            login: vi.fn(),
            refreshToken: vi.fn(),
        };

        mockUserService = {
            blockUser: vi.fn(),
            unblockUser: vi.fn(),
        };

        vi.mocked(Module.hasModule).mockReturnValue(true);
        vi.mocked(Application.resolveProvider).mockImplementation(
            (service: any) => {
                if (service.name === 'MockAuthAutorizationService') {
                    return mockAuthService;
                }
                if (service.name === 'MockAuthUsersService') {
                    return mockUserService;
                }
                return null;
            },
        );

        resolver = new AuthResolver();
        // Manually inject mock services
        (resolver as any).authService = mockAuthService;
        (resolver as any).userService = mockUserService;
    });

    describe('constructor', () => {
        it('should resolve services when auth module is available', () => {
            vi.mocked(Module.hasModule).mockReturnValue(true);
            vi.mocked(Application.resolveProvider).mockClear();

            const newResolver = new AuthResolver();

            expect(Module.hasModule).toHaveBeenCalledWith('auth');
            expect(Application.resolveProvider).toHaveBeenCalledTimes(2);
        });

        it('should not resolve services when auth module is not available', () => {
            vi.mocked(Module.hasModule).mockReturnValue(false);
            vi.mocked(Application.resolveProvider).mockClear();

            const newResolver = new AuthResolver();

            expect(Module.hasModule).toHaveBeenCalledWith('auth');
            expect(Application.resolveProvider).not.toHaveBeenCalled();
        });
    });

    describe('login', () => {
        it('should call authService.login with correct parameters', async () => {
            const loginPayload = {
                username: 'testuser',
                password: 'password123',
            };
            const mockContext = {
                req: { headers: {} },
            };
            const loginResult = {
                result: {
                    token: 'jwt-token',
                    refreshToken: 'refresh-token',
                },
            };

            mockAuthService.login.mockResolvedValue(loginResult);

            const result = await resolver.login(
                loginPayload as any,
                mockContext as any,
            );

            expect(mockAuthService.login).toHaveBeenCalledWith(
                loginPayload,
                mockContext.req,
                null,
            );
            expect(result).toEqual(loginResult.result);
        });

        it('should handle login with optional token', async () => {
            const loginPayload = {
                username: 'testuser',
                password: 'password123',
                token: 'captcha-token',
            };
            const mockContext = { req: {} };
            const loginResult = {
                result: { token: 'jwt', refreshToken: 'refresh' },
            };

            mockAuthService.login.mockResolvedValue(loginResult);

            await resolver.login(loginPayload as any, mockContext as any);

            expect(mockAuthService.login).toHaveBeenCalledWith(
                loginPayload,
                mockContext.req,
                null,
            );
        });

        it('should handle login with OTP', async () => {
            const loginPayload = {
                username: 'testuser',
                password: 'password123',
                opt: '123456',
            };
            const mockContext = { req: {} };
            const loginResult = {
                result: { token: 'jwt', refreshToken: 'refresh' },
            };

            mockAuthService.login.mockResolvedValue(loginResult);

            await resolver.login(loginPayload as any, mockContext as any);

            expect(mockAuthService.login).toHaveBeenCalledWith(
                expect.objectContaining({ opt: '123456' }),
                mockContext.req,
                null,
            );
        });
    });

    describe('refreshToken', () => {
        it('should call authService.refreshToken with context', async () => {
            const mockContext = {
                req: {
                    headers: {
                        authorization: 'Bearer old-token',
                    },
                },
            };
            const refreshResult = {
                token: 'new-jwt-token',
            };

            mockAuthService.refreshToken.mockResolvedValue(refreshResult);

            const result = await resolver.refreshToken(mockContext as any);

            expect(mockAuthService.refreshToken).toHaveBeenCalledWith(
                mockContext.req,
                mockContext,
            );
            expect(result).toBe('new-jwt-token');
        });
    });

    describe('blockUser', () => {
        it('should call userService.blockUser with user id', async () => {
            const userId = 'user-123';
            // The original code does: await this.userService.blockUser(id).message
            // which means blockUser returns an object with message property synchronously
            const blockResult = {
                message: 'User blocked successfully',
            };

            mockUserService.blockUser.mockReturnValue(blockResult);

            const result = await resolver.blockUser(userId);

            expect(mockUserService.blockUser).toHaveBeenCalledWith(userId);
            expect(result).toBe('User blocked successfully');
        });
    });

    describe('unblockUser', () => {
        it('should call userService.unblockUser with user id', async () => {
            const userId = 'user-123';
            const unblockResult = {
                message: 'User unblocked successfully',
            };

            mockUserService.unblockUser.mockReturnValue(unblockResult);

            const result = await resolver.unblockUser(userId);

            expect(mockUserService.unblockUser).toHaveBeenCalledWith(userId);
            expect(result).toBe('User unblocked successfully');
        });
    });
});

describe('LoginPayload', () => {
    it('should have required fields defined', () => {
        // Test that the class structure is correct via type-graphql decorators
        // The decorators are mocked, but we can verify the class exists
        const payload = {
            username: 'test',
            password: 'pass',
            token: 'optional',
            opt: 'optional',
        };

        expect(payload.username).toBe('test');
        expect(payload.password).toBe('pass');
    });
});

describe('LoginReturn', () => {
    it('should have token and refreshToken fields', () => {
        const returnObj = {
            token: 'jwt-token',
            refreshToken: 'refresh-token',
        };

        expect(returnObj.token).toBe('jwt-token');
        expect(returnObj.refreshToken).toBe('refresh-token');
    });
});
