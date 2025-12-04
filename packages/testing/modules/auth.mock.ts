import { vi } from 'vitest';

/**
 * Mock JWT payload for testing
 */
export interface MockJWTPayload {
    id: string;
    username: string;
    email?: string;
    roles?: string[];
    root?: boolean;
    fingerprint?: string;
    iat?: number;
    exp?: number;
}

/**
 * Create a mock JWT payload
 */
export function createMockJWTPayload(overrides: Partial<MockJWTPayload> = {}): MockJWTPayload {
    return {
        id: 'user-' + Math.random().toString(36).substr(2, 9),
        username: 'testuser',
        email: 'test@example.com',
        roles: ['user'],
        root: false,
        fingerprint: 'mock-fingerprint',
        iat: Math.floor(Date.now() / 1000),
        exp: Math.floor(Date.now() / 1000) + 3600,
        ...overrides,
    };
}

/**
 * Mock Authorization Service
 */
export const MockAuthorizationService = {
    register: vi.fn().mockResolvedValue({ success: true, user: { id: 'new-user-id' } }),
    login: vi.fn().mockResolvedValue({
        success: true,
        token: 'mock-jwt-token',
        refreshToken: 'mock-refresh-token',
        user: createMockJWTPayload(),
    }),
    logout: vi.fn().mockResolvedValue({ success: true }),
    validateToken: vi.fn().mockResolvedValue(createMockJWTPayload()),
    refreshToken: vi.fn().mockResolvedValue({
        success: true,
        token: 'new-mock-jwt-token',
        refreshToken: 'new-mock-refresh-token',
    }),
    getRoles: vi.fn().mockReturnValue({
        admin: ['admin:read', 'admin:write', 'admin:delete'],
        user: ['user:read', 'user:write'],
    }),
    hasRole: vi.fn().mockReturnValue(true),
    assignRoles: vi.fn().mockResolvedValue({ success: true }),
    removeRoles: vi.fn().mockResolvedValue({ success: true }),

    reset: () => {
        Object.values(MockAuthorizationService).forEach((mock) => {
            if (typeof mock === 'function' && 'mockReset' in mock) {
                (mock as any).mockReset();
            }
        });
    },
};

/**
 * Mock Sessions Service
 */
export const MockSessionsService = {
    createSession: vi.fn().mockResolvedValue({ sessionId: 'mock-session-id' }),
    getSession: vi.fn().mockResolvedValue({ user: createMockJWTPayload() }),
    destroySession: vi.fn().mockResolvedValue({ success: true }),
    validateSession: vi.fn().mockResolvedValue(true),
    validateRefreshToken: vi.fn().mockResolvedValue(true),
    refreshSession: vi.fn().mockResolvedValue({ success: true }),

    reset: () => {
        Object.values(MockSessionsService).forEach((mock) => {
            if (typeof mock === 'function' && 'mockReset' in mock) {
                (mock as any).mockReset();
            }
        });
    },
};

/**
 * Mock Users Service
 */
export const MockUsersService = {
    findById: vi.fn().mockResolvedValue({ id: 'user-id', username: 'testuser' }),
    findByUsername: vi.fn().mockResolvedValue({ id: 'user-id', username: 'testuser' }),
    findByEmail: vi.fn().mockResolvedValue({ id: 'user-id', email: 'test@example.com' }),
    create: vi.fn().mockResolvedValue({ id: 'new-user-id', username: 'newuser' }),
    update: vi.fn().mockResolvedValue({ success: true }),
    delete: vi.fn().mockResolvedValue({ success: true }),
    validatePassword: vi.fn().mockResolvedValue(true),
    hashPassword: vi.fn().mockResolvedValue('hashed-password'),
    changePassword: vi.fn().mockResolvedValue({ success: true }),

    reset: () => {
        Object.values(MockUsersService).forEach((mock) => {
            if (typeof mock === 'function' && 'mockReset' in mock) {
                (mock as any).mockReset();
            }
        });
    },
};

/**
 * Mock Groups Service
 */
export const MockGroupsService = {
    findAll: vi.fn().mockResolvedValue([]),
    findById: vi.fn().mockResolvedValue({ id: 'group-id', name: 'Test Group' }),
    create: vi.fn().mockResolvedValue({ id: 'new-group-id', name: 'New Group' }),
    update: vi.fn().mockResolvedValue({ success: true }),
    delete: vi.fn().mockResolvedValue({ success: true }),
    addUserToGroup: vi.fn().mockResolvedValue({ success: true }),
    removeUserFromGroup: vi.fn().mockResolvedValue({ success: true }),
    getGroupUsers: vi.fn().mockResolvedValue([]),

    reset: () => {
        Object.values(MockGroupsService).forEach((mock) => {
            if (typeof mock === 'function' && 'mockReset' in mock) {
                (mock as any).mockReset();
            }
        });
    },
};

/**
 * Mock OAuth2 Service
 */
export const MockOAuth2Service = {
    getAuthorizationUrl: vi.fn().mockReturnValue('https://oauth.example.com/auth'),
    handleCallback: vi.fn().mockResolvedValue({
        success: true,
        token: 'oauth-token',
        user: createMockJWTPayload(),
    }),
    refreshOAuthToken: vi.fn().mockResolvedValue({ access_token: 'new-oauth-token' }),
    revokeToken: vi.fn().mockResolvedValue({ success: true }),

    reset: () => {
        Object.values(MockOAuth2Service).forEach((mock) => {
            if (typeof mock === 'function' && 'mockReset' in mock) {
                (mock as any).mockReset();
            }
        });
    },
};

/**
 * Mock OTP Service
 */
export const MockOTPService = {
    generateSecret: vi.fn().mockReturnValue({ secret: 'MOCK-OTP-SECRET', qrCode: 'data:image/png...' }),
    verifyToken: vi.fn().mockReturnValue(true),
    activateOTP: vi.fn().mockResolvedValue({ success: true }),
    deactivateOTP: vi.fn().mockResolvedValue({ success: true }),

    reset: () => {
        Object.values(MockOTPService).forEach((mock) => {
            if (typeof mock === 'function' && 'mockReset' in mock) {
                (mock as any).mockReset();
            }
        });
    },
};

/**
 * Mock Auth Decorator behavior
 */
export function mockAuthDecorator(user?: MockJWTPayload) {
    return (target: any, propertyKey: string, descriptor: PropertyDescriptor) => {
        const originalMethod = descriptor.value;
        descriptor.value = async function (...args: any[]) {
            // Inject user into request
            if (args[0]?.req) {
                args[0].user = user || createMockJWTPayload();
            }
            return originalMethod.apply(this, args);
        };
        return descriptor;
    };
}

/**
 * Create a mock request with authentication
 */
export function createMockAuthenticatedRequest(user?: Partial<MockJWTPayload>) {
    return {
        user: createMockJWTPayload(user),
        cookies: {
            token: 'mock-session-id',
            refreshToken: 'mock-refresh-token',
        },
        session: {
            get: vi.fn().mockResolvedValue({ user: { token: 'mock-jwt-token' } }),
            set: vi.fn().mockResolvedValue(undefined),
            destroy: vi.fn().mockResolvedValue(undefined),
        },
        headers: {
            authorization: 'Bearer mock-jwt-token',
        },
    };
}

/**
 * Reset all auth mocks
 */
export function resetAllAuthMocks() {
    MockAuthorizationService.reset();
    MockSessionsService.reset();
    MockUsersService.reset();
    MockGroupsService.reset();
    MockOAuth2Service.reset();
    MockOTPService.reset();
}
