import { vi } from 'vitest';

/**
 * Mock WebSocket Client
 */
export class MockWebSocketClient {
    public readyState: number = 1; // WebSocket.OPEN
    public onopen: ((event: any) => void) | null = null;
    public onclose: ((event: any) => void) | null = null;
    public onmessage: ((event: any) => void) | null = null;
    public onerror: ((event: any) => void) | null = null;

    private messageHandlers: Map<string, Function[]> = new Map();

    constructor(public url?: string) {}

    send = vi.fn((data: string | Buffer) => {
        // Parse the message if it's a JSON string
        try {
            const parsed = JSON.parse(data.toString());
            if (parsed.event) {
                this.emit(parsed.event, parsed.data);
            }
        } catch {
            // Not JSON, emit as raw data
            this.emit('message', data);
        }
    });

    close = vi.fn((code?: number, reason?: string) => {
        this.readyState = 3; // WebSocket.CLOSED
        if (this.onclose) {
            this.onclose({ code, reason });
        }
    });

    addEventListener = vi.fn((event: string, handler: Function) => {
        if (!this.messageHandlers.has(event)) {
            this.messageHandlers.set(event, []);
        }
        this.messageHandlers.get(event)!.push(handler);
    });

    removeEventListener = vi.fn((event: string, handler: Function) => {
        const handlers = this.messageHandlers.get(event);
        if (handlers) {
            const index = handlers.indexOf(handler);
            if (index > -1) {
                handlers.splice(index, 1);
            }
        }
    });

    emit(event: string, data: any) {
        const handlers = this.messageHandlers.get(event) || [];
        handlers.forEach((handler) => handler({ data }));
    }

    // Simulate receiving a message
    simulateMessage(data: any) {
        const messageData = typeof data === 'string' ? data : JSON.stringify(data);
        if (this.onmessage) {
            this.onmessage({ data: messageData });
        }
        this.emit('message', { data: messageData });
    }

    // Simulate connection open
    simulateOpen() {
        this.readyState = 1;
        if (this.onopen) {
            this.onopen({});
        }
        this.emit('open', {});
    }

    // Simulate connection close
    simulateClose(code: number = 1000, reason: string = 'Normal closure') {
        this.readyState = 3;
        if (this.onclose) {
            this.onclose({ code, reason });
        }
        this.emit('close', { code, reason });
    }

    // Simulate error
    simulateError(error: Error) {
        if (this.onerror) {
            this.onerror({ error });
        }
        this.emit('error', { error });
    }

    reset() {
        this.send.mockClear();
        this.close.mockClear();
        this.addEventListener.mockClear();
        this.removeEventListener.mockClear();
        this.messageHandlers.clear();
        this.readyState = 1;
    }
}

/**
 * Mock WebSocket Server
 */
export class MockWebSocketServer {
    public clients: Set<MockWebSocketClient> = new Set();
    private eventHandlers: Map<string, Function[]> = new Map();

    constructor(public options?: { port?: number; path?: string }) {}

    on = vi.fn((event: string, handler: Function) => {
        if (!this.eventHandlers.has(event)) {
            this.eventHandlers.set(event, []);
        }
        this.eventHandlers.get(event)!.push(handler);
    });

    off = vi.fn((event: string, handler: Function) => {
        const handlers = this.eventHandlers.get(event);
        if (handlers) {
            const index = handlers.indexOf(handler);
            if (index > -1) {
                handlers.splice(index, 1);
            }
        }
    });

    emit(event: string, ...args: any[]) {
        const handlers = this.eventHandlers.get(event) || [];
        handlers.forEach((handler) => handler(...args));
    }

    // Simulate a new client connection
    simulateConnection(): MockWebSocketClient {
        const client = new MockWebSocketClient();
        this.clients.add(client);
        this.emit('connection', client);
        return client;
    }

    // Broadcast to all clients
    broadcast(data: any) {
        this.clients.forEach((client) => {
            if (client.readyState === 1) {
                client.simulateMessage(data);
            }
        });
    }

    close = vi.fn(() => {
        this.clients.forEach((client) => client.close());
        this.clients.clear();
        this.emit('close');
    });

    reset() {
        this.on.mockClear();
        this.off.mockClear();
        this.close.mockClear();
        this.clients.clear();
        this.eventHandlers.clear();
    }
}

/**
 * Mock WS Gateway Service
 */
export const MockWSGatewayService = {
    broadcast: vi.fn(),
    send: vi.fn(),
    sendToRoom: vi.fn(),
    joinRoom: vi.fn(),
    leaveRoom: vi.fn(),
    getClients: vi.fn().mockReturnValue([]),
    getClientById: vi.fn().mockReturnValue(null),
    disconnect: vi.fn(),

    reset: () => {
        Object.values(MockWSGatewayService).forEach((mock) => {
            if (typeof mock === 'function' && 'mockReset' in mock) {
                (mock as any).mockReset();
            }
        });
    },
};

/**
 * Mock RPC Service
 */
export const MockRPCService = {
    call: vi.fn().mockResolvedValue({ success: true }),
    emit: vi.fn(),
    subscribe: vi.fn().mockReturnValue({ unsubscribe: vi.fn() }),
    unsubscribe: vi.fn(),
    registerHandler: vi.fn(),
    removeHandler: vi.fn(),

    reset: () => {
        Object.values(MockRPCService).forEach((mock) => {
            if (typeof mock === 'function' && 'mockReset' in mock) {
                (mock as any).mockReset();
            }
        });
    },
};

/**
 * Create a mock WebSocket message
 */
export interface MockWSMessage {
    event: string;
    data: any;
    id?: string;
}

export function createMockWSMessage(overrides: Partial<MockWSMessage> = {}): MockWSMessage {
    return {
        event: 'message',
        data: {},
        id: 'msg-' + Math.random().toString(36).substr(2, 9),
        ...overrides,
    };
}

/**
 * Mock WebSocket decorators
 */
export const MockWSDecorators = {
    WebSocketGateway: vi.fn(() => (target: any) => target),
    SubscribeMessage: vi.fn(() => () => {}),
    MessageBody: vi.fn(() => () => {}),
    ConnectedSocket: vi.fn(() => () => {}),
    WebSocketServer: vi.fn(() => () => {}),
};

/**
 * Reset all WS mocks
 */
export function resetAllWSMocks() {
    MockWSGatewayService.reset();
    MockRPCService.reset();
}
