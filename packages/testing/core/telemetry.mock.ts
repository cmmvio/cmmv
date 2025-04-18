import { vi } from 'vitest';

type MockTelemetryRecord = {
    id: string;
    label: string;
    startTime: number;
    endTime?: number;
};

export class MockTelemetry {
    public static records: Map<string, MockTelemetryRecord[]> = new Map();
    public static processTimer: Map<string, { start: number; end: number }> =
        new Map();
    public static plugins: any[] = [];

    public static registerPlugin = vi
        .fn()
        .mockImplementation((plugin: any): void => {
            MockTelemetry.plugins.push(plugin);
        });

    public static start = vi
        .fn()
        .mockImplementation((label: string, requestId?: string): void => {
            if (requestId) {
                if (!MockTelemetry.records.has(requestId)) {
                    MockTelemetry.records.set(requestId, []);
                }

                if (!MockTelemetry.processTimer.has(requestId)) {
                    MockTelemetry.processTimer.set(requestId, {
                        start: Date.now(),
                        end: 0,
                    });
                }

                MockTelemetry.records.get(requestId)?.push({
                    id: MockTelemetry.generateId(),
                    label,
                    startTime: Date.now(),
                });
            }
        });

    public static end = vi
        .fn()
        .mockImplementation((label: string, requestId?: string): void => {
            if (requestId) {
                const record = MockTelemetry.records
                    .get(requestId)
                    ?.find((r) => r.label === label && !r.endTime);

                if (MockTelemetry.processTimer.has(requestId)) {
                    const timer = MockTelemetry.processTimer.get(requestId);
                    timer.end = Date.now();
                    MockTelemetry.processTimer.set(requestId, timer);
                }

                if (record) record.endTime = Date.now();
            }
        });

    public static getProcessTimer = vi
        .fn()
        .mockImplementation((requestId?: string) => {
            if (requestId) {
                if (MockTelemetry.processTimer.has(requestId)) {
                    const timer = MockTelemetry.processTimer.get(requestId);
                    return timer.end - timer.start;
                }
            }
            return 0;
        });

    public static getTelemetry = vi
        .fn()
        .mockImplementation(
            (requestId?: string): MockTelemetryRecord[] | null => {
                if (requestId) {
                    return MockTelemetry.records.get(requestId) || null;
                } else {
                    return null;
                }
            },
        );

    public static clearTelemetry = vi
        .fn()
        .mockImplementation((requestId?: string): boolean => {
            if (requestId) {
                if (MockTelemetry.records.has(requestId)) {
                    MockTelemetry.records.delete(requestId);
                }

                if (MockTelemetry.processTimer.has(requestId)) {
                    MockTelemetry.processTimer.delete(requestId);
                }

                return true;
            }

            return false;
        });

    public static getRecords = vi.fn().mockImplementation(() => {
        return MockTelemetry.records;
    });

    private static generateId(): string {
        return (Math.random() + 1).toString(36).substring(7);
    }

    /**
     * Resets all mocks and clears stored telemetry data
     */
    public static reset(): void {
        MockTelemetry.records.clear();
        MockTelemetry.processTimer.clear();
        MockTelemetry.plugins = [];

        MockTelemetry.registerPlugin.mockReset();
        MockTelemetry.start.mockReset();
        MockTelemetry.end.mockReset();
        MockTelemetry.getProcessTimer.mockReset();
        MockTelemetry.getTelemetry.mockReset();
        MockTelemetry.clearTelemetry.mockReset();
        MockTelemetry.getRecords.mockReset();

        // Restore implementations
        MockTelemetry.registerPlugin.mockImplementation((plugin: any): void => {
            MockTelemetry.plugins.push(plugin);
        });

        MockTelemetry.start.mockImplementation(
            (label: string, requestId?: string): void => {
                if (requestId) {
                    if (!MockTelemetry.records.has(requestId)) {
                        MockTelemetry.records.set(requestId, []);
                    }

                    if (!MockTelemetry.processTimer.has(requestId)) {
                        MockTelemetry.processTimer.set(requestId, {
                            start: Date.now(),
                            end: 0,
                        });
                    }

                    MockTelemetry.records.get(requestId)?.push({
                        id: MockTelemetry.generateId(),
                        label,
                        startTime: Date.now(),
                    });
                }
            },
        );

        MockTelemetry.end.mockImplementation(
            (label: string, requestId?: string): void => {
                if (requestId) {
                    const record = MockTelemetry.records
                        .get(requestId)
                        ?.find((r) => r.label === label && !r.endTime);

                    if (MockTelemetry.processTimer.has(requestId)) {
                        const timer = MockTelemetry.processTimer.get(requestId);
                        timer.end = Date.now();
                        MockTelemetry.processTimer.set(requestId, timer);
                    }

                    if (record) record.endTime = Date.now();
                }
            },
        );

        MockTelemetry.getProcessTimer.mockImplementation(
            (requestId?: string) => {
                if (requestId) {
                    if (MockTelemetry.processTimer.has(requestId)) {
                        const timer = MockTelemetry.processTimer.get(requestId);
                        return timer.end - timer.start;
                    }
                }
                return 0;
            },
        );

        MockTelemetry.getTelemetry.mockImplementation(
            (requestId?: string): MockTelemetryRecord[] | null => {
                if (requestId) {
                    return MockTelemetry.records.get(requestId) || null;
                } else {
                    return null;
                }
            },
        );

        MockTelemetry.clearTelemetry.mockImplementation(
            (requestId?: string): boolean => {
                if (requestId) {
                    if (MockTelemetry.records.has(requestId)) {
                        MockTelemetry.records.delete(requestId);
                    }

                    if (MockTelemetry.processTimer.has(requestId)) {
                        MockTelemetry.processTimer.delete(requestId);
                    }

                    return true;
                }

                return false;
            },
        );

        MockTelemetry.getRecords.mockImplementation(() => {
            return MockTelemetry.records;
        });
    }

    /**
     * Returns mock module structure
     */
    public static getMockModule() {
        return {
            Telemetry: MockTelemetry,
        };
    }
}

/**
 * Setup for mocking the Telemetry module
 *
 * @example
 * ```ts
 * import { mockTelemetry } from '@cmmv/testing';
 *
 * vi.mock('@cmmv/core/lib/telemetry', () => mockTelemetry.getMockModule());
 *
 * describe('Your test', () => {
 *   beforeEach(() => {
 *     mockTelemetry.reset();
 *   });
 *
 *   it('tests telemetry functionality', () => {
 *     // Start a telemetry record
 *     mockTelemetry.start('Operation', 'request-123');
 *
 *     // End the telemetry record
 *     mockTelemetry.end('Operation', 'request-123');
 *
 *     // Assert
 *     const records = mockTelemetry.getTelemetry('request-123');
 *     expect(records).toHaveLength(1);
 *     expect(records[0].label).toBe('Operation');
 *   });
 * });
 * ```
 */
export const mockTelemetry = MockTelemetry;
