import { describe, it, expect, beforeEach, vi } from 'vitest';
import { AuthAutorizationService } from '../services/autorization.service';
import { Repository } from '@cmmv/repository';
import { Application } from '@cmmv/core';
import { HttpException, HttpStatus } from '@cmmv/http';

vi.mock('@cmmv/repository', async (importOriginal) => {
    const actual = await importOriginal<typeof import('@cmmv/repository')>();
    return {
        ...actual,
        Repository: {
            ...actual.Repository,
            findBy: vi.fn(),
            findOne: vi.fn().mockResolvedValue(null),
            insert: vi.fn(),
            getEntity: vi.fn().mockReturnValue({}),
        },
    };
});
vi.mock('@cmmv/core', async (importOriginal) => {
    const actual = await importOriginal<typeof import('@cmmv/core')>();
    return {
        ...actual,
        Application: {
            ...actual.Application,
            getModel: vi.fn(),
        },
        Config: {
            ...actual.Config,
            get: vi.fn().mockImplementation((key: string, defaultValue?: any) => {
                const config: Record<string, any> = {
                    'env': 'test',
                };
                return config[key] ?? defaultValue;
            }),
        },
    };
});

describe('AuthAutorizationService - User Registration', () => {
    let authService: AuthAutorizationService;

    beforeEach(() => {
        authService = new AuthAutorizationService(
            {} as any, // Mock das dependências
            {} as any,
            {} as any,
        );
    });

    it('should register a new user successfully', async () => {
        const mockUser = { username: 'testUser', password: 'hashedPassword' };
        vi.spyOn(Application, 'getModel').mockReturnValue({
            fromPartial: () => mockUser,
        } as any);

        vi.spyOn(authService, 'validate').mockResolvedValue(mockUser);
        vi.spyOn(Repository, 'insert').mockResolvedValue({ success: true });

        const result = await authService.register({
            username: 'testUser',
            password: 'testPass',
        });

        expect(result).toEqual({
            message: 'User registered successfully!',
        });
    });

    it('should throw an error if user validation fails', async () => {
        vi.spyOn(authService, 'validate').mockRejectedValue(
            new Error('Validation failed'),
        );

        await expect(
            authService.register({
                username: 'testUser',
                password: 'testPass',
            }),
        ).rejects.toThrow('Validation failed');
    });

    it('should throw an error if repository insert fails', async () => {
        const mockUser = { username: 'testUser', password: 'hashedPassword' };
        vi.spyOn(Application, 'getModel').mockReturnValue({
            fromPartial: () => mockUser,
        } as any);

        vi.spyOn(authService, 'validate').mockResolvedValue(mockUser);
        vi.spyOn(Repository, 'insert').mockResolvedValue({ success: false });

        await expect(
            authService.register({
                username: 'testUser',
                password: 'testPass',
            }),
        ).rejects.toThrow(HttpException);
    });
});
