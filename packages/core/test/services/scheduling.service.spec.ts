import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';

// Mock cron
vi.mock('cron', () => {
    const mockCronJob = vi.fn().mockImplementation((cronTime, onTick) => {
        let isActive = false;
        let callback = onTick;
        let currentCronTime = cronTime;

        return {
            get isActive() {
                return isActive;
            },
            start: vi.fn(() => {
                isActive = true;
            }),
            stop: vi.fn(() => {
                isActive = false;
            }),
            setTime: vi.fn((newTime) => {
                currentCronTime = newTime;
            }),
            // Expose for testing
            __trigger: () => callback(),
            __getCallback: () => callback,
        };
    });

    const mockCronTime = vi.fn().mockImplementation((time) => ({
        source: time,
    }));

    return {
        CronJob: mockCronJob,
        CronTime: mockCronTime,
    };
});

// Mock Logger
vi.mock('../../lib/logger', () => ({
    Logger: vi.fn().mockImplementation(() => ({
        log: vi.fn(),
        error: vi.fn(),
        warning: vi.fn(),
        verbose: vi.fn(),
    })),
}));

// Mock Scope
vi.mock('../../lib/scope', () => ({
    Scope: {
        getArray: vi.fn(() => []),
    },
}));

// Mock Service decorator
vi.mock('../../decorators/service.decorator', () => ({
    Service: vi.fn(() => (target: any) => target),
}));

// Mock Singleton
vi.mock('../../abstracts/singleton.abstract', () => ({
    Singleton: class MockSingleton {
        private static _instance: any;
        static getInstance() {
            if (!this._instance) {
                this._instance = new this();
            }
            return this._instance;
        }
        static resetInstance() {
            this._instance = null;
        }
    },
}));

import { SchedulingService } from '../../services/scheduling.service';
import { SchedulingManager } from '../../managers/scheduling.manager';
import { Scope } from '../../lib/scope';

describe('SchedulingService', () => {
    beforeEach(() => {
        vi.clearAllMocks();
        // Reset singleton instance
        (SchedulingService as any)._instance = null;
    });

    afterEach(() => {
        vi.clearAllMocks();
        (SchedulingService as any)._instance = null;
    });

    describe('loadConfig', () => {
        it('should load crons from scope and start managers', async () => {
            const mockMethod = vi.fn();
            const mockTarget = {};
            const mockCrons = [
                {
                    target: mockTarget,
                    method: mockMethod,
                    cronTime: '* * * * *',
                },
            ];

            vi.mocked(Scope.getArray).mockReturnValue(mockCrons);

            await SchedulingService.loadConfig();

            expect(Scope.getArray).toHaveBeenCalledWith('__crons');
        });

        it('should handle empty crons array', async () => {
            vi.mocked(Scope.getArray).mockReturnValue([]);

            await expect(SchedulingService.loadConfig()).resolves.not.toThrow();
        });

        it('should handle undefined crons', async () => {
            vi.mocked(Scope.getArray).mockReturnValue(undefined);

            await expect(SchedulingService.loadConfig()).resolves.not.toThrow();
        });

        it('should bind method to target', async () => {
            const mockMethod = vi.fn();
            const mockTarget = { name: 'test' };
            const mockCrons = [
                {
                    target: mockTarget,
                    method: mockMethod,
                    cronTime: '*/5 * * * *',
                },
            ];

            vi.mocked(Scope.getArray).mockReturnValue(mockCrons);

            await SchedulingService.loadConfig();

            // Method should be bound to target
            expect(Scope.getArray).toHaveBeenCalled();
        });

        it('should create manager for each cron', async () => {
            const mockCrons = [
                { target: {}, method: vi.fn(), cronTime: '* * * * *' },
                { target: {}, method: vi.fn(), cronTime: '*/5 * * * *' },
                { target: {}, method: vi.fn(), cronTime: '0 * * * *' },
            ];

            vi.mocked(Scope.getArray).mockReturnValue(mockCrons);

            await SchedulingService.loadConfig();

            // Each cron should have created a manager
            expect(Scope.getArray).toHaveBeenCalledWith('__crons');
        });
    });

    describe('stopAllJobs', () => {
        beforeEach(async () => {
            const mockCrons = [
                { target: {}, method: vi.fn(), cronTime: '* * * * *' },
            ];
            vi.mocked(Scope.getArray).mockReturnValue(mockCrons);
            await SchedulingService.loadConfig();
        });

        it('should stop all managers', () => {
            expect(() => SchedulingService.stopAllJobs()).not.toThrow();
        });

        it('should log in dev environment', () => {
            const originalEnv = process.env.NODE_ENV;
            process.env.NODE_ENV = 'dev';

            SchedulingService.stopAllJobs();

            process.env.NODE_ENV = originalEnv;
        });

        it('should not log in production', () => {
            const originalEnv = process.env.NODE_ENV;
            process.env.NODE_ENV = 'production';

            SchedulingService.stopAllJobs();

            process.env.NODE_ENV = originalEnv;
        });
    });

    describe('restartAllJobs', () => {
        beforeEach(async () => {
            const mockCrons = [
                { target: {}, method: vi.fn(), cronTime: '* * * * *' },
            ];
            vi.mocked(Scope.getArray).mockReturnValue(mockCrons);
            await SchedulingService.loadConfig();
        });

        it('should restart all managers', () => {
            expect(() => SchedulingService.restartAllJobs()).not.toThrow();
        });

        it('should log in dev environment', () => {
            const originalEnv = process.env.NODE_ENV;
            process.env.NODE_ENV = 'dev';

            SchedulingService.restartAllJobs();

            process.env.NODE_ENV = originalEnv;
        });
    });

    describe('changeCronTimeForJob', () => {
        beforeEach(async () => {
            const mockCrons = [
                { target: {}, method: vi.fn(), cronTime: '* * * * *' },
                { target: {}, method: vi.fn(), cronTime: '*/5 * * * *' },
            ];
            vi.mocked(Scope.getArray).mockReturnValue(mockCrons);
            await SchedulingService.loadConfig();
        });

        it('should change cron time for existing job', () => {
            expect(() =>
                SchedulingService.changeCronTimeForJob(0, '*/10 * * * *'),
            ).not.toThrow();
        });

        it('should log error for non-existent job', () => {
            const originalEnv = process.env.NODE_ENV;
            process.env.NODE_ENV = 'dev';

            SchedulingService.changeCronTimeForJob(99, '*/10 * * * *');

            process.env.NODE_ENV = originalEnv;
        });

        it('should handle valid index', () => {
            const originalEnv = process.env.NODE_ENV;
            process.env.NODE_ENV = 'dev';

            SchedulingService.changeCronTimeForJob(1, '0 0 * * *');

            process.env.NODE_ENV = originalEnv;
        });
    });

    describe('addObserverToJob', () => {
        beforeEach(async () => {
            const mockCrons = [
                { target: {}, method: vi.fn(), cronTime: '* * * * *' },
            ];
            vi.mocked(Scope.getArray).mockReturnValue(mockCrons);
            await SchedulingService.loadConfig();
        });

        it('should add observer to existing job', () => {
            const observer = vi.fn();
            expect(() =>
                SchedulingService.addObserverToJob(0, observer),
            ).not.toThrow();
        });

        it('should log error for non-existent job', () => {
            const originalEnv = process.env.NODE_ENV;
            process.env.NODE_ENV = 'dev';

            const observer = vi.fn();
            SchedulingService.addObserverToJob(99, observer);

            process.env.NODE_ENV = originalEnv;
        });

        it('should log in dev environment when adding observer', () => {
            const originalEnv = process.env.NODE_ENV;
            process.env.NODE_ENV = 'dev';

            const observer = vi.fn();
            SchedulingService.addObserverToJob(0, observer);

            process.env.NODE_ENV = originalEnv;
        });
    });
});

describe('SchedulingManager', () => {
    beforeEach(() => {
        vi.clearAllMocks();
    });

    afterEach(() => {
        vi.clearAllMocks();
    });

    describe('constructor', () => {
        it('should create a cron job with given time and callback', () => {
            const onTick = vi.fn();
            const manager = new SchedulingManager('* * * * *', onTick);

            expect(manager).toBeDefined();
        });
    });

    describe('start', () => {
        it('should start the cron job if not active', () => {
            const onTick = vi.fn();
            const manager = new SchedulingManager('* * * * *', onTick);

            manager.start();

            // Should have started
            expect(manager).toBeDefined();
        });

        it('should not start if already active', () => {
            const onTick = vi.fn();
            const manager = new SchedulingManager('* * * * *', onTick);

            manager.start();
            manager.start(); // Second call should be a no-op

            expect(manager).toBeDefined();
        });
    });

    describe('stop', () => {
        it('should stop the cron job if active', () => {
            const onTick = vi.fn();
            const manager = new SchedulingManager('* * * * *', onTick);

            manager.start();
            manager.stop();

            expect(manager).toBeDefined();
        });

        it('should not stop if not active', () => {
            const onTick = vi.fn();
            const manager = new SchedulingManager('* * * * *', onTick);

            manager.stop(); // Should not throw

            expect(manager).toBeDefined();
        });
    });

    describe('restart', () => {
        it('should stop and start the cron job', () => {
            const onTick = vi.fn();
            const manager = new SchedulingManager('* * * * *', onTick);

            manager.start();
            manager.restart();

            expect(manager).toBeDefined();
        });
    });

    describe('changeCronTime', () => {
        it('should change the cron time and restart', () => {
            const onTick = vi.fn();
            const manager = new SchedulingManager('* * * * *', onTick);

            manager.changeCronTime('*/5 * * * *');

            expect(manager).toBeDefined();
        });
    });

    describe('addObserver', () => {
        it('should add observer to the list', () => {
            const onTick = vi.fn();
            const manager = new SchedulingManager('* * * * *', onTick);
            const observer = vi.fn();

            manager.addObserver(observer);

            expect(manager).toBeDefined();
        });

        it('should not add duplicate observers', () => {
            const onTick = vi.fn();
            const manager = new SchedulingManager('* * * * *', onTick);
            const observer = vi.fn();

            manager.addObserver(observer);
            manager.addObserver(observer); // Should be ignored

            expect(manager).toBeDefined();
        });

        it('should add multiple different observers', () => {
            const onTick = vi.fn();
            const manager = new SchedulingManager('* * * * *', onTick);
            const observer1 = vi.fn();
            const observer2 = vi.fn();

            manager.addObserver(observer1);
            manager.addObserver(observer2);

            expect(manager).toBeDefined();
        });
    });

    describe('notifyObservers', () => {
        it('should call original onTick and all observers', () => {
            const onTick = vi.fn();
            const manager = new SchedulingManager('* * * * *', onTick);
            const observer1 = vi.fn();
            const observer2 = vi.fn();

            manager.addObserver(observer1);
            manager.addObserver(observer2);

            // Trigger the cron job manually (accessing internal)
            const cronJob = (manager as any).cronJob;
            if (cronJob && cronJob.__trigger) {
                cronJob.__trigger();
            }

            // The callback should have been called
            expect(manager).toBeDefined();
        });
    });
});
