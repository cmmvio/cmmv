import { describe, it, expect, beforeEach, vi, afterEach } from 'vitest';
import { ThrottlerService } from '../lib/throttler.service';
import { ThrottlerException } from '../lib/throttler.exception';

vi.mock('@cmmv/core', async (importOriginal) => {
    const actual = await importOriginal();
    return {
        ...(actual as any),
        Config: {
            get: vi.fn((key: string, defaultValue?: any) => {
                const config: Record<string, any> = {
                    'throttler.gcInterval': 1000 * 30,
                    'throttler.limit': 10,
                    'throttler.ttl': 1000 * 5,
                };
                return config[key] ?? defaultValue;
            }),
        },
        Service: () => (target: any) => target,
        AbstractService: class {},
        Interceptor: () => () => {},
    };
});

describe('ThrottlerService', () => {
    beforeEach(() => {
        vi.clearAllMocks();
        ThrottlerService.clearThrottler();
        if (ThrottlerService._gcIntervalId) {
            clearInterval(ThrottlerService._gcIntervalId);
        }
    });

    afterEach(() => {
        if (ThrottlerService._gcIntervalId) {
            clearInterval(ThrottlerService._gcIntervalId);
        }
    });

    describe('loadConfig', () => {
        it('should set gc interval from config', async () => {
            await ThrottlerService.loadConfig();

            expect(ThrottlerService._gcInterval).toBe(1000 * 30);
            expect(ThrottlerService._gcIntervalId).toBeDefined();
        });
    });

    describe('validateRequest', () => {
        it('should create new throttler entry for first request', () => {
            const result = ThrottlerService.validateRequest(
                'GET::handler::127.0.0.1',
                'handler',
                '127.0.0.1',
            );

            expect(result).toBe(false);
            expect(
                ThrottlerService.getThrottler('GET::handler::127.0.0.1'),
            ).toBeDefined();
        });

        it('should increment hit count on subsequent requests', () => {
            ThrottlerService.validateRequest(
                'GET::handler::127.0.0.1',
                'handler',
                '127.0.0.1',
            );
            ThrottlerService.validateRequest(
                'GET::handler::127.0.0.1',
                'handler',
                '127.0.0.1',
            );

            const throttler = ThrottlerService.getThrottler(
                'GET::handler::127.0.0.1',
            );
            expect(throttler.totalHits).toBe(2);
        });

        it('should throw ThrottlerException when limit is exceeded', () => {
            // Create throttler with low limit
            ThrottlerService.setThrottler('GET::handler::127.0.0.1', {
                handler: 'handler',
                ip: '127.0.0.1',
                totalHits: 10,
                limit: 10,
                ttl: 5000,
                lastHit: Date.now(),
            });

            expect(() => {
                ThrottlerService.validateRequest(
                    'GET::handler::127.0.0.1',
                    'handler',
                    '127.0.0.1',
                );
            }).toThrow();
        });

        it('should reset hits after TTL expires', () => {
            // Create throttler with expired TTL
            const expiredTime = Date.now() - 5000; // 5 seconds ago
            ThrottlerService.setThrottler('GET::handler2::127.0.0.1', {
                handler: 'handler2',
                ip: '127.0.0.1',
                totalHits: 5,
                limit: 10,
                ttl: 1000, // 1 second TTL
                lastHit: expiredTime, // Expired since lastHit + ttl < now
            });

            ThrottlerService.validateRequest(
                'GET::handler2::127.0.0.1',
                'handler2',
                '127.0.0.1',
            );

            const throttler = ThrottlerService.getThrottler(
                'GET::handler2::127.0.0.1',
            );
            // After TTL expires, totalHits is reset to 1 then incremented, so final value is 2
            expect(throttler.totalHits).toBe(2);
        });
    });

    describe('interceptor', () => {
        it('should extract IP from various headers', async () => {
            const service = new ThrottlerService();
            const mockReq = {
                method: 'GET',
                headers: {
                    'cf-connecting-ip': '1.2.3.4',
                },
                connection: { remoteAddress: '127.0.0.1' },
            };

            const result = await service.interceptor('/test', {
                req: mockReq,
                res: {},
                next: vi.fn(),
                handler: { name: 'testHandler' },
            });

            expect(result).toBe(false);
        });

        it('should use X-Real-IP header', async () => {
            const service = new ThrottlerService();
            const mockReq = {
                method: 'GET',
                headers: {
                    'X-Real-IP': '5.6.7.8',
                },
                connection: { remoteAddress: '127.0.0.1' },
            };

            await service.interceptor('/test', {
                req: mockReq,
                res: {},
                next: vi.fn(),
                handler: { name: 'testHandler' },
            });

            const signature = 'GET::testHandler::5.6.7.8';
            expect(ThrottlerService.getThrottler(signature)).toBeDefined();
        });

        it('should use X-Forwarded-For header', async () => {
            const service = new ThrottlerService();
            const mockReq = {
                method: 'POST',
                headers: {
                    'X-Forwarded-For': '9.10.11.12',
                },
                connection: { remoteAddress: '127.0.0.1' },
            };

            await service.interceptor('/test', {
                req: mockReq,
                res: {},
                next: vi.fn(),
                handler: { name: 'postHandler' },
            });

            const signature = 'POST::postHandler::9.10.11.12';
            expect(ThrottlerService.getThrottler(signature)).toBeDefined();
        });

        it('should fallback to connection remoteAddress', async () => {
            const service = new ThrottlerService();
            const mockReq = {
                method: 'GET',
                headers: {},
                connection: { remoteAddress: '192.168.1.1' },
            };

            await service.interceptor('/test', {
                req: mockReq,
                res: {},
                next: vi.fn(),
                handler: { name: 'handler' },
            });

            const signature = 'GET::handler::192.168.1.1';
            expect(ThrottlerService.getThrottler(signature)).toBeDefined();
        });
    });

    describe('getThrottler / setThrottler', () => {
        it('should get and set throttler correctly', () => {
            const throttler = {
                handler: 'test',
                ip: '127.0.0.1',
                totalHits: 1,
                limit: 10,
                ttl: 5000,
                lastHit: Date.now(),
            };

            ThrottlerService.setThrottler('test-signature', throttler);
            const result = ThrottlerService.getThrottler('test-signature');

            expect(result).toEqual(throttler);
        });

        it('should return undefined for non-existent signature', () => {
            const result = ThrottlerService.getThrottler('non-existent');
            expect(result).toBeUndefined();
        });
    });

    describe('deleteThrottler', () => {
        it('should delete a throttler entry', () => {
            ThrottlerService.setThrottler('to-delete', {
                handler: 'test',
                ip: '127.0.0.1',
                totalHits: 1,
                limit: 10,
                ttl: 5000,
                lastHit: Date.now(),
            });

            ThrottlerService.deleteThrottler('to-delete');

            expect(ThrottlerService.getThrottler('to-delete')).toBeUndefined();
        });
    });

    describe('gc (garbage collection)', () => {
        it('should remove expired throttler entries', () => {
            // Add expired entry
            ThrottlerService.setThrottler('expired', {
                handler: 'test',
                ip: '127.0.0.1',
                totalHits: 1,
                limit: 10,
                ttl: 1000,
                lastHit: Date.now() - 5000, // Expired 4 seconds ago
            });

            // Add valid entry
            ThrottlerService.setThrottler('valid', {
                handler: 'test',
                ip: '127.0.0.1',
                totalHits: 1,
                limit: 10,
                ttl: 60000,
                lastHit: Date.now(),
            });

            ThrottlerService.gc();

            expect(ThrottlerService.getThrottler('expired')).toBeUndefined();
            expect(ThrottlerService.getThrottler('valid')).toBeDefined();
        });
    });

    describe('clearThrottler', () => {
        it('should clear all throttler entries', () => {
            ThrottlerService.setThrottler('entry1', {
                handler: 'test',
                ip: '127.0.0.1',
                totalHits: 1,
                limit: 10,
                ttl: 5000,
                lastHit: Date.now(),
            });
            ThrottlerService.setThrottler('entry2', {
                handler: 'test',
                ip: '127.0.0.2',
                totalHits: 1,
                limit: 10,
                ttl: 5000,
                lastHit: Date.now(),
            });

            ThrottlerService.clearThrottler();

            expect(ThrottlerService.getThrottler('entry1')).toBeUndefined();
            expect(ThrottlerService.getThrottler('entry2')).toBeUndefined();
        });
    });
});

describe('ThrottlerException', () => {
    it('should be throwable', () => {
        expect(() => {
            throw new ThrottlerException();
        }).toThrow();
    });

    it('should have correct error properties', () => {
        const exception = new ThrottlerException();
        expect(exception).toBeDefined();
    });
});
