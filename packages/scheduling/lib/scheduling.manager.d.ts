type CronObserver = () => void;
export declare class SchedulingManager {
    private cronJob;
    private observers;
    private logger;
    constructor(cronTime: string, onTick: () => void);
    start(): void;
    stop(): void;
    restart(): void;
    changeCronTime(newCronTime: string): void;
    addObserver(observer: CronObserver): void;
    private notifyObservers;
}
export {};
