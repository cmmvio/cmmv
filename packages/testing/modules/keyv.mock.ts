import { vi } from 'vitest';

/**
 * Mock Keyv Service (key-value storage)
 */
export const MockKeyvService = {
    // Basic operations
    get: vi.fn().mockResolvedValue(undefined),
    set: vi.fn().mockResolvedValue(true),
    delete: vi.fn().mockResolvedValue(true),
    clear: vi.fn().mockResolvedValue(undefined),
    has: vi.fn().mockResolvedValue(false),

    // Bulk operations
    getMany: vi.fn().mockResolvedValue([]),
    setMany: vi.fn().mockResolvedValue(true),
    deleteMany: vi.fn().mockResolvedValue(true),

    // Iteration
    keys: vi.fn().mockReturnValue({
        [Symbol.asyncIterator]: async function* () {},
    }),
    values: vi.fn().mockReturnValue({
        [Symbol.asyncIterator]: async function* () {},
    }),
    entries: vi.fn().mockReturnValue({
        [Symbol.asyncIterator]: async function* () {},
    }),

    // Namespace
    namespace: 'mock',

    // Events
    on: vi.fn(),
    off: vi.fn(),

    reset: () => {
        Object.values(MockKeyvService).forEach((mock) => {
            if (typeof mock === 'function' && 'mockReset' in mock) {
                (mock as any).mockReset();
            }
        });
    },
};

/**
 * Mock Keyv Store (in-memory for testing)
 */
export class MockKeyvStore {
    private store: Map<string, { value: any; expires?: number }> = new Map();

    async get(key: string): Promise<any> {
        const item = this.store.get(key);
        if (!item) return undefined;
        if (item.expires && Date.now() > item.expires) {
            this.store.delete(key);
            return undefined;
        }
        return item.value;
    }

    async set(key: string, value: any, ttl?: number): Promise<boolean> {
        this.store.set(key, {
            value,
            expires: ttl ? Date.now() + ttl : undefined,
        });
        return true;
    }

    async delete(key: string): Promise<boolean> {
        return this.store.delete(key);
    }

    async clear(): Promise<void> {
        this.store.clear();
    }

    async has(key: string): Promise<boolean> {
        const item = this.store.get(key);
        if (!item) return false;
        if (item.expires && Date.now() > item.expires) {
            this.store.delete(key);
            return false;
        }
        return true;
    }

    async *keys(): AsyncGenerator<string> {
        for (const key of this.store.keys()) {
            yield key;
        }
    }

    async *values(): AsyncGenerator<any> {
        for (const item of this.store.values()) {
            yield item.value;
        }
    }

    async *entries(): AsyncGenerator<[string, any]> {
        for (const [key, item] of this.store.entries()) {
            yield [key, item.value];
        }
    }

    size(): number {
        return this.store.size;
    }

    reset(): void {
        this.store.clear();
    }
}

/**
 * Create a pre-populated mock keyv store
 */
export function createMockKeyvStoreWithData(
    data: Record<string, any>,
): MockKeyvStore {
    const store = new MockKeyvStore();
    Object.entries(data).forEach(([key, value]) => {
        store.set(key, value);
    });
    return store;
}

/**
 * Reset all Keyv mocks
 */
export function resetAllKeyvMocks() {
    MockKeyvService.reset();
}
