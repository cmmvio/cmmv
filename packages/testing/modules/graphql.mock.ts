import { vi } from 'vitest';

/**
 * Mock GraphQL Context
 */
export interface MockGraphQLContext {
    req: any;
    token?: string;
    user?: any;
}

/**
 * Create a mock GraphQL context
 */
export function createMockGraphQLContext(
    overrides: Partial<MockGraphQLContext> = {},
): MockGraphQLContext {
    return {
        req: {
            headers: { authorization: 'Bearer mock-token' },
            cookies: {},
        },
        token: 'mock-token',
        user: {
            id: 'user-id',
            username: 'testuser',
            roles: ['user'],
        },
        ...overrides,
    };
}

/**
 * Mock GraphQL Service
 */
export const MockGraphQLService = {
    buildSchema: vi.fn().mockResolvedValue({}),
    getSchema: vi.fn().mockReturnValue({}),
    executeQuery: vi.fn().mockResolvedValue({ data: {} }),
    executeMutation: vi.fn().mockResolvedValue({ data: {} }),
    executeSubscription: vi.fn().mockReturnValue({
        subscribe: vi.fn(),
        unsubscribe: vi.fn(),
    }),

    reset: () => {
        Object.values(MockGraphQLService).forEach((mock) => {
            if (typeof mock === 'function' && 'mockReset' in mock) {
                (mock as any).mockReset();
            }
        });
    },
};

/**
 * Mock GraphQL Transpiler
 */
export const MockGraphQLTranspiler = {
    run: vi.fn().mockResolvedValue(undefined),
    generateResolvers: vi.fn().mockResolvedValue(undefined),
    mapTypeToGraphQL: vi.fn().mockReturnValue('String'),
    mapToTsType: vi.fn().mockReturnValue('string'),
    getGraphQLMethodType: vi.fn().mockReturnValue('Query'),

    reset: () => {
        Object.values(MockGraphQLTranspiler).forEach((mock) => {
            if (typeof mock === 'function' && 'mockReset' in mock) {
                (mock as any).mockReset();
            }
        });
    },
};

/**
 * Mock Auth Checker for GraphQL
 */
export const MockAuthChecker = vi.fn().mockResolvedValue(true);

/**
 * Create a mock GraphQL resolver
 */
export function createMockResolver<T>(data: T) {
    return {
        Query: {
            find: vi
                .fn()
                .mockResolvedValue({
                    data: Array.isArray(data) ? data : [data],
                }),
            findById: vi.fn().mockResolvedValue({ data }),
        },
        Mutation: {
            create: vi.fn().mockResolvedValue({ data, success: true }),
            update: vi.fn().mockResolvedValue({ success: true }),
            delete: vi.fn().mockResolvedValue({ success: true }),
        },
    };
}

/**
 * Mock GraphQL args
 */
export interface MockPaginationArgs {
    page?: number;
    limit?: number;
    sortBy?: string;
    sortOrder?: 'ASC' | 'DESC';
}

/**
 * Create mock pagination args
 */
export function createMockPaginationArgs(
    overrides: Partial<MockPaginationArgs> = {},
): MockPaginationArgs {
    return {
        page: 1,
        limit: 10,
        sortBy: 'createdAt',
        sortOrder: 'DESC',
        ...overrides,
    };
}

/**
 * Mock GraphQL Response builders
 */
export const MockGraphQLResponse = {
    success: <T>(data: T) => ({ data, errors: undefined }),
    error: (message: string, code?: string) => ({
        data: null,
        errors: [{ message, extensions: { code: code || 'INTERNAL_ERROR' } }],
    }),
    validationError: (fields: Record<string, string>) => ({
        data: null,
        errors: [
            {
                message: 'Validation failed',
                extensions: {
                    code: 'VALIDATION_ERROR',
                    fields,
                },
            },
        ],
    }),
    unauthorized: () => ({
        data: null,
        errors: [
            { message: 'Unauthorized', extensions: { code: 'UNAUTHORIZED' } },
        ],
    }),
    forbidden: () => ({
        data: null,
        errors: [{ message: 'Forbidden', extensions: { code: 'FORBIDDEN' } }],
    }),
    notFound: (entity: string) => ({
        data: null,
        errors: [
            {
                message: `${entity} not found`,
                extensions: { code: 'NOT_FOUND' },
            },
        ],
    }),
};

/**
 * Mock type-graphql decorators
 */
export const MockTypeGraphQLDecorators = {
    Query: vi.fn(() => () => {}),
    Mutation: vi.fn(() => () => {}),
    Subscription: vi.fn(() => () => {}),
    Resolver: vi.fn(() => () => {}),
    ObjectType: vi.fn(() => () => {}),
    InputType: vi.fn(() => () => {}),
    ArgsType: vi.fn(() => () => {}),
    Field: vi.fn(() => () => {}),
    Args: vi.fn(() => () => {}),
    Arg: vi.fn(() => () => {}),
    Ctx: vi.fn(() => () => {}),
    Authorized: vi.fn(() => () => {}),
    Int: vi.fn(),
    Float: vi.fn(),
    ID: vi.fn(),
};

/**
 * Reset all GraphQL mocks
 */
export function resetAllGraphQLMocks() {
    MockGraphQLService.reset();
    MockGraphQLTranspiler.reset();
    MockAuthChecker.mockReset();
}
