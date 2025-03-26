"use strict";
var SchedulingService_1;
Object.defineProperty(exports, "__esModule", { value: true });
exports.SchedulingService = void 0;
const tslib_1 = require("tslib");
const core_1 = require("@cmmv/core");
const scheduling_manager_1 = require("./scheduling.manager");
let SchedulingService = SchedulingService_1 = class SchedulingService extends core_1.Singleton {
    constructor() {
        super(...arguments);
        this.logger = new core_1.Logger('SchedulingService');
        this.managers = [];
    }
    static async loadConfig() {
        const instance = SchedulingService_1.getInstance();
        const crons = core_1.Scope.getArray('__crons') || [];
        crons.forEach(({ target, method, cronTime }) => {
            const boundMethod = method.bind(target);
            const manager = new scheduling_manager_1.SchedulingManager(cronTime, boundMethod);
            manager.start();
            instance.managers.push(manager);
            if (process.env.NODE_ENV === 'dev') {
                instance.logger.log(`Cron job started for ${method.name} with schedule: ${cronTime}`);
            }
        });
    }
    static stopAllJobs() {
        const instance = SchedulingService_1.getInstance();
        instance.managers.forEach((manager) => manager.stop());
        if (process.env.NODE_ENV === 'dev')
            instance.logger.log('All cron jobs stopped');
    }
    static restartAllJobs() {
        const instance = SchedulingService_1.getInstance();
        instance.managers.forEach((manager) => manager.restart());
        if (process.env.NODE_ENV === 'dev')
            instance.logger.log('All cron jobs restarted');
    }
    static changeCronTimeForJob(index, newCronTime) {
        const instance = SchedulingService_1.getInstance();
        if (instance.managers[index]) {
            instance.managers[index].changeCronTime(newCronTime);
            if (process.env.NODE_ENV === 'dev') {
                instance.logger.log(`Cron time changed for job at index ${index} to: ${newCronTime}`);
            }
        }
        else {
            if (process.env.NODE_ENV === 'dev')
                instance.logger.error(`No cron job found at index ${index}`);
        }
    }
    static addObserverToJob(index, observer) {
        const instance = SchedulingService_1.getInstance();
        if (instance.managers[index]) {
            instance.managers[index].addObserver(observer);
            if (process.env.NODE_ENV === 'dev')
                instance.logger.log(`Observer added to cron job at index ${index}`);
        }
        else {
            if (process.env.NODE_ENV === 'dev')
                instance.logger.error(`No cron job found at index ${index}`);
        }
    }
};
exports.SchedulingService = SchedulingService;
exports.SchedulingService = SchedulingService = SchedulingService_1 = tslib_1.__decorate([
    (0, core_1.Service)('scheduling')
], SchedulingService);
