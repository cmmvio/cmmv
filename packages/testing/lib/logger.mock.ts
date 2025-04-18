import { vi } from 'vitest';

import type { LogEvent, LogLevel } from '../../core/lib/logger';

export class MockLogger {
    public log = vi.fn();
    public error = vi.fn();
    public warning = vi.fn();
    public verbose = vi.fn();
    public debug = vi.fn();
    public context: string;

    constructor(context: string = 'Test') {
        this.context = context;
    }

    public reset(): void {
        this.log.mockReset();
        this.error.mockReset();
        this.warning.mockReset();
        this.verbose.mockReset();
        this.debug.mockReset();
    }

    public static getMockLoggerFactory() {
        return vi.fn().mockImplementation((context?: string) => {
            return new MockLogger(context);
        });
    }

    public static getMockModule() {
        const LoggerMock = MockLogger.getMockLoggerFactory();

        return {
            Logger: LoggerMock,
            LogLevel: {
                ERROR: 'ERROR',
                WARNING: 'WARNING',
                DEBUG: 'DEBUG',
                VERBOSE: 'VERBOSE',
                INFO: 'INFO',
            },
        };
    }
}

/**
 * Setup for mocking the Logger module
 *
 * @example
 * ```ts
 * import { mockLogger } from '@cmmv/testing';
 *
 * vi.mock('@cmmv/core/lib/logger', () => mockLogger.getMockModule());
 *
 * describe('Seu teste', () => {
 *   beforeEach(() => {
 *     mockLogger.reset();
 *   });
 *
 *   it('testa o logger', () => {
 *     mockLogger.log('test', 'value');
 *   });
 * });
 * ```
 */
export const mockLogger = MockLogger;
