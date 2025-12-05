import { describe, it, expect, vi, beforeEach, afterEach, Mock } from 'vitest';
import { SchedulingManager } from '../../managers/scheduling.manager';
import { CronJob } from 'cron';
import { Logger } from '../../lib/logger';

vi.mock('../../lib/logger', () => {
    interface MockLoggerInstance {
        context: string;
        log: ReturnType<typeof vi.fn>;
    }

    const MockLogger = vi.fn(function (
        this: MockLoggerInstance,
        context: string,
    ) {
        this.context = context;
        this.log = vi.fn();
        return this;
    });

    return { Logger: MockLogger };
});

vi.mock('@cmmv/core', () => ({
    Config: vi.fn().mockImplementation(() => ({
        get: vi.fn(),
    })),
}));

describe('SchedulingManager', () => {
    let schedulingManager: SchedulingManager;
    const mockOnTick = vi.fn();
    const mockObserver1 = vi.fn();
    const mockObserver2 = vi.fn();

    const originalEnv = process.env.NODE_ENV;
    beforeEach(() => {
        process.env.NODE_ENV = 'dev';
        mockOnTick.mockClear();
        mockObserver1.mockClear();
        mockObserver2.mockClear();
    });

    afterEach(() => {
        schedulingManager?.stop();
        process.env.NODE_ENV = originalEnv;
    });

    it('should initialize and start the cron job', () => {
        schedulingManager = new SchedulingManager('* * * * * *', mockOnTick);
        const cronJob = (schedulingManager as any).cronJob as CronJob;

        expect(cronJob.isActive).toBe(false);

        schedulingManager.start();

        expect(cronJob.isActive).toBe(true);
    });

    it('should stop the cron job', () => {
        schedulingManager = new SchedulingManager('* * * * * *', mockOnTick);
        schedulingManager.start();
        schedulingManager.stop();

        const cronJob = (schedulingManager as any).cronJob as CronJob;
        expect(cronJob.isActive).toBe(false);
    });

    it('should restart the cron job', () => {
        schedulingManager = new SchedulingManager('* * * * * *', mockOnTick);
        schedulingManager.start();

        const cronJob = (schedulingManager as any).cronJob as CronJob;
        const stopSpy = vi.spyOn(cronJob, 'stop');
        const startSpy = vi.spyOn(cronJob, 'start');

        schedulingManager.restart();

        expect(stopSpy).toHaveBeenCalled();
        expect(startSpy).toHaveBeenCalled();
    });

    it('should change the cron time and restart the job', () => {
        schedulingManager = new SchedulingManager('* * * * * *', mockOnTick);
        const cronJob = (schedulingManager as any).cronJob as CronJob;
        const setTimeSpy = vi.spyOn(cronJob, 'setTime');
        const restartSpy = vi.spyOn(schedulingManager, 'restart');

        schedulingManager.changeCronTime('*/5 * * * * *');

        expect(setTimeSpy).toHaveBeenCalled();
        expect(restartSpy).toHaveBeenCalled();
    });

    it('should notify all observers when the cron triggers', async () => {
        schedulingManager = new SchedulingManager('* * * * * *', mockOnTick);
        schedulingManager.addObserver(mockObserver1);
        schedulingManager.addObserver(mockObserver2);

        const notify = (schedulingManager as any).notifyObservers.bind(
            schedulingManager,
        );

        notify(mockOnTick);

        expect(mockOnTick).toHaveBeenCalled();
        expect(mockObserver1).toHaveBeenCalled();
        expect(mockObserver2).toHaveBeenCalled();
    });
});
