import { describe, it, expect, beforeEach } from 'vitest';
import { Scope, Service } from '@cmmv/core';
import { SchedulingService } from '../../services/scheduling.service';
import { Cron } from '../../decorators/scheduling.decorator';
import { SchedulingManager } from '../../managers/scheduling.manager';

let mockCronJob = {
    start: () => {},
    stop: () => {},
    cronTime: '',
    onTick: () => {},
    started: false,
    stopped: false,
};

class MockSchedulingManager extends SchedulingManager {
    constructor(cronTime: string, onTick: () => void) {
        super(cronTime, onTick);
        mockCronJob = {
            cronTime,
            start: () => {
                mockCronJob.started = true;
            },
            stop: () => {
                mockCronJob.stopped = true;
            },
            onTick,
            started: false,
            stopped: false,
        };
    }

    public start(): void {
        mockCronJob.start();
    }

    public stop(): void {
        mockCronJob.stop();
    }

    public changeCronTime(newCronTime: string): void {
        mockCronJob.cronTime = newCronTime;
    }
}

(global as any).SchedulingManager = MockSchedulingManager;

describe('SchedulingService with SchedulingManager', () => {
    it('should register a cron job with the correct schedule', () => {
        @Service()
        class TestClass {
            @Cron('*/5 * * * * *')
            handleCron() {
                console.log('Cron executed');
            }
        }

        const instance = new TestClass();
        SchedulingService.loadConfig();

        const registeredCron = Scope.getArray('__crons');
        expect(registeredCron.length).toBe(1);
        expect(registeredCron[0].cronTime).toBe('*/5 * * * * *');
    });

    it('should correctly execute the cron job and maintain the correct "this" context', () => {
        const mockFunction = function (this: any) {
            this.called = true;
        };

        const instance = {
            called: false,
            handleCron: mockFunction,
        };

        @Service()
        class TestClass {
            @Cron('*/1 * * * * *')
            handleCron() {
                instance.handleCron.call(instance);
            }
        }

        const testClass = new TestClass();
        testClass.handleCron();

        expect(instance.called).toBe(true);
    });
});
