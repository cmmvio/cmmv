import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import 'reflect-metadata';
import { OnEvent } from '../../decorators/events.decorator';
import { EventsRegistry } from '../../registries/events.registry';

describe('OnEvent Decorator', () => {
    beforeEach(() => {
        EventsRegistry.clear();
    });

    afterEach(() => {
        vi.clearAllMocks();
        EventsRegistry.clear();
    });

    describe('basic functionality', () => {
        it('should register event handler with given message', () => {
            class TestService {
                @OnEvent('user.created')
                onUserCreated() {
                    return 'user created';
                }
            }

            const events = EventsRegistry.getEvents();
            expect(events.length).toBe(1);
            expect(events[0][0]).toBe('user.created');
        });

        it('should register handler with correct name', () => {
            class TestService {
                @OnEvent('test.event')
                myHandler() {
                    return 'handled';
                }
            }

            const consumes = EventsRegistry.getConsumes('test.event');
            expect(consumes.length).toBe(1);
            expect(consumes[0].handlerName).toBe('myHandler');
        });

        it('should register handler callback', () => {
            const mockFn = vi.fn().mockReturnValue('result');

            class TestService {
                @OnEvent('test.callback')
                handler() {
                    return mockFn();
                }
            }

            const consumes = EventsRegistry.getConsumes('test.callback');
            expect(consumes.length).toBe(1);
            expect(typeof consumes[0].cb).toBe('function');
        });
    });

    describe('multiple handlers', () => {
        it('should register multiple handlers for same event', () => {
            class TestService {
                @OnEvent('shared.event')
                handler1() {
                    return 'handler1';
                }

                @OnEvent('shared.event')
                handler2() {
                    return 'handler2';
                }
            }

            const consumes = EventsRegistry.getConsumes('shared.event');
            expect(consumes.length).toBe(2);
        });

        it('should register handlers for different events', () => {
            class TestService {
                @OnEvent('event.one')
                handlerOne() {
                    return 'one';
                }

                @OnEvent('event.two')
                handlerTwo() {
                    return 'two';
                }
            }

            const events = EventsRegistry.getEvents();
            expect(events.length).toBe(2);

            const consumesOne = EventsRegistry.getConsumes('event.one');
            const consumesTwo = EventsRegistry.getConsumes('event.two');
            expect(consumesOne.length).toBe(1);
            expect(consumesTwo.length).toBe(1);
        });

        it('should update handler callback if same handler name is registered', () => {
            class TestService1 {
                @OnEvent('same.event')
                sameHandler() {
                    return 'first';
                }
            }

            class TestService2 {
                @OnEvent('same.event')
                sameHandler() {
                    return 'second';
                }
            }

            const consumes = EventsRegistry.getConsumes('same.event');
            // Same handler name should update, not add
            expect(consumes.length).toBe(1);
        });
    });

    describe('error handling', () => {
        it('should throw error when decorator is applied to non-function', () => {
            const decorator = OnEvent('invalid.event');
            const descriptor = { value: 'not a function' };

            expect(() => {
                decorator({}, 'propertyName', descriptor as any);
            }).toThrow('@Hook can only be used on methods.');
        });
    });

    describe('event message formats', () => {
        it('should handle dot notation messages', () => {
            class TestService {
                @OnEvent('user.profile.updated')
                onProfileUpdate() {}
            }

            const consumes = EventsRegistry.getConsumes('user.profile.updated');
            expect(consumes.length).toBe(1);
        });

        it('should handle colon notation messages', () => {
            class TestService {
                @OnEvent('user:created')
                onUserCreated() {}
            }

            const consumes = EventsRegistry.getConsumes('user:created');
            expect(consumes.length).toBe(1);
        });

        it('should handle simple string messages', () => {
            class TestService {
                @OnEvent('simple')
                onSimple() {}
            }

            const consumes = EventsRegistry.getConsumes('simple');
            expect(consumes.length).toBe(1);
        });

        it('should handle empty string message', () => {
            class TestService {
                @OnEvent('')
                onEmpty() {}
            }

            const consumes = EventsRegistry.getConsumes('');
            expect(consumes.length).toBe(1);
        });
    });

    describe('handler execution', () => {
        it('should allow calling registered handler', () => {
            class TestService {
                @OnEvent('exec.test')
                handler(data: string) {
                    return `processed: ${data}`;
                }
            }

            const consumes = EventsRegistry.getConsumes('exec.test');
            const result = consumes[0].cb('test data');
            expect(result).toBe('processed: test data');
        });

        it('should handle async handlers', async () => {
            class TestService {
                @OnEvent('async.event')
                async asyncHandler() {
                    return Promise.resolve('async result');
                }
            }

            const consumes = EventsRegistry.getConsumes('async.event');
            const result = await consumes[0].cb();
            expect(result).toBe('async result');
        });
    });
});

describe('EventsRegistry', () => {
    beforeEach(() => {
        EventsRegistry.clear();
    });

    describe('registerHandler', () => {
        it('should create new event entry if not exists', () => {
            EventsRegistry.registerHandler('new.event', 'handler', () => {});

            const events = EventsRegistry.getEvents();
            expect(events.length).toBe(1);
        });

        it('should add handler to existing event', () => {
            EventsRegistry.registerHandler('existing.event', 'handler1', () => {});
            EventsRegistry.registerHandler('existing.event', 'handler2', () => {});

            const consumes = EventsRegistry.getConsumes('existing.event');
            expect(consumes.length).toBe(2);
        });

        it('should update callback for existing handler', () => {
            const callback1 = () => 'first';
            const callback2 = () => 'second';

            EventsRegistry.registerHandler('update.event', 'sameHandler', callback1);
            EventsRegistry.registerHandler('update.event', 'sameHandler', callback2);

            const consumes = EventsRegistry.getConsumes('update.event');
            expect(consumes.length).toBe(1);
            expect(consumes[0].cb()).toBe('second');
        });
    });

    describe('getEvents', () => {
        it('should return empty array when no events registered', () => {
            const events = EventsRegistry.getEvents();
            expect(events).toEqual([]);
        });

        it('should return all registered events', () => {
            EventsRegistry.registerHandler('event1', 'h1', () => {});
            EventsRegistry.registerHandler('event2', 'h2', () => {});
            EventsRegistry.registerHandler('event3', 'h3', () => {});

            const events = EventsRegistry.getEvents();
            expect(events.length).toBe(3);
        });
    });

    describe('getConsumes', () => {
        it('should return empty array for non-existent event', () => {
            const consumes = EventsRegistry.getConsumes('non.existent');
            expect(consumes).toEqual([]);
        });

        it('should return handlers for existing event', () => {
            EventsRegistry.registerHandler('test.event', 'handler', () => {});

            const consumes = EventsRegistry.getConsumes('test.event');
            expect(consumes.length).toBe(1);
        });
    });

    describe('clear', () => {
        it('should remove all registered events', () => {
            EventsRegistry.registerHandler('event1', 'h1', () => {});
            EventsRegistry.registerHandler('event2', 'h2', () => {});

            EventsRegistry.clear();

            const events = EventsRegistry.getEvents();
            expect(events.length).toBe(0);
        });
    });
});
