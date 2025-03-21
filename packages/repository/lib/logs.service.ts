import { Repository } from './repository.service';

import { Between } from 'typeorm';

export class LogsService {
    public static async getLogs(queries: any) {
        const repository = Repository.getRepository(Repository.logEntity);
        let where: any = {};

        if (queries?.startTime && queries?.endTime) {
            where.timestamp = Between(queries?.startTime, queries?.endTime);
        }

        if (queries?.level) where.level = queries?.level;

        const logs = await repository.find({
            take: queries?.limit || 5000,
            skip: queries?.offset || 0,
            where,
            order: {
                timestamp: 'DESC',
            },
            select: {
                id: true,
                message: true,
                level: true,
                timestamp: true,
            },
        });

        return logs;
    }

    public static async getLog(logId: string) {
        const repository = Repository.getRepository(Repository.logEntity);
        let log: any = await repository.findOne({
            where: { id: logId },
        });

        log.metadata = JSON.parse(log.metadata);
        log.event = JSON.parse(log.event);
        return log;
    }
}
