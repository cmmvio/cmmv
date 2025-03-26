"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.SchedulingManager = void 0;
const cron_1 = require("cron");
const core_1 = require("@cmmv/core");
class SchedulingManager {
    constructor(cronTime, onTick) {
        this.observers = [];
        this.logger = new core_1.Logger('SchedulingManager');
        this.cronJob = new cron_1.CronJob(cronTime, () => this.notifyObservers(onTick));
        if (process.env.NODE_ENV === 'dev')
            this.logger.log(`Initialized cron job with schedule: ${cronTime}`);
    }
    start() {
        if (!this.cronJob.running) {
            this.cronJob.start();
            if (process.env.NODE_ENV === 'dev')
                this.logger.log(`Cron job started`);
        }
    }
    stop() {
        if (this.cronJob.running) {
            this.cronJob.stop();
            if (process.env.NODE_ENV === 'dev')
                this.logger.log(`Cron job stopped`);
        }
    }
    restart() {
        this.stop();
        this.start();
        if (process.env.NODE_ENV === 'dev')
            this.logger.log(`Cron job restarted`);
    }
    changeCronTime(newCronTime) {
        this.cronJob.setTime(new cron_1.CronTime(newCronTime));
        this.restart();
        if (process.env.NODE_ENV === 'dev')
            this.logger.log(`Cron job time changed to: ${newCronTime}`);
    }
    addObserver(observer) {
        this.observers.push(observer);
        if (process.env.NODE_ENV === 'dev')
            this.logger.log(`Observer added to cron job`);
    }
    notifyObservers(originalOnTick) {
        originalOnTick();
        this.observers.forEach((observer) => observer());
        if (process.env.NODE_ENV === 'dev')
            this.logger.log('Notified all observers after cron execution');
    }
}
exports.SchedulingManager = SchedulingManager;
