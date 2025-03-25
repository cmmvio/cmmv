import { Scope, Logger, Singleton, Service } from '@cmmv/core';
import { SchedulingManager } from './scheduling.manager';

@Service('scheduling')
export class SchedulingService extends Singleton {
    private logger: Logger = new Logger('SchedulingService');
    private managers: SchedulingManager[] = [];

    public static async loadConfig(): Promise<void> {
        const instance = SchedulingService.getInstance();
        const crons = Scope.getArray('__crons') || [];

        crons.forEach(({ target, method, cronTime }) => {
            const boundMethod = method.bind(target);
            const manager = new SchedulingManager(cronTime, boundMethod);

            manager.start();
            instance.managers.push(manager);

            if (process.env.NODE_ENV === 'dev') {
                instance.logger.log(
                    `Cron job started for ${method.name} with schedule: ${cronTime}`,
                );
            }
        });
    }

    public static stopAllJobs(): void {
        const instance = SchedulingService.getInstance();
        instance.managers.forEach((manager) => manager.stop());

        if (process.env.NODE_ENV === 'dev')
            instance.logger.log('All cron jobs stopped');
    }

    public static restartAllJobs(): void {
        const instance = SchedulingService.getInstance();
        instance.managers.forEach((manager) => manager.restart());

        if (process.env.NODE_ENV === 'dev')
            instance.logger.log('All cron jobs restarted');
    }

    public static changeCronTimeForJob(
        index: number,
        newCronTime: string,
    ): void {
        const instance = SchedulingService.getInstance();

        if (instance.managers[index]) {
            instance.managers[index].changeCronTime(newCronTime);

            if (process.env.NODE_ENV === 'dev') {
                instance.logger.log(
                    `Cron time changed for job at index ${index} to: ${newCronTime}`,
                );
            }
        } else {
            if (process.env.NODE_ENV === 'dev')
                instance.logger.error(`No cron job found at index ${index}`);
        }
    }

    public static addObserverToJob(index: number, observer: () => void): void {
        const instance = SchedulingService.getInstance();
        if (instance.managers[index]) {
            instance.managers[index].addObserver(observer);

            if (process.env.NODE_ENV === 'dev')
                instance.logger.log(
                    `Observer added to cron job at index ${index}`,
                );
        } else {
            if (process.env.NODE_ENV === 'dev')
                instance.logger.error(`No cron job found at index ${index}`);
        }
    }
}
