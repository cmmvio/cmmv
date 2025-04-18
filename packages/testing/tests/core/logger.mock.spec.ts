import { describe, it, expect, beforeEach } from 'vitest';
import { MockLogger, mockLogger } from '../../core/logger.mock';

describe('MockLogger', () => {
    let loggerInstance: MockLogger;

    beforeEach(() => {
        loggerInstance = new MockLogger('TestContext');
    });

    it('should create a logger with specified context', () => {
        expect(loggerInstance.context).toBe('TestContext');
    });

    it('should reset all spy methods', () => {
        loggerInstance.log('test');
        loggerInstance.error('error');
        loggerInstance.warning('warning');
        loggerInstance.debug('debug');
        loggerInstance.verbose('verbose');

        expect(loggerInstance.log).toHaveBeenCalledTimes(1);
        expect(loggerInstance.error).toHaveBeenCalledTimes(1);
        expect(loggerInstance.warning).toHaveBeenCalledTimes(1);
        expect(loggerInstance.debug).toHaveBeenCalledTimes(1);
        expect(loggerInstance.verbose).toHaveBeenCalledTimes(1);

        loggerInstance.reset();

        expect(loggerInstance.log).toHaveBeenCalledTimes(0);
        expect(loggerInstance.error).toHaveBeenCalledTimes(0);
        expect(loggerInstance.warning).toHaveBeenCalledTimes(0);
        expect(loggerInstance.debug).toHaveBeenCalledTimes(0);
        expect(loggerInstance.verbose).toHaveBeenCalledTimes(0);
    });

    it('should get mock module with Logger factory and LogLevel', () => {
        const mockModule = MockLogger.getMockModule();

        expect(mockModule).toHaveProperty('Logger');
        expect(mockModule).toHaveProperty('LogLevel');
        expect(mockModule.LogLevel).toHaveProperty('ERROR');
        expect(mockModule.LogLevel).toHaveProperty('WARNING');
        expect(mockModule.LogLevel).toHaveProperty('DEBUG');
        expect(mockModule.LogLevel).toHaveProperty('VERBOSE');
        expect(mockModule.LogLevel).toHaveProperty('INFO');
    });

    it('should create logger instances using getMockLoggerFactory', () => {
        const factory = MockLogger.getMockLoggerFactory();
        const instance1 = factory('Context1');
        const instance2 = factory('Context2');

        expect(instance1).toBeInstanceOf(MockLogger);
        expect(instance2).toBeInstanceOf(MockLogger);
        expect(instance1.context).toBe('Context1');
        expect(instance2.context).toBe('Context2');
    });

    it('should track method calls with correct arguments', () => {
        loggerInstance.log('test message', 'CustomContext');
        loggerInstance.error('error message');

        expect(loggerInstance.log).toHaveBeenCalledWith(
            'test message',
            'CustomContext',
        );
        expect(loggerInstance.error).toHaveBeenCalledWith('error message');
    });

    it('should expose mockLogger as an alias', () => {
        expect(mockLogger).toBe(MockLogger);
    });
});
