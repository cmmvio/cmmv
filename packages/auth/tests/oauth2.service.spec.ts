import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';

// Mock crypto
vi.mock('node:crypto', () => ({
    randomBytes: vi.fn(() => ({
        toString: vi.fn().mockReturnValue('mock-random-hex'),
    })),
    default: {
        randomBytes: vi.fn(() => ({
            toString: vi.fn().mockReturnValue('mock-random-hex'),
        })),
    },
}));

// Mock fs
vi.mock('node:fs', () => ({
    existsSync: vi.fn().mockReturnValue(true),
    default: {
        existsSync: vi.fn().mockReturnValue(true),
    },
}));

// Mock path
vi.mock('node:path', () => ({
    join: vi.fn((...args) => args.join('/')),
    default: {
        join: vi.fn((...args) => args.join('/')),
    },
}));

// Mock @cmmv/core
vi.mock('@cmmv/core', () => ({
    Service: vi.fn(() => (target: any) => target),
    AbstractService: class MockAbstractService {},
    Config: {
        get: vi.fn((key: string, defaultValue?: any) => {
            const configs: Record<string, any> = {
                'auth.templates.auth': null,
            };
            return configs[key] ?? defaultValue;
        }),
    },
}));

// Mock @cmmv/http
vi.mock('@cmmv/http', () => ({
    HttpException: class MockHttpException extends Error {
        constructor(
            message: string,
            public status: number,
        ) {
            super(message);
            this.name = 'HttpException';
        }
    },
    HttpStatus: {
        OK: 200,
        BAD_REQUEST: 400,
        UNAUTHORIZED: 401,
        NOT_FOUND: 404,
        INTERNAL_SERVER_ERROR: 500,
    },
    CMMVRenderer: vi.fn().mockImplementation(() => ({
        renderFile: vi.fn((template, data, options, callback) => {
            callback(null, '<html>rendered</html>');
        }),
    })),
}));

// Mock @cmmv/repository
vi.mock('@cmmv/repository', () => ({
    Repository: {
        getEntity: vi.fn((name) => {
            // Return a mock constructor for entity classes
            return class MockEntity {
                [key: string]: any;
            };
        }),
        findBy: vi.fn().mockResolvedValue(null),
        findAll: vi.fn().mockResolvedValue({ data: [], count: 0 }),
        insert: vi.fn().mockResolvedValue({ success: true }),
        updateOne: vi.fn().mockResolvedValue(true),
        delete: vi.fn().mockResolvedValue(true),
        queryBuilder: vi.fn((query) => query),
    },
}));

// Mock authorization service
vi.mock('./autorization.service', () => ({
    AuthAutorizationService: class MockAuthAutorizationService {
        autorizeUser = vi.fn().mockResolvedValue({
            token: 'mock-access-token',
            refreshToken: 'mock-refresh-token',
        });
    },
}));

// Mock location service
vi.mock('./location.service', () => ({
    AuthLocationService: class MockAuthLocationService {
        getLocation = vi.fn().mockResolvedValue('New York, US');
    },
}));

import { OAuth2Service } from '../services/oauth2.service';
import { Repository } from '@cmmv/repository';
import * as fs from 'node:fs';

describe('OAuth2Service', () => {
    let service: OAuth2Service;
    let mockAuthorizationService: any;
    let mockLocationService: any;

    const mockReq = {
        ip: '127.0.0.1',
        headers: {
            host: 'localhost',
            origin: 'http://localhost',
            referer: 'http://localhost',
            'user-agent': 'Mozilla/5.0',
        },
    };

    const mockRes = {
        send: vi.fn(),
        status: vi.fn().mockReturnThis(),
        res: {
            writeHead: vi.fn(),
            end: vi.fn(),
        },
    };

    beforeEach(() => {
        vi.clearAllMocks();

        mockAuthorizationService = {
            autorizeUser: vi.fn().mockResolvedValue({
                token: 'mock-access-token',
                refreshToken: 'mock-refresh-token',
            }),
        };

        mockLocationService = {
            getLocation: vi.fn().mockResolvedValue('New York, US'),
        };

        service = new OAuth2Service(
            mockAuthorizationService,
            mockLocationService,
        );
    });

    afterEach(() => {
        vi.clearAllMocks();
    });

    describe('auth', () => {
        it('should throw error when client_id is missing', async () => {
            const queries = {
                redirect_uri: 'http://localhost',
                response_type: 'code',
                state: 'abc',
            };

            await expect(
                service.auth(mockReq, mockRes, queries as any),
            ).rejects.toThrow('Client ID is required');
        });

        it('should throw error when redirect_uri is missing', async () => {
            const queries = {
                client_id: 'client-123',
                response_type: 'code',
                state: 'abc',
            };

            await expect(
                service.auth(mockReq, mockRes, queries as any),
            ).rejects.toThrow('Redirect URI is required');
        });

        it('should throw error when response_type is missing', async () => {
            const queries = {
                client_id: 'client-123',
                redirect_uri: 'http://localhost',
                state: 'abc',
            };

            await expect(
                service.auth(mockReq, mockRes, queries as any),
            ).rejects.toThrow('Response Type is required');
        });

        it('should throw error when state is missing', async () => {
            const queries = {
                client_id: 'client-123',
                redirect_uri: 'http://localhost',
                response_type: 'code',
            };

            await expect(
                service.auth(mockReq, mockRes, queries as any),
            ).rejects.toThrow('State is required');
        });

        it('should throw error when client not found', async () => {
            vi.mocked(Repository.findBy).mockResolvedValue(null);
            const queries = {
                client_id: 'client-123',
                redirect_uri: 'http://localhost',
                response_type: 'code',
                state: 'abc',
            };

            await expect(
                service.auth(mockReq, mockRes, queries),
            ).rejects.toThrow('Client not found');
        });

        it('should throw error when template not found', async () => {
            vi.mocked(Repository.findBy).mockResolvedValue({
                clientId: 'client-123',
            });
            vi.mocked(fs.existsSync).mockReturnValue(false);

            const queries = {
                client_id: 'client-123',
                redirect_uri: 'http://localhost',
                response_type: 'code',
                state: 'abc',
            };

            await expect(
                service.auth(mockReq, mockRes, queries),
            ).rejects.toThrow('Template not found');
        });
    });

    describe('authorize', () => {
        const mockClient = {
            id: 'client-id',
            clientId: 'client-123',
            authorizedDomains: [],
            redirectUris: ['http://localhost/callback'],
            allowedGrantTypes: ['authorization_code'],
        };

        const mockBody = {
            redirect_uri: 'http://localhost/callback',
            scope: 'read',
            state: 'abc123',
            response_type: 'code',
            origin: 'http://localhost',
            referer: 'http://localhost',
            agent: 'Mozilla/5.0',
        };

        const mockUser = { id: 'user-123' };

        it('should throw error when client not found', async () => {
            vi.mocked(Repository.findBy).mockResolvedValue(null);

            await expect(
                service.authorize(
                    'client-123',
                    mockBody,
                    mockUser,
                    mockReq,
                    mockRes,
                ),
            ).rejects.toThrow('Client not found');
        });

        it('should throw error for invalid domain', async () => {
            const clientWithDomains = {
                ...mockClient,
                authorizedDomains: ['example.com'],
            };
            vi.mocked(Repository.findBy).mockResolvedValue(clientWithDomains);

            await expect(
                service.authorize(
                    'client-123',
                    mockBody,
                    mockUser,
                    mockReq,
                    mockRes,
                ),
            ).rejects.toThrow('Invalid domain');
        });

        it('should throw error for invalid redirect URI', async () => {
            vi.mocked(Repository.findBy).mockResolvedValue(mockClient);
            const invalidBody = {
                ...mockBody,
                redirect_uri: 'http://invalid.com/callback',
            };

            await expect(
                service.authorize(
                    'client-123',
                    invalidBody,
                    mockUser,
                    mockReq,
                    mockRes,
                ),
            ).rejects.toThrow('Invalid redirect URI');
        });

        it('should throw error for invalid scope', async () => {
            vi.mocked(Repository.findBy).mockResolvedValue(mockClient);
            const invalidBody = { ...mockBody, scope: 'invalid' };

            await expect(
                service.authorize(
                    'client-123',
                    invalidBody,
                    mockUser,
                    mockReq,
                    mockRes,
                ),
            ).rejects.toThrow('Invalid scope');
        });

        it('should throw error for missing state', async () => {
            vi.mocked(Repository.findBy).mockResolvedValue(mockClient);
            const invalidBody = { ...mockBody, state: '' };

            await expect(
                service.authorize(
                    'client-123',
                    invalidBody,
                    mockUser,
                    mockReq,
                    mockRes,
                ),
            ).rejects.toThrow('Invalid state');
        });

        it('should throw error for invalid grant type', async () => {
            const clientWithoutGrant = {
                ...mockClient,
                allowedGrantTypes: ['implicit'],
            };
            vi.mocked(Repository.findBy).mockResolvedValue(clientWithoutGrant);

            await expect(
                service.authorize(
                    'client-123',
                    mockBody,
                    mockUser,
                    mockReq,
                    mockRes,
                ),
            ).rejects.toThrow('Invalid grant type');
        });

        it('should generate authorization code successfully', async () => {
            vi.mocked(Repository.findBy).mockResolvedValue(mockClient);
            vi.mocked(Repository.insert).mockResolvedValue({ success: true });

            const result = await service.authorize(
                'client-123',
                mockBody,
                mockUser,
                mockReq,
                mockRes,
            );

            expect(result).toHaveProperty('code');
            expect(result).toHaveProperty('state', 'abc123');
            expect(result).toHaveProperty('response_type', 'code');
        });

        it('should throw error on failed code generation', async () => {
            vi.mocked(Repository.findBy).mockResolvedValue(mockClient);
            vi.mocked(Repository.insert).mockResolvedValueOnce({
                success: false,
            });

            await expect(
                service.authorize(
                    'client-123',
                    mockBody,
                    mockUser,
                    mockReq,
                    mockRes,
                ),
            ).rejects.toThrow('Failed to generate the code');
        });

        it('should handle implicit flow', async () => {
            const implicitClient = {
                ...mockClient,
                allowedGrantTypes: ['implicit', 'authorization_code'],
            };
            vi.mocked(Repository.findBy).mockResolvedValue(implicitClient);

            const implicitBody = { ...mockBody, response_type: 'token' };
            const result = await service.authorize(
                'client-123',
                implicitBody,
                mockUser,
                mockReq,
                mockRes,
            );

            expect(result).toHaveProperty('token');
            expect(result).toHaveProperty('refreshToken');
        });

        it('should throw error for invalid response type', async () => {
            vi.mocked(Repository.findBy).mockResolvedValue(mockClient);
            const invalidBody = { ...mockBody, response_type: 'invalid' };

            await expect(
                service.authorize(
                    'client-123',
                    invalidBody,
                    mockUser,
                    mockReq,
                    mockRes,
                ),
            ).rejects.toThrow('Invalid response type');
        });
    });

    describe('handler', () => {
        const mockPayload = {
            code: 'auth-code-123',
            state: 'abc123',
            client_secret: 'secret-123',
        };

        it('should throw error when code is missing', async () => {
            const payload = { ...mockPayload, code: '' };

            await expect(
                service.handler(payload as any, mockReq, mockRes),
            ).rejects.toThrow('Code is required');
        });

        it('should throw error when state is missing', async () => {
            const payload = { ...mockPayload, state: '' };

            await expect(
                service.handler(payload as any, mockReq, mockRes),
            ).rejects.toThrow('State is required');
        });

        it('should throw error when client_secret is missing', async () => {
            const payload = { ...mockPayload, client_secret: '' };

            await expect(
                service.handler(payload as any, mockReq, mockRes),
            ).rejects.toThrow('Client secret is required');
        });

        it('should throw error when code not found', async () => {
            vi.mocked(Repository.findBy).mockResolvedValue(null);

            await expect(
                service.handler(mockPayload as any, mockReq, mockRes),
            ).rejects.toThrow('Invalid code');
        });

        it('should throw error when code expired', async () => {
            vi.mocked(Repository.findBy).mockResolvedValue({
                code: 'auth-code-123',
                expiresAt: Date.now() - 1000, // Expired
            });

            await expect(
                service.handler(mockPayload as any, mockReq, mockRes),
            ).rejects.toThrow('Code expired');
        });
    });

    describe('createClient', () => {
        it('should create a new OAuth client', async () => {
            vi.mocked(Repository.insert).mockResolvedValue({ success: true });

            const newClient = {
                clientName: 'Test App',
                redirectUris: ['http://localhost/callback'],
                allowedScopes: ['read', 'write'],
                isActive: true,
                accessTokenLifetime: 3600,
                refreshTokenLifetime: 86400,
                authorizedDomains: ['localhost'],
                allowedGrantTypes: ['authorization_code'],
            };

            const result = await service.createClient(newClient);

            expect(result).toContain('Client created successfully');
            expect(Repository.insert).toHaveBeenCalled();
        });
    });

    describe('getClient', () => {
        it('should throw error when client not found', async () => {
            vi.mocked(Repository.findBy).mockResolvedValue(null);

            await expect(service.getClient('non-existent')).rejects.toThrow(
                'Client not found',
            );
        });

        it('should return client when found', async () => {
            const mockClient = {
                clientId: 'client-123',
                clientName: 'Test App',
                redirectUris: ['http://localhost/callback'],
            };
            vi.mocked(Repository.findBy).mockResolvedValue(mockClient);

            const result = await service.getClient('client-123');

            expect(result).toEqual(mockClient);
        });
    });

    describe('getClientAdmin', () => {
        it('should throw error when client not found', async () => {
            vi.mocked(Repository.findBy).mockResolvedValue(null);

            await expect(
                service.getClientAdmin('non-existent'),
            ).rejects.toThrow('Client not found');
        });

        it('should return full client data for admin', async () => {
            const mockClient = {
                clientId: 'client-123',
                clientSecret: 'secret-123',
                clientName: 'Test App',
            };
            vi.mocked(Repository.findBy).mockResolvedValue(mockClient);

            const result = await service.getClientAdmin('client-123');

            expect(result).toEqual(mockClient);
        });
    });

    describe('getClients', () => {
        it('should return all clients', async () => {
            const mockClients = {
                data: [
                    { clientId: 'client-1', clientName: 'App 1' },
                    { clientId: 'client-2', clientName: 'App 2' },
                ],
                count: 2,
            };
            vi.mocked(Repository.findAll).mockResolvedValue(mockClients);

            const result = await service.getClients();

            expect(result).toEqual(mockClients);
        });
    });

    describe('updateClient', () => {
        it('should throw error when client not found', async () => {
            vi.mocked(Repository.findBy).mockResolvedValue(null);

            await expect(
                service.updateClient('non-existent', {} as any),
            ).rejects.toThrow('Client not found');
        });

        it('should update client successfully', async () => {
            vi.mocked(Repository.findBy).mockResolvedValue({
                clientId: 'client-123',
            });
            vi.mocked(Repository.updateOne).mockResolvedValue(true);

            const updateData = {
                clientName: 'Updated App',
                redirectUris: ['http://new-url.com/callback'],
                allowedScopes: ['read'],
                authorizedDomains: [],
                allowedGrantTypes: ['authorization_code'],
                isActive: true,
                accessTokenLifetime: 7200,
                refreshTokenLifetime: 172800,
            };

            const result = await service.updateClient('client-123', updateData);

            expect(result).toContain('Client updated successfully');
            expect(Repository.updateOne).toHaveBeenCalled();
        });
    });

    describe('deleteClient', () => {
        it('should delete client successfully', async () => {
            vi.mocked(Repository.delete).mockResolvedValue(true);

            const result = await service.deleteClient('client-123');

            expect(result).toContain('Client deleted successfully');
            expect(Repository.delete).toHaveBeenCalled();
        });
    });
});
