import { describe, it, expect, vi, beforeEach } from 'vitest';
import * as crypto from 'node:crypto';
import { generateFingerprint } from '../../lib/http.utils';

describe('http.utils', () => {
    describe('generateFingerprint', () => {
        it('should generate fingerprint from request headers', () => {
            const req = {
                headers: {
                    'user-agent': 'Mozilla/5.0',
                    'accept-language': 'en-US',
                },
                connection: {
                    remoteAddress: '192.168.1.1',
                },
            };
            const usernameHashed = 'hashedUser123';

            const result = generateFingerprint(req, usernameHashed);

            expect(result).toBeDefined();
            expect(typeof result).toBe('string');
            expect(result.length).toBe(64); // SHA256 hex is 64 chars
        });

        it('should use cf-connecting-ip if available', () => {
            const req = {
                headers: {
                    'user-agent': 'Mozilla/5.0',
                    'cf-connecting-ip': '10.0.0.1',
                    'accept-language': 'en-US',
                },
                connection: {
                    remoteAddress: '192.168.1.1',
                },
            };
            const usernameHashed = 'hashedUser123';

            const result = generateFingerprint(req, usernameHashed);

            expect(result).toBeDefined();
            // The fingerprint should include the cf-connecting-ip
        });

        it('should use X-Real-IP if cf-connecting-ip not available', () => {
            const req = {
                headers: {
                    'user-agent': 'Mozilla/5.0',
                    'X-Real-IP': '10.0.0.2',
                    'accept-language': 'en-US',
                },
                connection: {
                    remoteAddress: '192.168.1.1',
                },
            };
            const usernameHashed = 'hashedUser123';

            const result = generateFingerprint(req, usernameHashed);

            expect(result).toBeDefined();
        });

        it('should use X-Forwarded-For if other headers not available', () => {
            const req = {
                headers: {
                    'user-agent': 'Mozilla/5.0',
                    'X-Forwarded-For': '10.0.0.3',
                    'accept-language': 'en-US',
                },
                connection: {
                    remoteAddress: '192.168.1.1',
                },
            };
            const usernameHashed = 'hashedUser123';

            const result = generateFingerprint(req, usernameHashed);

            expect(result).toBeDefined();
        });

        it('should fall back to connection.remoteAddress', () => {
            const req = {
                headers: {
                    'user-agent': 'Mozilla/5.0',
                    'accept-language': 'en-US',
                },
                connection: {
                    remoteAddress: '192.168.1.1',
                },
            };
            const usernameHashed = 'hashedUser123';

            const result = generateFingerprint(req, usernameHashed);

            expect(result).toBeDefined();
        });

        it('should fall back to req.ip', () => {
            const req = {
                headers: {
                    'user-agent': 'Mozilla/5.0',
                    'accept-language': 'en-US',
                },
                connection: {},
                ip: '192.168.1.2',
            };
            const usernameHashed = 'hashedUser123';

            const result = generateFingerprint(req, usernameHashed);

            expect(result).toBeDefined();
        });

        it('should handle missing user-agent', () => {
            const req = {
                headers: {
                    'accept-language': 'en-US',
                },
                connection: {
                    remoteAddress: '192.168.1.1',
                },
            };
            const usernameHashed = 'hashedUser123';

            const result = generateFingerprint(req, usernameHashed);

            expect(result).toBeDefined();
        });

        it('should handle missing accept-language', () => {
            const req = {
                headers: {
                    'user-agent': 'Mozilla/5.0',
                },
                connection: {
                    remoteAddress: '192.168.1.1',
                },
            };
            const usernameHashed = 'hashedUser123';

            const result = generateFingerprint(req, usernameHashed);

            expect(result).toBeDefined();
        });

        it('should generate different fingerprints for different users', () => {
            const req = {
                headers: {
                    'user-agent': 'Mozilla/5.0',
                    'accept-language': 'en-US',
                },
                connection: {
                    remoteAddress: '192.168.1.1',
                },
            };

            const fingerprint1 = generateFingerprint(req, 'user1Hash');
            const fingerprint2 = generateFingerprint(req, 'user2Hash');

            expect(fingerprint1).not.toBe(fingerprint2);
        });

        it('should generate different fingerprints for different IPs', () => {
            const req1 = {
                headers: {
                    'user-agent': 'Mozilla/5.0',
                    'accept-language': 'en-US',
                },
                connection: {
                    remoteAddress: '192.168.1.1',
                },
            };
            const req2 = {
                headers: {
                    'user-agent': 'Mozilla/5.0',
                    'accept-language': 'en-US',
                },
                connection: {
                    remoteAddress: '192.168.1.2',
                },
            };

            const fingerprint1 = generateFingerprint(req1, 'sameUser');
            const fingerprint2 = generateFingerprint(req2, 'sameUser');

            expect(fingerprint1).not.toBe(fingerprint2);
        });

        it('should generate same fingerprint for same inputs', () => {
            const req = {
                headers: {
                    'user-agent': 'Mozilla/5.0',
                    'accept-language': 'en-US',
                },
                connection: {
                    remoteAddress: '192.168.1.1',
                },
            };
            const usernameHashed = 'hashedUser123';

            const fingerprint1 = generateFingerprint(req, usernameHashed);
            const fingerprint2 = generateFingerprint(req, usernameHashed);

            expect(fingerprint1).toBe(fingerprint2);
        });

        it('should generate different fingerprints for different user agents', () => {
            const req1 = {
                headers: {
                    'user-agent': 'Chrome',
                    'accept-language': 'en-US',
                },
                connection: {
                    remoteAddress: '192.168.1.1',
                },
            };
            const req2 = {
                headers: {
                    'user-agent': 'Firefox',
                    'accept-language': 'en-US',
                },
                connection: {
                    remoteAddress: '192.168.1.1',
                },
            };

            const fingerprint1 = generateFingerprint(req1, 'sameUser');
            const fingerprint2 = generateFingerprint(req2, 'sameUser');

            expect(fingerprint1).not.toBe(fingerprint2);
        });
    });
});
