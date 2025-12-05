import { vi } from 'vitest';

/**
 * Mock Protobuf Service
 */
export const MockProtobufService = {
    encode: vi.fn().mockReturnValue(Buffer.from([])),
    decode: vi.fn().mockReturnValue({}),
    encodeMessage: vi.fn().mockReturnValue(Buffer.from([])),
    decodeMessage: vi.fn().mockReturnValue({}),
    getMessageType: vi.fn().mockReturnValue(null),
    loadProtoFile: vi.fn().mockResolvedValue(undefined),
    getRoot: vi.fn().mockReturnValue({}),

    reset: () => {
        Object.values(MockProtobufService).forEach((mock) => {
            if (typeof mock === 'function' && 'mockReset' in mock) {
                (mock as any).mockReset();
            }
        });
    },
};

/**
 * Mock Protobuf Transpiler
 */
export const MockProtobufTranspiler = {
    run: vi.fn().mockResolvedValue(undefined),
    generateProtoFile: vi.fn().mockReturnValue(''),
    mapToProtoType: vi.fn().mockReturnValue('string'),
    parseContract: vi.fn().mockReturnValue({ messages: [], services: [] }),

    reset: () => {
        Object.values(MockProtobufTranspiler).forEach((mock) => {
            if (typeof mock === 'function' && 'mockReset' in mock) {
                (mock as any).mockReset();
            }
        });
    },
};

/**
 * Mock Protobuf Registry
 */
export const MockProtobufRegistry = {
    register: vi.fn(),
    get: vi.fn().mockReturnValue(null),
    getAll: vi.fn().mockReturnValue([]),
    has: vi.fn().mockReturnValue(false),
    clear: vi.fn(),

    reset: () => {
        Object.values(MockProtobufRegistry).forEach((mock) => {
            if (typeof mock === 'function' && 'mockReset' in mock) {
                (mock as any).mockReset();
            }
        });
    },
};

/**
 * Create a mock proto message
 */
export function createMockProtoMessage(
    name: string,
    fields: Record<string, string> = {},
) {
    return {
        name,
        fields: Object.entries(fields).map(([key, type], index) => ({
            name: key,
            type,
            id: index + 1,
        })),
    };
}

/**
 * Reset all Protobuf mocks
 */
export function resetAllProtobufMocks() {
    MockProtobufService.reset();
    MockProtobufTranspiler.reset();
    MockProtobufRegistry.reset();
}
