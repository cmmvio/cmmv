import { Controller, Get, Param, Queries } from '@cmmv/http';

import { Auth } from '@cmmv/auth';

import { LogsService } from './logs.service';

@Controller('logs')
export class LogsController {
    @Get({ exclude: true })
    @Auth({ rootOnly: true })
    async getLogs(@Queries() queries: any) {
        return LogsService.getLogs(queries);
    }

    @Get(':logId', { exclude: true })
    @Auth({ rootOnly: true })
    async getLog(@Param('logId') logId: string) {
        return LogsService.getLog(logId);
    }
}
