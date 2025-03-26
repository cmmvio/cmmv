"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const vitest_1 = require("vitest");
const scheduling_manager_1 = require("../lib/scheduling.manager");
const core_1 = require("@cmmv/core");
vitest_1.vi.mock('@cmmv/core', () => ({
    Logger: vitest_1.vi.fn().mockImplementation(() => ({
        log: vitest_1.vi.fn(),
    })),
}));
(0, vitest_1.describe)('SchedulingManager', () => {
    let schedulingManager;
    const mockOnTick = vitest_1.vi.fn();
    const mockObserver1 = vitest_1.vi.fn();
    const mockObserver2 = vitest_1.vi.fn();
    // Simular ambiente de desenvolvimento
    const originalEnv = process.env.NODE_ENV;
    (0, vitest_1.beforeEach)(() => {
        process.env.NODE_ENV = 'dev';
        mockOnTick.mockClear();
        mockObserver1.mockClear();
        mockObserver2.mockClear();
    });
    (0, vitest_1.afterEach)(() => {
        schedulingManager?.stop();
        process.env.NODE_ENV = originalEnv;
    });
    (0, vitest_1.it)('should initialize and start the cron job', () => {
        schedulingManager = new scheduling_manager_1.SchedulingManager('* * * * * *', mockOnTick);
        const cronJob = schedulingManager.cronJob;
        (0, vitest_1.expect)(cronJob.running).toBe(false);
        schedulingManager.start();
        (0, vitest_1.expect)(cronJob.running).toBe(true);
    });
    (0, vitest_1.it)('should stop the cron job', () => {
        schedulingManager = new scheduling_manager_1.SchedulingManager('* * * * * *', mockOnTick);
        schedulingManager.start();
        schedulingManager.stop();
        const cronJob = schedulingManager.cronJob;
        (0, vitest_1.expect)(cronJob.running).toBe(false);
    });
    (0, vitest_1.it)('should restart the cron job', () => {
        schedulingManager = new scheduling_manager_1.SchedulingManager('* * * * * *', mockOnTick);
        schedulingManager.start();
        const cronJob = schedulingManager.cronJob;
        const stopSpy = vitest_1.vi.spyOn(cronJob, 'stop');
        const startSpy = vitest_1.vi.spyOn(cronJob, 'start');
        schedulingManager.restart();
        (0, vitest_1.expect)(stopSpy).toHaveBeenCalled();
        (0, vitest_1.expect)(startSpy).toHaveBeenCalled();
    });
    (0, vitest_1.it)('should change the cron time and restart the job', () => {
        schedulingManager = new scheduling_manager_1.SchedulingManager('* * * * * *', mockOnTick);
        const cronJob = schedulingManager.cronJob;
        const setTimeSpy = vitest_1.vi.spyOn(cronJob, 'setTime');
        const restartSpy = vitest_1.vi.spyOn(schedulingManager, 'restart');
        schedulingManager.changeCronTime('*/5 * * * * *');
        (0, vitest_1.expect)(setTimeSpy).toHaveBeenCalled();
        (0, vitest_1.expect)(restartSpy).toHaveBeenCalled();
    });
    (0, vitest_1.it)('should notify all observers when the cron triggers', async () => {
        schedulingManager = new scheduling_manager_1.SchedulingManager('* * * * * *', mockOnTick);
        schedulingManager.addObserver(mockObserver1);
        schedulingManager.addObserver(mockObserver2);
        const notify = schedulingManager.notifyObservers.bind(schedulingManager);
        notify(mockOnTick);
        (0, vitest_1.expect)(mockOnTick).toHaveBeenCalled();
        (0, vitest_1.expect)(mockObserver1).toHaveBeenCalled();
        (0, vitest_1.expect)(mockObserver2).toHaveBeenCalled();
    });
    (0, vitest_1.it)('should log messages when NODE_ENV is dev', () => {
        const loggerInstance = core_1.Logger.mock.results[0]
            .value;
        schedulingManager = new scheduling_manager_1.SchedulingManager('* * * * * *', mockOnTick);
        schedulingManager.addObserver(mockObserver1);
        schedulingManager.start();
        schedulingManager.changeCronTime('*/2 * * * * *');
        schedulingManager.restart();
        schedulingManager.stop();
        (0, vitest_1.expect)(loggerInstance.log).toHaveBeenCalledWith(vitest_1.expect.stringContaining('Initialized cron job'));
        (0, vitest_1.expect)(loggerInstance.log).toHaveBeenCalledWith(vitest_1.expect.stringContaining('Cron job started'));
        (0, vitest_1.expect)(loggerInstance.log).toHaveBeenCalledWith(vitest_1.expect.stringContaining('stopped'));
    });
});
