import { CronJob, CronTime } from 'cron';
import { Logger } from '../lib/logger';

type CronObserver = () => void;

export class SchedulingManager {
    private cronJob: CronJob;
    private observers: CronObserver[] = [];

    constructor(cronTime: string, onTick: () => void) {
        this.cronJob = new CronJob(cronTime, () =>
            this.notifyObservers(onTick),
        );
    }

    public start(): void {
        if (!this.cronJob.isActive) this.cronJob.start();
    }

    public stop(): void {
        if (this.cronJob.isActive) this.cronJob.stop();
    }

    public restart(): void {
        this.stop();
        this.start();
    }

    public changeCronTime(newCronTime: string): void {
        this.cronJob.setTime(new CronTime(newCronTime));
        this.restart();
    }

    public addObserver(observer: CronObserver): void {
        if (!this.observers.includes(observer)) this.observers.push(observer);
    }

    private notifyObservers(originalOnTick: () => void): void {
        originalOnTick();
        this.observers.forEach((observer) => observer());
    }
}
