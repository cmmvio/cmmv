import { vi } from 'vitest';
import { ITestingModule } from '../core/testing.interface';

/**
 * WebSocket message types
 */
export interface IWsMessage {
    event: string;
    data: any;
    id?: string;
    timestamp?: number;
}

/**
 * WebSocket connection options
 */
export interface IWsConnectionOptions {
    /** Connection timeout in milliseconds */
    timeout?: number;
    /** Protocol(s) to use */
    protocols?: string | string[];
    /** Custom headers for the connection */
    headers?: Record<string, string>;
    /** Auto reconnect on disconnect */
    autoReconnect?: boolean;
    /** Reconnect delay in milliseconds */
    reconnectDelay?: number;
    /** Maximum reconnect attempts */
    maxReconnectAttempts?: number;
}

/**
 * Message expectation for testing
 */
export interface IMessageExpectation {
    /** Expected event name */
    event?: string;
    /** Expected data (partial match) */
    data?: any;
    /** Timeout for waiting */
    timeout?: number;
}

/**
 * Received message tracking
 */
interface IReceivedMessage extends IWsMessage {
    receivedAt: number;
}

/**
 * WsTestingClient - Provides WebSocket testing capabilities
 * for testing gateways and RPC communication
 */
export class WsTestingClient {
    private url: string = '';
    private isConnected: boolean = false;
    private messageHandlers: Map<string, ((msg: IWsMessage) => void)[]> = new Map();
    private receivedMessages: IReceivedMessage[] = [];
    private sentMessages: IWsMessage[] = [];
    private connectionPromise: Promise<void> | null = null;
    private disconnectPromise: Promise<void> | null = null;

    // Mock functions for tracking
    public readonly onConnect = vi.fn();
    public readonly onDisconnect = vi.fn();
    public readonly onMessage = vi.fn();
    public readonly onError = vi.fn();

    constructor(private module?: ITestingModule) {}

    /**
     * Connect to a WebSocket server
     */
    async connect(url: string, options: IWsConnectionOptions = {}): Promise<void> {
        const timeout = options.timeout || 5000;

        this.url = url;

        this.connectionPromise = new Promise<void>((resolve, reject) => {
            const timer = setTimeout(() => {
                reject(new Error(`Connection timeout after ${timeout}ms`));
            }, timeout);

            // Simulate successful connection
            setTimeout(() => {
                clearTimeout(timer);
                this.isConnected = true;
                this.onConnect();
                resolve();
            }, 10);
        });

        return this.connectionPromise;
    }

    /**
     * Disconnect from the WebSocket server
     */
    async disconnect(code: number = 1000, reason: string = 'Normal closure'): Promise<void> {
        if (!this.isConnected) {
            return;
        }

        this.disconnectPromise = new Promise<void>((resolve) => {
            setTimeout(() => {
                this.isConnected = false;
                this.onDisconnect({ code, reason });
                resolve();
            }, 10);
        });

        return this.disconnectPromise;
    }

    /**
     * Send a message to the server
     */
    send(event: string, data: any): void {
        if (!this.isConnected) {
            throw new Error('Not connected to WebSocket server');
        }

        const message: IWsMessage = {
            event,
            data,
            id: this.generateId(),
            timestamp: Date.now(),
        };

        this.sentMessages.push(message);
    }

    /**
     * Send a raw message (for testing custom protocols)
     */
    sendRaw(data: string | ArrayBuffer): void {
        if (!this.isConnected) {
            throw new Error('Not connected to WebSocket server');
        }

        const message: IWsMessage = {
            event: '__raw__',
            data,
            id: this.generateId(),
            timestamp: Date.now(),
        };

        this.sentMessages.push(message);
    }

    /**
     * Emit an RPC call and wait for response
     */
    async emit<T = any>(event: string, data: any, timeout: number = 5000): Promise<T> {
        this.send(event, data);

        return this.waitForMessage<T>({
            event: `${event}:response`,
            timeout,
        });
    }

    /**
     * Simulate receiving a message from the server
     */
    simulateMessage(event: string, data: any): void {
        const message: IReceivedMessage = {
            event,
            data,
            id: this.generateId(),
            timestamp: Date.now(),
            receivedAt: Date.now(),
        };

        this.receivedMessages.push(message);
        this.onMessage(message);

        // Trigger event handlers
        const handlers = this.messageHandlers.get(event) || [];
        handlers.forEach((handler) => handler(message));

        // Trigger catch-all handlers
        const allHandlers = this.messageHandlers.get('*') || [];
        allHandlers.forEach((handler) => handler(message));
    }

    /**
     * Simulate an error
     */
    simulateError(error: Error): void {
        this.onError(error);
    }

    /**
     * Simulate connection close from server
     */
    simulateClose(code: number = 1000, reason: string = 'Server closed'): void {
        this.isConnected = false;
        this.onDisconnect({ code, reason });
    }

    /**
     * Subscribe to messages for a specific event
     */
    on(event: string, handler: (msg: IWsMessage) => void): () => void {
        if (!this.messageHandlers.has(event)) {
            this.messageHandlers.set(event, []);
        }
        this.messageHandlers.get(event)!.push(handler);

        // Return unsubscribe function
        return () => {
            const handlers = this.messageHandlers.get(event);
            if (handlers) {
                const index = handlers.indexOf(handler);
                if (index > -1) {
                    handlers.splice(index, 1);
                }
            }
        };
    }

    /**
     * Subscribe to all messages
     */
    onAny(handler: (msg: IWsMessage) => void): () => void {
        return this.on('*', handler);
    }

    /**
     * Wait for a specific message
     */
    async waitForMessage<T = any>(expectation: IMessageExpectation): Promise<T> {
        const timeout = expectation.timeout || 5000;

        return new Promise<T>((resolve, reject) => {
            const timer = setTimeout(() => {
                reject(new Error(`Timeout waiting for message${expectation.event ? ` '${expectation.event}'` : ''}`));
            }, timeout);

            const checkMessage = (msg: IWsMessage): boolean => {
                if (expectation.event && msg.event !== expectation.event) {
                    return false;
                }
                if (expectation.data) {
                    return this.partialMatch(msg.data, expectation.data);
                }
                return true;
            };

            // Check already received messages
            for (const msg of this.receivedMessages) {
                if (checkMessage(msg)) {
                    clearTimeout(timer);
                    resolve(msg.data as T);
                    return;
                }
            }

            // Listen for new messages
            const handler = (msg: IWsMessage) => {
                if (checkMessage(msg)) {
                    clearTimeout(timer);
                    unsubscribe();
                    resolve(msg.data as T);
                }
            };

            const unsubscribe = this.on(expectation.event || '*', handler);
        });
    }

    /**
     * Wait for multiple messages
     */
    async waitForMessages(count: number, options: { timeout?: number; event?: string } = {}): Promise<IWsMessage[]> {
        const timeout = options.timeout || 5000;
        const messages: IWsMessage[] = [];

        return new Promise<IWsMessage[]>((resolve, reject) => {
            const timer = setTimeout(() => {
                reject(new Error(`Timeout waiting for ${count} messages, received ${messages.length}`));
            }, timeout);

            const handler = (msg: IWsMessage) => {
                if (!options.event || msg.event === options.event) {
                    messages.push(msg);
                    if (messages.length >= count) {
                        clearTimeout(timer);
                        unsubscribe();
                        resolve(messages);
                    }
                }
            };

            const unsubscribe = this.on(options.event || '*', handler);
        });
    }

    /**
     * Get all sent messages
     */
    getSentMessages(): IWsMessage[] {
        return [...this.sentMessages];
    }

    /**
     * Get sent messages by event
     */
    getSentMessagesByEvent(event: string): IWsMessage[] {
        return this.sentMessages.filter((m) => m.event === event);
    }

    /**
     * Get all received messages
     */
    getReceivedMessages(): IReceivedMessage[] {
        return [...this.receivedMessages];
    }

    /**
     * Get received messages by event
     */
    getReceivedMessagesByEvent(event: string): IReceivedMessage[] {
        return this.receivedMessages.filter((m) => m.event === event);
    }

    /**
     * Check if connected
     */
    connected(): boolean {
        return this.isConnected;
    }

    /**
     * Get connection URL
     */
    getUrl(): string {
        return this.url;
    }

    /**
     * Clear all messages
     */
    clearMessages(): void {
        this.sentMessages = [];
        this.receivedMessages = [];
    }

    /**
     * Reset the client
     */
    reset(): void {
        this.clearMessages();
        this.messageHandlers.clear();
        this.onConnect.mockClear();
        this.onDisconnect.mockClear();
        this.onMessage.mockClear();
        this.onError.mockClear();
    }

    /**
     * Close the client (alias for disconnect)
     */
    async close(): Promise<void> {
        return this.disconnect();
    }

    private generateId(): string {
        return 'msg-' + Math.random().toString(36).substr(2, 9);
    }

    private partialMatch(actual: any, expected: any): boolean {
        if (expected === actual) return true;
        if (typeof expected !== 'object' || expected === null) return false;
        if (typeof actual !== 'object' || actual === null) return false;

        for (const key of Object.keys(expected)) {
            if (!(key in actual)) return false;
            if (!this.partialMatch(actual[key], expected[key])) return false;
        }
        return true;
    }
}

/**
 * RPC Testing Client - Specialized for RPC-style communication
 */
export class RpcTestingClient extends WsTestingClient {
    private pendingCalls: Map<string, { resolve: Function; reject: Function; timeout: NodeJS.Timeout }> = new Map();
    private rpcTimeout: number = 5000;

    constructor(module?: ITestingModule) {
        super(module);
    }

    /**
     * Set default RPC timeout
     */
    setRpcTimeout(timeout: number): void {
        this.rpcTimeout = timeout;
    }

    /**
     * Make an RPC call
     */
    async call<T = any>(method: string, params: any = {}, timeout?: number): Promise<T> {
        const callId = this.generateCallId();
        const effectiveTimeout = timeout || this.rpcTimeout;

        this.send('rpc:call', {
            id: callId,
            method,
            params,
        });

        return new Promise<T>((resolve, reject) => {
            const timer = setTimeout(() => {
                this.pendingCalls.delete(callId);
                reject(new Error(`RPC call '${method}' timed out after ${effectiveTimeout}ms`));
            }, effectiveTimeout);

            this.pendingCalls.set(callId, { resolve, reject, timeout: timer });

            // Listen for the response
            const unsubscribe = this.on('rpc:response', (msg) => {
                if (msg.data?.id === callId) {
                    clearTimeout(timer);
                    this.pendingCalls.delete(callId);
                    unsubscribe();

                    if (msg.data.error) {
                        reject(new Error(msg.data.error.message || 'RPC Error'));
                    } else {
                        resolve(msg.data.result as T);
                    }
                }
            });
        });
    }

    /**
     * Simulate an RPC response
     */
    simulateRpcResponse(callId: string, result: any): void {
        this.simulateMessage('rpc:response', {
            id: callId,
            result,
        });
    }

    /**
     * Simulate an RPC error
     */
    simulateRpcError(callId: string, error: { code?: number; message: string }): void {
        this.simulateMessage('rpc:response', {
            id: callId,
            error,
        });
    }

    /**
     * Get pending call IDs
     */
    getPendingCalls(): string[] {
        return Array.from(this.pendingCalls.keys());
    }

    private generateCallId(): string {
        return 'rpc-' + Math.random().toString(36).substr(2, 9) + '-' + Date.now();
    }
}

/**
 * Create a WebSocket testing client
 */
export function createWsTestingClient(module?: ITestingModule): WsTestingClient {
    return new WsTestingClient(module);
}

/**
 * Create an RPC testing client
 */
export function createRpcTestingClient(module?: ITestingModule): RpcTestingClient {
    return new RpcTestingClient(module);
}

/**
 * WebSocket message assertion helper
 */
export class WsMessageAssert {
    constructor(private messages: IWsMessage[]) {}

    /**
     * Assert message count
     */
    count(expected: number): WsMessageAssert {
        if (this.messages.length !== expected) {
            throw new Error(`Expected ${expected} messages but got ${this.messages.length}`);
        }
        return this;
    }

    /**
     * Assert at least n messages
     */
    atLeast(n: number): WsMessageAssert {
        if (this.messages.length < n) {
            throw new Error(`Expected at least ${n} messages but got ${this.messages.length}`);
        }
        return this;
    }

    /**
     * Assert message with event exists
     */
    hasEvent(event: string): WsMessageAssert {
        if (!this.messages.some((m) => m.event === event)) {
            throw new Error(`Expected message with event '${event}' but none found`);
        }
        return this;
    }

    /**
     * Assert message with data exists
     */
    hasData(data: any): WsMessageAssert {
        const hasMatch = this.messages.some((m) => {
            return JSON.stringify(m.data) === JSON.stringify(data);
        });
        if (!hasMatch) {
            throw new Error(`Expected message with data ${JSON.stringify(data)} but none found`);
        }
        return this;
    }

    /**
     * Assert message with partial data match
     */
    hasDataMatching(partial: any): WsMessageAssert {
        const hasMatch = this.messages.some((m) => {
            return this.partialMatch(m.data, partial);
        });
        if (!hasMatch) {
            throw new Error(`Expected message matching ${JSON.stringify(partial)} but none found`);
        }
        return this;
    }

    /**
     * Assert first message
     */
    first(): WsSingleMessageAssert {
        if (this.messages.length === 0) {
            throw new Error('No messages to assert');
        }
        return new WsSingleMessageAssert(this.messages[0]);
    }

    /**
     * Assert last message
     */
    last(): WsSingleMessageAssert {
        if (this.messages.length === 0) {
            throw new Error('No messages to assert');
        }
        return new WsSingleMessageAssert(this.messages[this.messages.length - 1]);
    }

    /**
     * Assert nth message
     */
    nth(n: number): WsSingleMessageAssert {
        if (n >= this.messages.length) {
            throw new Error(`Message at index ${n} does not exist, only ${this.messages.length} messages`);
        }
        return new WsSingleMessageAssert(this.messages[n]);
    }

    private partialMatch(actual: any, expected: any): boolean {
        if (expected === actual) return true;
        if (typeof expected !== 'object' || expected === null) return false;
        if (typeof actual !== 'object' || actual === null) return false;

        for (const key of Object.keys(expected)) {
            if (!(key in actual)) return false;
            if (!this.partialMatch(actual[key], expected[key])) return false;
        }
        return true;
    }
}

/**
 * Single message assertion helper
 */
export class WsSingleMessageAssert {
    constructor(private message: IWsMessage) {}

    /**
     * Assert event
     */
    event(expected: string): WsSingleMessageAssert {
        if (this.message.event !== expected) {
            throw new Error(`Expected event '${expected}' but got '${this.message.event}'`);
        }
        return this;
    }

    /**
     * Assert data equals
     */
    dataEquals(expected: any): WsSingleMessageAssert {
        if (JSON.stringify(this.message.data) !== JSON.stringify(expected)) {
            throw new Error(`Expected data ${JSON.stringify(expected)} but got ${JSON.stringify(this.message.data)}`);
        }
        return this;
    }

    /**
     * Assert data has property
     */
    dataHas(property: string): WsSingleMessageAssert {
        if (!(property in this.message.data)) {
            throw new Error(`Expected data to have property '${property}'`);
        }
        return this;
    }

    /**
     * Assert data property value
     */
    dataProperty(property: string, expected: any): WsSingleMessageAssert {
        if (this.message.data[property] !== expected) {
            throw new Error(`Expected data.${property} to be ${expected} but got ${this.message.data[property]}`);
        }
        return this;
    }

    /**
     * Get the message
     */
    getMessage(): IWsMessage {
        return this.message;
    }
}

/**
 * Create assertion helper for sent messages
 */
export function assertSentMessages(client: WsTestingClient): WsMessageAssert {
    return new WsMessageAssert(client.getSentMessages());
}

/**
 * Create assertion helper for received messages
 */
export function assertReceivedMessages(client: WsTestingClient): WsMessageAssert {
    return new WsMessageAssert(client.getReceivedMessages());
}
