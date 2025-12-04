import { vi } from 'vitest';

/**
 * Mock Throttler Service
 */
export const MockThrottlerService = {
    // Rate limiting
    isRateLimited: vi.fn().mockReturnValue(false),
    checkLimit: vi.fn().mockResolvedValue({ allowed: true, remaining: 100, resetTime: Date.now() + 60000 }),
    incrementCounter: vi.fn().mockResolvedValue(1),
    resetCounter: vi.fn().mockResolvedValue(undefined),

    // Configuration
    getConfig: vi.fn().mockReturnValue({
        ttl: 60,
        limit: 100,
    }),
    setConfig: vi.fn(),

    // Storage operations
    get: vi.fn().mockResolvedValue(null),
    set: vi.fn().mockResolvedValue(undefined),
    delete: vi.fn().mockResolvedValue(undefined),

    reset: () => {
        Object.values(MockThrottlerService).forEach((mock) => {
            if (typeof mock === 'function' && 'mockReset' in mock) {
                (mock as any).mockReset();
            }
        });
    },
};

/**
 * Mock Throttler Guard
 */
export const MockThrottlerGuard = {
    canActivate: vi.fn().mockResolvedValue(true),
    getTracker: vi.fn().mockReturnValue('ip-127.0.0.1'),
    handleRequest: vi.fn().mockResolvedValue(true),
    throwThrottlingException: vi.fn(),

    reset: () => {
        Object.values(MockThrottlerGuard).forEach((mock) => {
            if (typeof mock === 'function' && 'mockReset' in mock) {
                (mock as any).mockReset();
            }
        });
    },
};

/**
 * Mock rate limit response
 */
export interface MockRateLimitResponse {
    allowed: boolean;
    remaining: number;
    resetTime: number;
    total: number;
}

/**
 * Create mock rate limit response
 */
export function createMockRateLimitResponse(overrides: Partial<MockRateLimitResponse> = {}): MockRateLimitResponse {
    return {
        allowed: true,
        remaining: 99,
        resetTime: Date.now() + 60000,
        total: 100,
        ...overrides,
    };
}

/**
 * Create a rate limited response (for testing rate limit scenarios)
 */
export function createRateLimitedResponse(): MockRateLimitResponse {
    return {
        allowed: false,
        remaining: 0,
        resetTime: Date.now() + 60000,
        total: 100,
    };
}

/**
 * Mock throttler decorator
 */
export const MockThrottleDecorator = vi.fn(() => () => {});

/**
 * Reset all Throttler mocks
 */
export function resetAllThrottlerMocks() {
    MockThrottlerService.reset();
    MockThrottlerGuard.reset();
}
