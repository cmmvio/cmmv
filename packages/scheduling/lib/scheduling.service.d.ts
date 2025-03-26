import { Singleton } from '@cmmv/core';
export declare class SchedulingService extends Singleton {
    private logger;
    private managers;
    static loadConfig(): Promise<void>;
    static stopAllJobs(): void;
    static restartAllJobs(): void;
    static changeCronTimeForJob(index: number, newCronTime: string): void;
    static addObserverToJob(index: number, observer: () => void): void;
}
