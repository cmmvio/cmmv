import { describe, it, expect, beforeEach, vi, afterEach } from 'vitest';

vi.mock('uuid', () => ({
    v5: vi.fn().mockImplementation((name, namespace) => `${name}-hashed`),
    v4: vi.fn().mockReturnValue('test-uuid-1234'),
}));

vi.mock('elliptic', () => ({
    ec: vi.fn().mockImplementation(() => ({
        genKeyPair: vi.fn().mockReturnValue({
            getPrivate: vi
                .fn()
                .mockReturnValue(
                    'test-private-key-64chars-padded-to-64-characters-here-ok',
                ),
            getPublic: vi
                .fn()
                .mockReturnValue(
                    'test-public-key-130chars-padded-to-130-characters-here-for-uncompressed-public-key-format-ok',
                ),
        }),
    })),
}));

vi.mock('@cmmv/core', async (importOriginal) => {
    const actual = await importOriginal();
    return {
        ...(actual as any),
        Config: {
            get: vi.fn(),
        },
        Service: () => (target: any) => target,
        AbstractService: class {},
        isJSON: vi.fn().mockImplementation((str: string) => {
            try {
                JSON.parse(str);
                return true;
            } catch {
                return false;
            }
        }),
    };
});

vi.mock('@cmmv/repository', () => ({
    Repository: {
        getEntity: vi.fn(),
        insert: vi.fn(),
        findBy: vi.fn(),
        delete: vi.fn(),
    },
}));

vi.mock('@cmmv/encryptor', () => ({
    Encryptor: {
        encryptPayload: vi.fn().mockReturnValue({
            payload: 'encrypted-payload',
            iv: 'test-iv',
            authTag: 'test-auth-tag',
            ephemeralPublicKey: 'test-ephemeral-key',
        }),
        decryptPayload: vi.fn().mockReturnValue('decrypted-payload'),
    },
}));

vi.mock('@cmmv/http', () => ({
    HttpException: class HttpException extends Error {
        constructor(
            public message: string,
            public status: number,
        ) {
            super(message);
        }
    },
    HttpStatus: {
        FORBIDDEN: 403,
        NOT_FOUND: 404,
    },
}));

import { VaultService } from '../lib/vault.service';
import { Config, isJSON } from '@cmmv/core';
import { Repository } from '@cmmv/repository';
import { Encryptor } from '@cmmv/encryptor';
import { HttpException, HttpStatus } from '@cmmv/http';

describe('VaultService', () => {
    let service: VaultService;

    beforeEach(() => {
        vi.clearAllMocks();
        service = new VaultService();
    });

    describe('createKeys', () => {
        it('should generate new key pair with namespace', async () => {
            const result = await service.createKeys();

            expect(result).toHaveProperty('namespace');
            expect(result).toHaveProperty('privateKey');
            expect(result).toHaveProperty('publicKey');
            expect(result.namespace).toBe('test-uuid-1234');
        });

        it('should return hex formatted keys', async () => {
            const result = await service.createKeys();

            expect(typeof result.privateKey).toBe('string');
            expect(typeof result.publicKey).toBe('string');
        });
    });

    describe('insert', () => {
        beforeEach(() => {
            vi.mocked(Config.get).mockImplementation((key: string) => {
                if (key === 'vault.namespace') return 'test-namespace';
                if (key === 'vault.publicKey') return 'a'.repeat(130);
                return undefined;
            });
            vi.mocked(Repository.getEntity).mockReturnValue({} as any);
            vi.mocked(Repository.insert).mockResolvedValue({
                id: 'new-id',
            } as any);
        });

        it('should insert string payload', async () => {
            const result = await service.insert('test-key', 'test-value');

            expect(Repository.insert).toHaveBeenCalled();
            expect(Encryptor.encryptPayload).toHaveBeenCalledWith(
                'a'.repeat(130),
                'test-value',
            );
            expect(result).toEqual({ id: 'new-id' });
        });

        it('should insert object payload as JSON', async () => {
            const payload = { foo: 'bar' };

            await service.insert('test-key', payload);

            expect(Encryptor.encryptPayload).toHaveBeenCalledWith(
                'a'.repeat(130),
                JSON.stringify(payload),
            );
        });

        it('should throw error for invalid public key (wrong length)', async () => {
            vi.mocked(Config.get).mockImplementation((key: string) => {
                if (key === 'vault.namespace') return 'test-namespace';
                if (key === 'vault.publicKey') return 'short-key';
                return undefined;
            });

            await expect(service.insert('key', 'value')).rejects.toThrow(
                'Invalid public key format',
            );
        });

        it('should throw error for missing public key', async () => {
            vi.mocked(Config.get).mockImplementation((key: string) => {
                if (key === 'vault.namespace') return 'test-namespace';
                if (key === 'vault.publicKey') return undefined;
                return undefined;
            });

            await expect(service.insert('key', 'value')).rejects.toThrow(
                'Invalid public key format',
            );
        });

        it('should accept 66-character compressed public key', async () => {
            vi.mocked(Config.get).mockImplementation((key: string) => {
                if (key === 'vault.namespace') return 'test-namespace';
                if (key === 'vault.publicKey') return 'a'.repeat(66);
                return undefined;
            });

            const result = await service.insert('key', 'value');

            expect(result).toEqual({ id: 'new-id' });
        });

        it('should use uuidv5 to hash the key', async () => {
            const { v5 } = await import('uuid');

            await service.insert('my-secret-key', 'secret-value');

            expect(v5).toHaveBeenCalledWith('my-secret-key', 'test-namespace');
        });

        it('should store encrypted data with correct fields', async () => {
            await service.insert('test-key', 'test-value');

            expect(Repository.insert).toHaveBeenCalledWith(
                expect.anything(),
                expect.objectContaining({
                    key: 'test-key-hashed',
                    payload: 'encrypted-payload',
                    iv: 'test-iv',
                    tag: 'test-auth-tag',
                    ephemeral: 'test-ephemeral-key',
                }),
            );
        });
    });

    describe('get', () => {
        beforeEach(() => {
            vi.mocked(Config.get).mockImplementation((key: string) => {
                if (key === 'vault.namespace') return 'test-namespace';
                if (key === 'vault.privateKey') return 'a'.repeat(64);
                return undefined;
            });
            vi.mocked(Repository.getEntity).mockReturnValue({} as any);
        });

        it('should get and decrypt a stored value', async () => {
            vi.mocked(Repository.findBy).mockResolvedValue({
                payload: 'encrypted',
                iv: 'iv',
                tag: 'tag',
                ephemeral: 'ephemeral',
            } as any);
            vi.mocked(Encryptor.decryptPayload).mockReturnValue(
                'decrypted-string',
            );
            vi.mocked(isJSON).mockReturnValue(false);

            const result = await service.get('test-key');

            expect(result).toBe('decrypted-string');
            expect(Encryptor.decryptPayload).toHaveBeenCalledWith(
                'a'.repeat(64),
                {
                    encrypted: 'encrypted',
                    iv: 'iv',
                    authTag: 'tag',
                },
                'ephemeral',
            );
        });

        it('should parse JSON payload if valid JSON', async () => {
            vi.mocked(Repository.findBy).mockResolvedValue({
                payload: 'encrypted',
                iv: 'iv',
                tag: 'tag',
                ephemeral: 'ephemeral',
            } as any);
            vi.mocked(Encryptor.decryptPayload).mockReturnValue(
                '{"foo":"bar"}',
            );
            vi.mocked(isJSON).mockReturnValue(true);

            const result = await service.get('test-key');

            expect(result).toEqual({ foo: 'bar' });
        });

        it('should throw error for invalid private key (wrong length)', async () => {
            vi.mocked(Config.get).mockImplementation((key: string) => {
                if (key === 'vault.namespace') return 'test-namespace';
                if (key === 'vault.privateKey') return 'short-key';
                return undefined;
            });

            await expect(service.get('key')).rejects.toThrow(
                'Invalid private key format',
            );
        });

        it('should throw error for missing private key', async () => {
            vi.mocked(Config.get).mockImplementation((key: string) => {
                if (key === 'vault.namespace') return 'test-namespace';
                if (key === 'vault.privateKey') return undefined;
                return undefined;
            });

            await expect(service.get('key')).rejects.toThrow(
                'Invalid private key format',
            );
        });

        it('should throw error if key does not exist', async () => {
            vi.mocked(Repository.findBy).mockResolvedValue(null as any);

            await expect(service.get('non-existent')).rejects.toThrow(
                "Key 'non-existent' not exists",
            );
        });
    });

    describe('remove', () => {
        beforeEach(() => {
            vi.mocked(Config.get).mockImplementation((key: string) => {
                if (key === 'vault.namespace') return 'test-namespace';
                return undefined;
            });
            vi.mocked(Repository.getEntity).mockReturnValue({} as any);
        });

        it('should delete a key and return success', async () => {
            vi.mocked(Repository.delete).mockResolvedValue(1);

            const result = await service.remove('test-key');

            expect(result).toEqual({ success: true });
            expect(Repository.delete).toHaveBeenCalledWith(expect.anything(), {
                key: 'test-key-hashed',
            });
        });

        it('should throw error if key does not exist (0 affected)', async () => {
            vi.mocked(Repository.delete).mockResolvedValue(0);

            await expect(service.remove('non-existent')).rejects.toThrow(
                "Key 'non-existent' not exists",
            );
        });

        it('should throw error if delete affects negative rows', async () => {
            vi.mocked(Repository.delete).mockResolvedValue(-1);

            await expect(service.remove('key')).rejects.toThrow();
        });
    });
});

describe('VaultService edge cases', () => {
    let service: VaultService;

    beforeEach(() => {
        vi.clearAllMocks();
        service = new VaultService();
    });

    it('should handle empty string payload', async () => {
        vi.mocked(Config.get).mockImplementation((key: string) => {
            if (key === 'vault.namespace') return 'test-namespace';
            if (key === 'vault.publicKey') return 'a'.repeat(130);
            return undefined;
        });
        vi.mocked(Repository.getEntity).mockReturnValue({} as any);
        vi.mocked(Repository.insert).mockResolvedValue({ id: 'new-id' } as any);

        const result = await service.insert('key', '');

        expect(Encryptor.encryptPayload).toHaveBeenCalledWith(
            'a'.repeat(130),
            '',
        );
        expect(result).toEqual({ id: 'new-id' });
    });

    it('should handle complex nested objects', async () => {
        vi.mocked(Config.get).mockImplementation((key: string) => {
            if (key === 'vault.namespace') return 'test-namespace';
            if (key === 'vault.publicKey') return 'a'.repeat(130);
            return undefined;
        });
        vi.mocked(Repository.getEntity).mockReturnValue({} as any);
        vi.mocked(Repository.insert).mockResolvedValue({ id: 'new-id' } as any);

        const complexPayload = {
            nested: {
                deeply: {
                    value: [1, 2, { three: 'four' }],
                },
            },
        };

        await service.insert('key', complexPayload);

        expect(Encryptor.encryptPayload).toHaveBeenCalledWith(
            'a'.repeat(130),
            JSON.stringify(complexPayload),
        );
    });

    it('should handle special characters in key names', async () => {
        vi.mocked(Config.get).mockImplementation((key: string) => {
            if (key === 'vault.namespace') return 'test-namespace';
            if (key === 'vault.publicKey') return 'a'.repeat(130);
            return undefined;
        });
        vi.mocked(Repository.getEntity).mockReturnValue({} as any);
        vi.mocked(Repository.insert).mockResolvedValue({ id: 'new-id' } as any);

        await service.insert('key/with:special@chars', 'value');

        expect(Repository.insert).toHaveBeenCalledWith(
            expect.anything(),
            expect.objectContaining({
                key: 'key/with:special@chars-hashed',
            }),
        );
    });

    it('should use VaultEntity from repository', async () => {
        const mockEntity = { name: 'VaultEntity' };
        vi.mocked(Repository.getEntity).mockReturnValue(mockEntity as any);
        vi.mocked(Config.get).mockImplementation((key: string) => {
            if (key === 'vault.namespace') return 'test-namespace';
            if (key === 'vault.publicKey') return 'a'.repeat(130);
            return undefined;
        });
        vi.mocked(Repository.insert).mockResolvedValue({ id: 'id' } as any);

        await service.insert('key', 'value');

        expect(Repository.getEntity).toHaveBeenCalledWith('VaultEntity');
        expect(Repository.insert).toHaveBeenCalledWith(
            mockEntity,
            expect.anything(),
        );
    });
});
