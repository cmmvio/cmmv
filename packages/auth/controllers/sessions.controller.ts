import { Config } from '@cmmv/core';

import { Controller, Get, User, Queries } from '@cmmv/http';

import { AuthSessionsService } from '../services/sessions.service';

import { Auth } from '../lib/auth.decorator';

@Controller('sessions')
export class AuthSessionsController {
    constructor(private readonly sessionsService: AuthSessionsService) {}

    @Get({ exclude: true })
    @Auth()
    async user(@Queries() queries: any, @User() user) {
        return this.sessionsService.getSessions(queries, user);
    }
}
