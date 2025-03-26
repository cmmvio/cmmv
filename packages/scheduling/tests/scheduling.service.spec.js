"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const tslib_1 = require("tslib");
const vitest_1 = require("vitest");
const core_1 = require("@cmmv/core");
const scheduling_service_1 = require("../lib/scheduling.service");
const scheduling_decorator_1 = require("../lib/scheduling.decorator");
const scheduling_manager_1 = require("../lib/scheduling.manager");
let mockCronJob = {
    start: () => { },
    stop: () => { },
    cronTime: '',
    onTick: () => { },
    started: false,
    stopped: false,
};
class MockSchedulingManager extends scheduling_manager_1.SchedulingManager {
    constructor(cronTime, onTick) {
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
    start() {
        mockCronJob.start();
    }
    stop() {
        mockCronJob.stop();
    }
    changeCronTime(newCronTime) {
        mockCronJob.cronTime = newCronTime;
    }
}
global.SchedulingManager = MockSchedulingManager;
(0, vitest_1.describe)('SchedulingService with SchedulingManager', () => {
    (0, vitest_1.it)('should register a cron job with the correct schedule', () => {
        let TestClass = class TestClass {
            handleCron() {
                console.log('Cron executed');
            }
        };
        tslib_1.__decorate([
            (0, scheduling_decorator_1.Cron)('*/5 * * * * *'),
            tslib_1.__metadata("design:type", Function),
            tslib_1.__metadata("design:paramtypes", []),
            tslib_1.__metadata("design:returntype", void 0)
        ], TestClass.prototype, "handleCron", null);
        TestClass = tslib_1.__decorate([
            (0, core_1.Service)()
        ], TestClass);
        const instance = new TestClass();
        scheduling_service_1.SchedulingService.loadConfig();
        const registeredCron = core_1.Scope.getArray('__crons');
        (0, vitest_1.expect)(registeredCron.length).toBe(1);
        (0, vitest_1.expect)(registeredCron[0].cronTime).toBe('*/5 * * * * *');
    });
    (0, vitest_1.it)('should correctly execute the cron job and maintain the correct "this" context', () => {
        const mockFunction = function () {
            this.called = true;
        };
        const instance = {
            called: false,
            handleCron: mockFunction,
        };
        let TestClass = class TestClass {
            handleCron() {
                instance.handleCron.call(instance);
            }
        };
        tslib_1.__decorate([
            (0, scheduling_decorator_1.Cron)('*/1 * * * * *'),
            tslib_1.__metadata("design:type", Function),
            tslib_1.__metadata("design:paramtypes", []),
            tslib_1.__metadata("design:returntype", void 0)
        ], TestClass.prototype, "handleCron", null);
        TestClass = tslib_1.__decorate([
            (0, core_1.Service)()
        ], TestClass);
        const testClass = new TestClass();
        testClass.handleCron();
        (0, vitest_1.expect)(instance.called).toBe(true);
    });
});
