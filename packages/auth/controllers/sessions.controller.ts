import { Config } from '@cmmv/core';

import { Controller, Get, Post, Body, User, Queries } from '@cmmv/http';

import { AuthSessionsService } from '../services/sessions.service';

import { Auth } from '../lib/auth.decorator';

@Controller('sessions')
export class AuthSessionsController {
    constructor(private readonly sessionsService: AuthSessionsService) {}

    @Get({ exclude: true })
    @Auth()
    async getSessions(@Queries() queries: any, @User() user) {
        return this.sessionsService.getSessions(queries, user);
    }

    @Post('validate')
    async validateSession(@Body() body: { token: string }) {
        try {
            const isValid = await AuthSessionsService.validateSession(
                body.token,
            );
            return {
                valid: isValid,
                user: isValid ? this.extractUserFromToken(body.token) : null,
            };
        } catch (error) {
            return { valid: false };
        }
    }

    @Post('revoke')
    @Auth()
    async revokeSession(@Body() body: { sessionId: string }, @User() user) {
        try {
            const result = await this.sessionsService.revokeSession(
                body.sessionId,
                user,
            );
            return {
                success: true,
                message: 'Session revoked successfully',
            };
        } catch (error) {
            return {
                success: false,
                message: error.message || 'Failed to revoke session',
            };
        }
    }

    private extractUserFromToken(token: string) {
        try {
            const parts = token.split('.');
            if (parts.length !== 3) return null;

            const payload = JSON.parse(
                Buffer.from(parts[1], 'base64').toString(),
            );
            return {
                id: payload.id,
                username: payload.username,
            };
        } catch (error) {
            return null;
        }
    }
}
