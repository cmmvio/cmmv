import { Controller, Get, Param, Queries } from '@cmmv/http';

import { LogsService } from './logs.service';

@Controller('logs')
export class LogsController {
    @Get()
    async getLogs(@Queries() queries: any) {
        return LogsService.getLogs(queries);
    }

    @Get(':logId')
    async getLog(@Param('logId') logId: string) {
        return LogsService.getLog(logId);
    }
}
