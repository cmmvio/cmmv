import { describe, it, expect, beforeEach, vi } from 'vitest';
import { AuthSessionsController } from '../../controllers/sessions.controller';
import { AuthSessionsService } from '../../services/sessions.service';

describe('AuthSessionsController', () => {
    let controller: AuthSessionsController;
    let mockSessionsService: Partial<AuthSessionsService>;

    beforeEach(() => {
        vi.clearAllMocks();

        mockSessionsService = {
            getSessions: vi.fn(),
            revokeSession: vi.fn(),
        };

        controller = new AuthSessionsController(
            mockSessionsService as AuthSessionsService,
        );
    });

    describe('getSessions', () => {
        it('should return sessions for user', async () => {
            const sessions = [
                { id: 'session-1', userId: 'user-1', createdAt: new Date() },
                { id: 'session-2', userId: 'user-1', createdAt: new Date() },
            ];
            vi.mocked(mockSessionsService.getSessions).mockResolvedValue(
                sessions as any,
            );

            const queries = { page: 1, limit: 10 };
            const user = { id: 'user-1' };

            const result = await controller.getSessions(queries, user);

            expect(result).toEqual(sessions);
            expect(mockSessionsService.getSessions).toHaveBeenCalledWith(
                queries,
                user,
            );
        });
    });

    describe('validateSession', () => {
        it('should return valid true for valid token', async () => {
            const validToken =
                'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpZCI6InVzZXItMSIsInVzZXJuYW1lIjoidGVzdHVzZXIifQ.signature';

            vi.spyOn(AuthSessionsService, 'validateSession').mockResolvedValue(
                true,
            );

            const result = await controller.validateSession({
                token: validToken,
            });

            expect(result.valid).toBe(true);
            expect(result.user).toEqual({
                id: 'user-1',
                username: 'testuser',
            });
        });

        it('should return valid false for invalid token', async () => {
            vi.spyOn(AuthSessionsService, 'validateSession').mockResolvedValue(
                false,
            );

            const result = await controller.validateSession({
                token: 'invalid-token',
            });

            expect(result.valid).toBe(false);
            expect(result.user).toBeNull();
        });

        it('should return valid false on error', async () => {
            vi.spyOn(AuthSessionsService, 'validateSession').mockRejectedValue(
                new Error('Validation error'),
            );

            const result = await controller.validateSession({
                token: 'error-token',
            });

            expect(result).toEqual({ valid: false });
        });
    });

    describe('revokeSession', () => {
        it('should revoke session successfully', async () => {
            vi.mocked(mockSessionsService.revokeSession).mockResolvedValue(
                true as any,
            );

            const user = { id: 'user-1' };
            const result = await controller.revokeSession(
                { sessionId: 'session-123' },
                user,
            );

            expect(result).toEqual({
                success: true,
                message: 'Session revoked successfully',
            });
            expect(mockSessionsService.revokeSession).toHaveBeenCalledWith(
                'session-123',
                user,
            );
        });

        it('should return error message on failure', async () => {
            vi.mocked(mockSessionsService.revokeSession).mockRejectedValue(
                new Error('Session not found'),
            );

            const user = { id: 'user-1' };
            const result = await controller.revokeSession(
                { sessionId: 'invalid-session' },
                user,
            );

            expect(result).toEqual({
                success: false,
                message: 'Session not found',
            });
        });

        it('should return default message when error has no message', async () => {
            vi.mocked(mockSessionsService.revokeSession).mockRejectedValue({});

            const user = { id: 'user-1' };
            const result = await controller.revokeSession(
                { sessionId: 'invalid-session' },
                user,
            );

            expect(result).toEqual({
                success: false,
                message: 'Failed to revoke session',
            });
        });
    });

    describe('extractUserFromToken (private method via validateSession)', () => {
        it('should return null for token with wrong number of parts', async () => {
            vi.spyOn(AuthSessionsService, 'validateSession').mockResolvedValue(
                true,
            );

            const result = await controller.validateSession({
                token: 'only-one-part',
            });

            expect(result.user).toBeNull();
        });

        it('should return null for token with invalid base64', async () => {
            vi.spyOn(AuthSessionsService, 'validateSession').mockResolvedValue(
                true,
            );

            const result = await controller.validateSession({
                token: 'header.!!!invalid-base64!!!.signature',
            });

            expect(result.user).toBeNull();
        });
    });
});
