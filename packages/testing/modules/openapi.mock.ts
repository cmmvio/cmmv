import { vi } from 'vitest';

/**
 * Mock OpenAPI Service
 */
export const MockOpenAPIService = {
    generateSpec: vi.fn().mockReturnValue({
        openapi: '3.0.0',
        info: { title: 'Mock API', version: '1.0.0' },
        paths: {},
    }),
    getSpec: vi.fn().mockReturnValue({}),
    addPath: vi.fn(),
    addSchema: vi.fn(),
    addTag: vi.fn(),
    validate: vi.fn().mockReturnValue({ valid: true, errors: [] }),
    toYaml: vi.fn().mockReturnValue(''),
    toJson: vi.fn().mockReturnValue('{}'),

    reset: () => {
        Object.values(MockOpenAPIService).forEach((mock) => {
            if (typeof mock === 'function' && 'mockReset' in mock) {
                (mock as any).mockReset();
            }
        });
    },
};

/**
 * Mock OpenAPI Transpiler
 */
export const MockOpenAPITranspiler = {
    run: vi.fn().mockResolvedValue(undefined),
    generateFromContract: vi.fn().mockReturnValue({}),
    mapToOpenAPIType: vi.fn().mockReturnValue({ type: 'string' }),
    generateSchemas: vi.fn().mockReturnValue({}),
    generatePaths: vi.fn().mockReturnValue({}),

    reset: () => {
        Object.values(MockOpenAPITranspiler).forEach((mock) => {
            if (typeof mock === 'function' && 'mockReset' in mock) {
                (mock as any).mockReset();
            }
        });
    },
};

/**
 * Mock OpenAPI Spec
 */
export function createMockOpenAPISpec(overrides: any = {}) {
    return {
        openapi: '3.0.0',
        info: {
            title: 'Mock API',
            version: '1.0.0',
            description: 'Mock API for testing',
        },
        servers: [{ url: 'http://localhost:3000' }],
        paths: {},
        components: {
            schemas: {},
            securitySchemes: {},
        },
        tags: [],
        ...overrides,
    };
}

/**
 * Create a mock path item
 */
export function createMockPathItem(method: string = 'get', operationId: string = 'mockOperation') {
    return {
        [method]: {
            operationId,
            summary: `Mock ${method.toUpperCase()} operation`,
            tags: ['mock'],
            parameters: [],
            responses: {
                '200': {
                    description: 'Success',
                    content: {
                        'application/json': {
                            schema: { type: 'object' },
                        },
                    },
                },
            },
        },
    };
}

/**
 * Create a mock schema
 */
export function createMockSchema(properties: Record<string, any> = {}) {
    return {
        type: 'object',
        properties: {
            id: { type: 'string' },
            createdAt: { type: 'string', format: 'date-time' },
            updatedAt: { type: 'string', format: 'date-time' },
            ...properties,
        },
    };
}

/**
 * Reset all OpenAPI mocks
 */
export function resetAllOpenAPIMocks() {
    MockOpenAPIService.reset();
    MockOpenAPITranspiler.reset();
}
