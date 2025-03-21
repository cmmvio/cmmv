import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { SchedulingManager } from './scheduling.manager';
import { CronJob } from 'cron';
import { Logger } from '@cmmv/core';

vi.mock('@cmmv/core', () => ({
    Logger: vi.fn().mockImplementation(() => ({
        log: vi.fn(),
    })),
}));

describe('SchedulingManager', () => {
    let schedulingManager: SchedulingManager;
    const mockOnTick = vi.fn();
    const mockObserver1 = vi.fn();
    const mockObserver2 = vi.fn();

    // Simular ambiente de desenvolvimento
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

        expect(cronJob.running).toBe(false);

        schedulingManager.start();

        expect(cronJob.running).toBe(true);
    });

    it('should stop the cron job', () => {
        schedulingManager = new SchedulingManager('* * * * * *', mockOnTick);
        schedulingManager.start();
        schedulingManager.stop();

        const cronJob = (schedulingManager as any).cronJob as CronJob;
        expect(cronJob.running).toBe(false);
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

    it('should log messages when NODE_ENV is dev', () => {
        const loggerInstance = (Logger as unknown as vi.Mock).mock.results[0]
            .value;
        schedulingManager = new SchedulingManager('* * * * * *', mockOnTick);
        schedulingManager.addObserver(mockObserver1);
        schedulingManager.start();
        schedulingManager.changeCronTime('*/2 * * * * *');
        schedulingManager.restart();
        schedulingManager.stop();

        expect(loggerInstance.log).toHaveBeenCalledWith(
            expect.stringContaining('Initialized cron job'),
        );
        expect(loggerInstance.log).toHaveBeenCalledWith(
            expect.stringContaining('Cron job started'),
        );
        expect(loggerInstance.log).toHaveBeenCalledWith(
            expect.stringContaining('stopped'),
        );
    });
});
