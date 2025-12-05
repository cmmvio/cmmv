import { describe, it, expect, beforeEach, vi } from 'vitest';
import { OAuth2Controller } from '../../controllers/oauth2.controller';
import { OAuth2Service } from '../../services/oauth2.service';

describe('OAuth2Controller', () => {
    let controller: OAuth2Controller;
    let mockOAuth2Service: Partial<OAuth2Service>;
    let mockReq: any;
    let mockRes: any;

    beforeEach(() => {
        vi.clearAllMocks();

        mockOAuth2Service = {
            auth: vi.fn(),
            getClient: vi.fn(),
            getClientAdmin: vi.fn(),
            getClients: vi.fn(),
            createClient: vi.fn(),
            updateClient: vi.fn(),
            deleteClient: vi.fn(),
            authorize: vi.fn(),
            handler: vi.fn(),
        };

        mockReq = {
            headers: {},
        };

        mockRes = {
            redirect: vi.fn(),
        };

        controller = new OAuth2Controller(mockOAuth2Service as OAuth2Service);
    });

    describe('handlerAuth', () => {
        it('should call auth service', async () => {
            const authResult = { redirectUrl: 'https://example.com/callback' };
            vi.mocked(mockOAuth2Service.auth).mockResolvedValue(
                authResult as any,
            );

            const queries = {
                client_id: 'client-1',
                redirect_uri: 'https://app.com/callback',
            };
            const result = await controller.handlerAuth(
                mockReq,
                mockRes,
                queries,
            );

            expect(result).toEqual(authResult);
            expect(mockOAuth2Service.auth).toHaveBeenCalledWith(
                mockReq,
                mockRes,
                queries,
            );
        });
    });

    describe('getClient', () => {
        it('should return client by id', async () => {
            const client = { id: 'client-1', name: 'Test App' };
            vi.mocked(mockOAuth2Service.getClient).mockResolvedValue(
                client as any,
            );

            const result = await controller.getClient('client-1');

            expect(result).toEqual(client);
            expect(mockOAuth2Service.getClient).toHaveBeenCalledWith(
                'client-1',
            );
        });
    });

    describe('getClientAdmin', () => {
        it('should return client with admin details', async () => {
            const client = {
                id: 'client-1',
                name: 'Test App',
                clientSecret: 'secret-123',
            };
            vi.mocked(mockOAuth2Service.getClientAdmin).mockResolvedValue(
                client as any,
            );

            const result = await controller.getClientAdmin('client-1');

            expect(result).toEqual(client);
            expect(mockOAuth2Service.getClientAdmin).toHaveBeenCalledWith(
                'client-1',
            );
        });
    });

    describe('getClients', () => {
        it('should return all clients', async () => {
            const clients = [
                { id: 'client-1', name: 'App 1' },
                { id: 'client-2', name: 'App 2' },
            ];
            vi.mocked(mockOAuth2Service.getClients).mockResolvedValue(
                clients as any,
            );

            const result = await controller.getClients();

            expect(result).toEqual(clients);
            expect(mockOAuth2Service.getClients).toHaveBeenCalled();
        });
    });

    describe('createClient', () => {
        it('should create a new OAuth client', async () => {
            const newClient = {
                id: 'client-3',
                name: 'New App',
                clientId: 'new-client-id',
                clientSecret: 'new-secret',
            };
            vi.mocked(mockOAuth2Service.createClient).mockResolvedValue(
                newClient as any,
            );

            const payload = {
                name: 'New App',
                redirectUris: ['https://newapp.com/callback'],
            };
            const result = await controller.createClient(payload as any);

            expect(result).toEqual(newClient);
            expect(mockOAuth2Service.createClient).toHaveBeenCalledWith(
                payload,
            );
        });
    });

    describe('updateClient', () => {
        it('should update an OAuth client', async () => {
            const updatedClient = {
                id: 'client-1',
                name: 'Updated App',
            };
            vi.mocked(mockOAuth2Service.updateClient).mockResolvedValue(
                updatedClient as any,
            );

            const payload = { name: 'Updated App' };
            const result = await controller.updateClient(
                'client-1',
                payload as any,
            );

            expect(result).toEqual(updatedClient);
            expect(mockOAuth2Service.updateClient).toHaveBeenCalledWith(
                'client-1',
                payload,
            );
        });
    });

    describe('deleteClient', () => {
        it('should delete an OAuth client', async () => {
            vi.mocked(mockOAuth2Service.deleteClient).mockResolvedValue({
                affected: 1,
            } as any);

            const result = await controller.deleteClient('client-1');

            expect(result).toEqual({ affected: 1 });
            expect(mockOAuth2Service.deleteClient).toHaveBeenCalledWith(
                'client-1',
            );
        });
    });

    describe('authorize', () => {
        it('should authorize OAuth request', async () => {
            const authorizeResult = { code: 'auth-code-123' };
            vi.mocked(mockOAuth2Service.authorize).mockResolvedValue(
                authorizeResult as any,
            );

            const user = { id: 'user-1', username: 'testuser' };
            const payload = {
                client_id: 'client-1',
                redirect_uri: 'https://app.com/callback',
                scope: 'read write',
            };

            const result = await controller.authorize(
                mockReq,
                mockRes,
                payload as any,
                user,
            );

            expect(result).toEqual(authorizeResult);
            expect(mockOAuth2Service.authorize).toHaveBeenCalledWith(
                'client-1',
                payload,
                user,
                mockReq,
                mockRes,
            );
        });
    });

    describe('handler', () => {
        it('should handle OAuth callback', async () => {
            const handlerResult = { access_token: 'token-123' };
            vi.mocked(mockOAuth2Service.handler).mockResolvedValue(
                handlerResult as any,
            );

            const payload = {
                code: 'auth-code',
                state: 'state-123',
            };

            const result = await controller.handler(
                payload as any,
                mockReq,
                mockRes,
            );

            expect(result).toEqual(handlerResult);
            expect(mockOAuth2Service.handler).toHaveBeenCalledWith(
                payload,
                mockReq,
                mockRes,
            );
        });
    });
});
