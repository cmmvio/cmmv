import { Controller, Get, Param, Queries } from '@cmmv/http';

import { Auth } from '@cmmv/auth';

import { LogsService } from './logs.service';

@Controller('logs')
export class LogsController {
    @Get()
    @Auth({ rootOnly: true })
    async getLogs(@Queries() queries: any) {
        return LogsService.getLogs(queries);
    }

    @Get(':logId')
    @Auth({ rootOnly: true })
    async getLog(@Param('logId') logId: string) {
        return LogsService.getLog(logId);
    }
}
