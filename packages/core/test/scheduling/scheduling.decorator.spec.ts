import { describe, it, expect, vi, beforeEach } from 'vitest';
import { Cron, CRON_METADATA } from '../../decorators/scheduling.decorator';
import { Scope } from '../../lib/scope';
import 'reflect-metadata';

Scope.addToArray = vi.fn();

vi.mock('@cmmv/core', () => ({
    Config: vi.fn().mockImplementation(() => ({
        get: vi.fn(),
    })),
}));

const originalDefineMetadata = Reflect.defineMetadata;
Reflect.defineMetadata = vi.fn().mockImplementation((key, value, target) => {
    return originalDefineMetadata
        ? originalDefineMetadata(key, value, target)
        : undefined;
});

describe('Cron Decorator', () => {
    beforeEach(() => {
        vi.clearAllMocks();
    });

    it('should define metadata on the decorated method', () => {
        class TestClass {
            @Cron('0 0 * * *')
            public testMethod() {
                return 'executed';
            }
        }

        expect(Reflect.defineMetadata).toHaveBeenCalledWith(
            CRON_METADATA,
            '0 0 * * *',
            expect.any(Function),
        );
    });

    it('should add the cron job to the Scope.__crons array', () => {
        class TestClass {
            @Cron('*/5 * * * *')
            public testMethod() {
                return 'executed';
            }
        }

        expect(Scope.addToArray).toHaveBeenCalledWith('__crons', {
            target: TestClass.prototype,
            method: expect.any(Function),
            cronTime: '*/5 * * * *',
        });
    });

    it('should preserve the original method functionality', () => {
        class TestClass {
            public value: string = '';

            @Cron('0 0 * * *')
            public testMethod(arg: string) {
                this.value = `processed: ${arg}`;
                return this.value;
            }
        }

        const instance = new TestClass();
        const result = instance.testMethod('test input');

        expect(result).toBe('processed: test input');
        expect(instance.value).toBe('processed: test input');
    });

    it('should work with inherited class methods', () => {
        class BaseClass {
            @Cron('0 12 * * *')
            public baseMethod() {
                return 'base method executed';
            }
        }

        class ChildClass extends BaseClass {
            @Cron('0 18 * * *')
            public childMethod() {
                return 'child method executed';
            }
        }

        expect(Scope.addToArray).toHaveBeenCalledTimes(2);

        expect(Scope.addToArray).toHaveBeenCalledWith(
            '__crons',
            expect.objectContaining({
                target: BaseClass.prototype,
                cronTime: '0 12 * * *',
            }),
        );

        expect(Scope.addToArray).toHaveBeenCalledWith(
            '__crons',
            expect.objectContaining({
                target: ChildClass.prototype,
                cronTime: '0 18 * * *',
            }),
        );
    });

    it('should accept different cron time formats', () => {
        class TestCronFormats {
            @Cron('*/30 * * * *')
            public everyThirtyMinutes() {}

            @Cron('0 */2 * * *')
            public everyTwoHours() {}

            @Cron('0 0 * * 1')
            public everyMonday() {}
        }

        expect(Scope.addToArray).toHaveBeenCalledTimes(3);

        expect(Scope.addToArray).toHaveBeenCalledWith(
            '__crons',
            expect.objectContaining({ cronTime: '*/30 * * * *' }),
        );

        expect(Scope.addToArray).toHaveBeenCalledWith(
            '__crons',
            expect.objectContaining({ cronTime: '0 */2 * * *' }),
        );

        expect(Scope.addToArray).toHaveBeenCalledWith(
            '__crons',
            expect.objectContaining({ cronTime: '0 0 * * 1' }),
        );
    });

    it('should allow decorating multiple methods in the same class', () => {
        class MultiMethodClass {
            @Cron('0 0 * * *')
            public dailyMethod() {}

            @Cron('0 0 * * 0')
            public weeklyMethod() {}

            @Cron('0 0 1 * *')
            public monthlyMethod() {}
        }

        expect(Scope.addToArray).toHaveBeenCalledTimes(3);

        expect(Scope.addToArray).toHaveBeenCalledWith(
            '__crons',
            expect.objectContaining({ cronTime: '0 0 * * *' }),
        );

        expect(Scope.addToArray).toHaveBeenCalledWith(
            '__crons',
            expect.objectContaining({ cronTime: '0 0 * * 0' }),
        );

        expect(Scope.addToArray).toHaveBeenCalledWith(
            '__crons',
            expect.objectContaining({ cronTime: '0 0 1 * *' }),
        );
    });
});
