"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const vitest_1 = require("vitest");
const core_1 = require("@cmmv/core");
const auth_utils_1 = require("../lib/auth.utils");
// Mock Config
vitest_1.vi.mock('@cmmv/core', () => ({
    Config: {
        get: vitest_1.vi.fn((key) => {
            if (key === 'auth.jwtSecret')
                return 'mockedSecret';
            return null;
        }),
    },
}));
// Mock JWT
vitest_1.vi.mock('jsonwebtoken', () => ({
    verify: vitest_1.vi.fn((token, secret, callback) => {
        if (token === 'validToken') {
            callback(null, { id: '123', username: 'testUser' });
        }
        else {
            callback(new Error('Invalid token'), null);
        }
    }),
}));
(0, vitest_1.describe)('auth.utils', () => {
    (0, vitest_1.describe)('jwtVerify', () => {
        (0, vitest_1.it)('should verify and decode a valid JWT token', async () => {
            const decoded = await (0, auth_utils_1.jwtVerify)('Bearer validToken');
            (0, vitest_1.expect)(decoded).toEqual({ id: '123', username: 'testUser' });
        });
        (0, vitest_1.it)('should throw an error for invalid JWT token', async () => {
            await (0, vitest_1.expect)((0, auth_utils_1.jwtVerify)('Bearer invalidToken')).rejects.toThrow('Invalid or expired token');
        });
        (0, vitest_1.it)('should throw an error if JWT secret is not configured', async () => {
            vitest_1.vi.spyOn(core_1.Config, 'get').mockReturnValue(null);
            await (0, vitest_1.expect)((0, auth_utils_1.jwtVerify)('Bearer validToken')).rejects.toThrow('JWT secret is not configured');
        });
    });
    (0, vitest_1.describe)('encryptJWTData & decryptJWTData', () => {
        const secret = 'testSecret';
        const text = 'helloWorld';
        (0, vitest_1.it)('should encrypt and decrypt data correctly', () => {
            const encrypted = (0, auth_utils_1.encryptJWTData)(text, secret);
            const decrypted = (0, auth_utils_1.decryptJWTData)(encrypted, secret);
            (0, vitest_1.expect)(decrypted).toBe(text);
        });
        (0, vitest_1.it)('should return an empty string if decryption fails', () => {
            const decrypted = (0, auth_utils_1.decryptJWTData)('invalidData', secret);
            (0, vitest_1.expect)(decrypted).toBe('');
        });
    });
    (0, vitest_1.describe)('generateFingerprint', () => {
        (0, vitest_1.it)('should generate a unique fingerprint based on request headers', () => {
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
            const fingerprint = (0, auth_utils_1.generateFingerprint)(mockReq, usernameHashed);
            (0, vitest_1.expect)(fingerprint).toBeDefined();
            (0, vitest_1.expect)(typeof fingerprint).toBe('string');
            (0, vitest_1.expect)(fingerprint.length).toBeGreaterThan(0);
        });
        (0, vitest_1.it)('should handle missing headers gracefully', () => {
            const mockReq = {
                headers: {},
                connection: { remoteAddress: '192.168.0.1' },
            };
            const usernameHashed = 'hashedUsername';
            const fingerprint = (0, auth_utils_1.generateFingerprint)(mockReq, usernameHashed);
            (0, vitest_1.expect)(fingerprint).toBeDefined();
            (0, vitest_1.expect)(typeof fingerprint).toBe('string');
            (0, vitest_1.expect)(fingerprint.length).toBeGreaterThan(0);
        });
    });
});
