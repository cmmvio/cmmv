"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.LogsService = void 0;
const repository_1 = require("@cmmv/repository");
const typeorm_1 = require("typeorm");
class LogsService {
    static async getLogs(queries) {
        const repository = repository_1.Repository.getRepository(repository_1.Repository.logEntity);
        let where = {};
        if (queries?.startTime && queries?.endTime) {
            where.timestamp = (0, typeorm_1.Between)(queries?.startTime, queries?.endTime);
        }
        if (queries?.level)
            where.level = queries?.level;
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
    static async getLog(logId) {
        const repository = repository_1.Repository.getRepository(repository_1.Repository.logEntity);
        let log = await repository.findOne({
            where: { id: logId },
        });
        log.metadata = JSON.parse(log.metadata);
        log.event = JSON.parse(log.event);
        return log;
    }
}
exports.LogsService = LogsService;
