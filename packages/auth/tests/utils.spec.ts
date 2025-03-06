import { describe, it, expect, vi } from 'vitest';
import * as crypto from 'crypto';
import * as jwt from 'jsonwebtoken';
import { Config } from '@cmmv/core';

import {
    jwtVerify,
    encryptJWTData,
    decryptJWTData,
    generateFingerprint,
} from '../lib/auth.utils';

// Mock Config
vi.mock('@cmmv/core', () => ({
    Config: {
        get: vi.fn((key: string) => {
            if (key === 'auth.jwtSecret') return 'mockedSecret';
            return null;
        }),
    },
}));

// Mock JWT
vi.mock('jsonwebtoken', () => ({
    verify: vi.fn((token, secret, callback) => {
        if (token === 'validToken') {
            callback(null, { id: '123', username: 'testUser' });
        } else {
            callback(new Error('Invalid token'), null);
        }
    }),
}));

describe('auth.utils', () => {
    describe('jwtVerify', () => {
        it('should verify and decode a valid JWT token', async () => {
            const decoded = await jwtVerify('Bearer validToken');
            expect(decoded).toEqual({ id: '123', username: 'testUser' });
        });

        it('should throw an error for invalid JWT token', async () => {
            await expect(jwtVerify('Bearer invalidToken')).rejects.toThrow(
                'Invalid or expired token',
            );
        });

        it('should throw an error if JWT secret is not configured', async () => {
            vi.spyOn(Config, 'get').mockReturnValue(null);
            await expect(jwtVerify('Bearer validToken')).rejects.toThrow(
                'JWT secret is not configured',
            );
        });
    });

    describe('encryptJWTData & decryptJWTData', () => {
        const secret = 'testSecret';
        const text = 'helloWorld';

        it('should encrypt and decrypt data correctly', () => {
            const encrypted = encryptJWTData(text, secret);
            const decrypted = decryptJWTData(encrypted, secret);
            expect(decrypted).toBe(text);
        });

        it('should return an empty string if decryption fails', () => {
            const decrypted = decryptJWTData('invalidData', secret);
            expect(decrypted).toBe('');
        });
    });

    describe('generateFingerprint', () => {
        it('should generate a unique fingerprint based on request headers', () => {
            const mockReq = {
                headers: {
                    'user-agent': 'Mozilla/5.0',
                    accept: 'text/html',
                    'accept-language': 'en-US',
                    referer: 'https://example.com',
                },
                ip: '192.168.0.1',
            };
            const usernameHashed = 'hashedUsername';
            const fingerprint = generateFingerprint(mockReq, usernameHashed);

            expect(fingerprint).toBeDefined();
            expect(typeof fingerprint).toBe('string');
            expect(fingerprint.length).toBeGreaterThan(0);
        });

        it('should handle missing headers gracefully', () => {
            const mockReq = {
                headers: {},
                connection: { remoteAddress: '192.168.0.1' },
            };
            const usernameHashed = 'hashedUsername';
            const fingerprint = generateFingerprint(mockReq, usernameHashed);

            expect(fingerprint).toBeDefined();
            expect(typeof fingerprint).toBe('string');
            expect(fingerprint.length).toBeGreaterThan(0);
        });
    });
});
