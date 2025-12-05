import { describe, it, expect, beforeEach, vi, afterEach } from 'vitest';

vi.mock('uuid', () => ({
    v4: vi.fn().mockReturnValue('test-uuid-1234'),
}));

vi.mock('class-transformer', () => ({
    plainToClass: vi.fn().mockImplementation((cls, obj) => obj),
}));

vi.mock('@cmmv/core', async (importOriginal) => {
    const actual = await importOriginal();
    return {
        ...(actual as any),
        Logger: vi.fn().mockImplementation(() => ({
            log: vi.fn(),
            error: vi.fn(),
        })),
        AbstractWSAdapter: class {
            wsServer: any = null;
        },
        AbstractHttpAdapter: class {},
        Application: class {
            wSConnections = new Map();
            providersMap = new Map();
        },
    };
});

vi.mock('@cmmv/protobuf', () => ({
    ProtoRegistry: {
        retrieve: vi.fn(),
        retrieveByIndex: vi.fn(),
        retrieveTypes: vi.fn(),
    },
}));

vi.mock('../lib/rpc.registry', () => ({
    RPCRegistry: {
        getControllers: vi.fn().mockReturnValue([]),
    },
}));

import { WSAdapter, WSCall } from '../lib/ws.adapter';
import { ProtoRegistry } from '@cmmv/protobuf';
import { RPCRegistry } from '../lib/rpc.registry';

describe('WSAdapter', () => {
    let adapter: WSAdapter;

    beforeEach(() => {
        vi.clearAllMocks();
        adapter = new WSAdapter();
    });

    describe('WSCall class', () => {
        it('should have contract, message, and data properties', () => {
            const wsCall = new WSCall();
            wsCall.contract = 1;
            wsCall.message = 2;
            wsCall.data = new Uint8Array([1, 2, 3]);

            expect(wsCall.contract).toBe(1);
            expect(wsCall.message).toBe(2);
            expect(wsCall.data).toEqual(new Uint8Array([1, 2, 3]));
        });
    });

    describe('bindClientConnect', () => {
        it('should bind connection callback to server', () => {
            const mockServer = { on: vi.fn() };
            const callback = vi.fn();

            adapter.bindClientConnect(mockServer, callback);

            expect(mockServer.on).toHaveBeenCalledWith('connection', callback);
        });
    });

    describe('bindCustomMessageHandler', () => {
        it('should bind message callback to server', () => {
            const mockServer = { on: vi.fn() };
            const callback = vi.fn();

            adapter.bindCustomMessageHandler(mockServer, callback);

            expect(mockServer.on).toHaveBeenCalledWith('message', callback);
        });
    });

    describe('interceptor', () => {
        it('should decode and route messages to registered handlers', () => {
            const mockHandler = vi.fn();
            const mockInstance = { testHandler: mockHandler };
            const mockContract = {
                lookupType: vi.fn().mockReturnValue({
                    decode: vi.fn().mockReturnValue({ field: 'value' }),
                }),
            };

            vi.mocked(ProtoRegistry.retrieve).mockReturnValue({
                lookupType: vi.fn().mockReturnValue({
                    decode: vi.fn().mockReturnValue({
                        contract: 0,
                        message: 0,
                        data: new Uint8Array(),
                    }),
                }),
            } as any);

            vi.mocked(ProtoRegistry.retrieveByIndex).mockReturnValue(
                mockContract as any,
            );
            vi.mocked(ProtoRegistry.retrieveTypes).mockReturnValue(
                'TestMessage',
            );

            // Register a handler
            (adapter as any).registeredMessages.set('TestMessage', {
                instance: mockInstance,
                handlerName: 'testHandler',
                params: [{ index: 0, paramType: 'data' }],
            });

            const mockData = new Uint8Array([1, 2, 3]);
            const mockSocket = { id: 'socket-123' };

            adapter.interceptor(mockSocket, mockData);

            expect(mockHandler).toHaveBeenCalled();
        });

        it('should pass socket to handler when param type is socket', () => {
            const mockHandler = vi.fn();
            const mockInstance = { testHandler: mockHandler };
            const mockContract = {
                lookupType: vi.fn().mockReturnValue({
                    decode: vi.fn().mockReturnValue({ field: 'value' }),
                }),
            };

            vi.mocked(ProtoRegistry.retrieve).mockReturnValue({
                lookupType: vi.fn().mockReturnValue({
                    decode: vi.fn().mockReturnValue({
                        contract: 0,
                        message: 0,
                        data: new Uint8Array(),
                    }),
                }),
            } as any);

            vi.mocked(ProtoRegistry.retrieveByIndex).mockReturnValue(
                mockContract as any,
            );
            vi.mocked(ProtoRegistry.retrieveTypes).mockReturnValue(
                'TestMessage',
            );

            (adapter as any).registeredMessages.set('TestMessage', {
                instance: mockInstance,
                handlerName: 'testHandler',
                params: [
                    { index: 0, paramType: 'data' },
                    { index: 1, paramType: 'socket' },
                ],
            });

            const mockData = new Uint8Array([1, 2, 3]);
            const mockSocket = { id: 'socket-123' };

            adapter.interceptor(mockSocket, mockData);

            expect(mockHandler).toHaveBeenCalledWith(
                expect.anything(),
                mockSocket,
            );
        });

        it('should not call handler if message type is not registered', () => {
            vi.mocked(ProtoRegistry.retrieve).mockReturnValue({
                lookupType: vi.fn().mockReturnValue({
                    decode: vi.fn().mockReturnValue({
                        contract: 0,
                        message: 0,
                        data: new Uint8Array(),
                    }),
                }),
            } as any);

            vi.mocked(ProtoRegistry.retrieveByIndex).mockReturnValue({
                lookupType: vi.fn(),
            } as any);
            vi.mocked(ProtoRegistry.retrieveTypes).mockReturnValue(
                'UnknownMessage',
            );

            const mockSocket = { id: 'socket-123' };
            const mockData = new Uint8Array([1, 2, 3]);

            // Should not throw
            expect(() =>
                adapter.interceptor(mockSocket, mockData),
            ).not.toThrow();
        });

        it('should handle errors in handler execution', () => {
            const mockHandler = vi.fn().mockImplementation(() => {
                throw new Error('Handler error');
            });
            const mockInstance = { testHandler: mockHandler };
            const mockContract = {
                lookupType: vi.fn().mockReturnValue({
                    decode: vi.fn().mockReturnValue({ field: 'value' }),
                }),
            };

            vi.mocked(ProtoRegistry.retrieve).mockReturnValue({
                lookupType: vi.fn().mockReturnValue({
                    decode: vi.fn().mockReturnValue({
                        contract: 0,
                        message: 0,
                        data: new Uint8Array(),
                    }),
                }),
            } as any);

            vi.mocked(ProtoRegistry.retrieveByIndex).mockReturnValue(
                mockContract as any,
            );
            vi.mocked(ProtoRegistry.retrieveTypes).mockReturnValue(
                'TestMessage',
            );

            (adapter as any).registeredMessages.set('TestMessage', {
                instance: mockInstance,
                handlerName: 'testHandler',
                params: [{ index: 0, paramType: 'data' }],
            });

            const mockSocket = { id: 'socket-123' };
            const mockData = new Uint8Array([1, 2, 3]);

            // Should not throw, error should be caught
            expect(() =>
                adapter.interceptor(mockSocket, mockData),
            ).not.toThrow();
        });

        it('should sort params by index', () => {
            const mockHandler = vi.fn();
            const mockInstance = { testHandler: mockHandler };
            const mockContract = {
                lookupType: vi.fn().mockReturnValue({
                    decode: vi.fn().mockReturnValue({ field: 'value' }),
                }),
            };

            vi.mocked(ProtoRegistry.retrieve).mockReturnValue({
                lookupType: vi.fn().mockReturnValue({
                    decode: vi.fn().mockReturnValue({
                        contract: 0,
                        message: 0,
                        data: new Uint8Array(),
                    }),
                }),
            } as any);

            vi.mocked(ProtoRegistry.retrieveByIndex).mockReturnValue(
                mockContract as any,
            );
            vi.mocked(ProtoRegistry.retrieveTypes).mockReturnValue(
                'TestMessage',
            );

            // Params out of order
            (adapter as any).registeredMessages.set('TestMessage', {
                instance: mockInstance,
                handlerName: 'testHandler',
                params: [
                    { index: 1, paramType: 'socket' },
                    { index: 0, paramType: 'data' },
                ],
            });

            const mockSocket = { id: 'socket-123' };
            const mockData = new Uint8Array([1, 2, 3]);

            adapter.interceptor(mockSocket, mockData);

            // First arg should be data, second should be socket
            expect(mockHandler).toHaveBeenCalledWith(
                { field: 'value' },
                mockSocket,
            );
        });

        it('should return undefined for unknown param types', () => {
            const mockHandler = vi.fn();
            const mockInstance = { testHandler: mockHandler };
            const mockContract = {
                lookupType: vi.fn().mockReturnValue({
                    decode: vi.fn().mockReturnValue({ field: 'value' }),
                }),
            };

            vi.mocked(ProtoRegistry.retrieve).mockReturnValue({
                lookupType: vi.fn().mockReturnValue({
                    decode: vi.fn().mockReturnValue({
                        contract: 0,
                        message: 0,
                        data: new Uint8Array(),
                    }),
                }),
            } as any);

            vi.mocked(ProtoRegistry.retrieveByIndex).mockReturnValue(
                mockContract as any,
            );
            vi.mocked(ProtoRegistry.retrieveTypes).mockReturnValue(
                'TestMessage',
            );

            (adapter as any).registeredMessages.set('TestMessage', {
                instance: mockInstance,
                handlerName: 'testHandler',
                params: [{ index: 0, paramType: 'unknown' }],
            });

            const mockSocket = { id: 'socket-123' };
            const mockData = new Uint8Array([1, 2, 3]);

            adapter.interceptor(mockSocket, mockData);

            expect(mockHandler).toHaveBeenCalledWith(undefined);
        });

        it('should not throw when contract is not found', () => {
            vi.mocked(ProtoRegistry.retrieve).mockReturnValue({
                lookupType: vi.fn().mockReturnValue({
                    decode: vi.fn().mockReturnValue({
                        contract: 999,
                        message: 0,
                        data: new Uint8Array(),
                    }),
                }),
            } as any);

            vi.mocked(ProtoRegistry.retrieveByIndex).mockReturnValue(
                null as any,
            );

            const mockSocket = { id: 'socket-123' };
            const mockData = new Uint8Array([1, 2, 3]);

            expect(() =>
                adapter.interceptor(mockSocket, mockData),
            ).not.toThrow();
        });
    });

    describe('close', () => {
        it('should call close on wsServer', () => {
            const mockWsServer = { close: vi.fn() };
            (adapter as any).wsServer = mockWsServer;

            adapter.close();

            expect(mockWsServer.close).toHaveBeenCalled();
        });
    });

    describe('registeredMessages', () => {
        it('should be a Map', () => {
            expect((adapter as any).registeredMessages).toBeInstanceOf(Map);
        });

        it('should allow setting and getting messages', () => {
            const handler = { instance: {}, handlerName: 'test', params: [] };
            (adapter as any).registeredMessages.set('TestType', handler);

            expect((adapter as any).registeredMessages.get('TestType')).toBe(
                handler,
            );
        });
    });
});

describe('RPCRegistry integration', () => {
    it('should get controllers from registry', () => {
        vi.mocked(RPCRegistry.getControllers).mockReturnValue([
            [
                class TestController {},
                {
                    messages: [
                        { message: 'Test', handlerName: 'handle', params: [] },
                    ],
                },
            ],
        ]);

        const controllers = RPCRegistry.getControllers();

        expect(controllers).toHaveLength(1);
        expect(controllers[0][1].messages[0].message).toBe('Test');
    });
});
