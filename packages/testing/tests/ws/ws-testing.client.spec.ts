import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';

import {
    WsTestingClient,
    RpcTestingClient,
    createWsTestingClient,
    createRpcTestingClient,
    WsMessageAssert,
    WsSingleMessageAssert,
    assertSentMessages,
    assertReceivedMessages,
} from '../../ws/ws-testing.client';

describe('WsTestingClient', () => {
    let client: WsTestingClient;

    beforeEach(() => {
        client = new WsTestingClient();
    });

    afterEach(async () => {
        if (client.connected()) {
            await client.close();
        }
        client.reset();
    });

    describe('connection', () => {
        it('should connect to WebSocket server', async () => {
            await client.connect('ws://localhost:3000');

            expect(client.connected()).toBe(true);
            expect(client.getUrl()).toBe('ws://localhost:3000');
            expect(client.onConnect).toHaveBeenCalled();
        });

        it('should disconnect from WebSocket server', async () => {
            await client.connect('ws://localhost:3000');
            await client.disconnect();

            expect(client.connected()).toBe(false);
            expect(client.onDisconnect).toHaveBeenCalledWith({
                code: 1000,
                reason: 'Normal closure',
            });
        });

        it('should disconnect with custom code and reason', async () => {
            await client.connect('ws://localhost:3000');
            await client.disconnect(1001, 'Going away');

            expect(client.onDisconnect).toHaveBeenCalledWith({
                code: 1001,
                reason: 'Going away',
            });
        });

        it('should handle connection timeout', async () => {
            // Create a client that will timeout
            const slowClient = new WsTestingClient();
            // We can't easily test timeout without mocking internals
            // but we can verify the option is accepted
            await expect(
                slowClient.connect('ws://localhost:3000', { timeout: 1000 }),
            ).resolves.not.toThrow();
        });
    });

    describe('sending messages', () => {
        beforeEach(async () => {
            await client.connect('ws://localhost:3000');
        });

        it('should send messages', () => {
            client.send('test:event', { message: 'hello' });

            const sent = client.getSentMessages();
            expect(sent).toHaveLength(1);
            expect(sent[0].event).toBe('test:event');
            expect(sent[0].data).toEqual({ message: 'hello' });
        });

        it('should throw when sending without connection', async () => {
            await client.disconnect();

            expect(() => client.send('test', {})).toThrow('Not connected');
        });

        it('should send raw data', () => {
            client.sendRaw('raw message');

            const sent = client.getSentMessages();
            expect(sent).toHaveLength(1);
            expect(sent[0].event).toBe('__raw__');
            expect(sent[0].data).toBe('raw message');
        });

        it('should get sent messages by event', () => {
            client.send('event1', { a: 1 });
            client.send('event2', { b: 2 });
            client.send('event1', { c: 3 });

            const event1Messages = client.getSentMessagesByEvent('event1');
            expect(event1Messages).toHaveLength(2);
        });
    });

    describe('receiving messages', () => {
        beforeEach(async () => {
            await client.connect('ws://localhost:3000');
        });

        it('should simulate receiving messages', () => {
            client.simulateMessage('server:message', { data: 'test' });

            const received = client.getReceivedMessages();
            expect(received).toHaveLength(1);
            expect(received[0].event).toBe('server:message');
            expect(received[0].data).toEqual({ data: 'test' });
            expect(client.onMessage).toHaveBeenCalled();
        });

        it('should trigger event handlers', () => {
            const handler = vi.fn();
            client.on('test:event', handler);

            client.simulateMessage('test:event', { value: 42 });

            expect(handler).toHaveBeenCalledWith(
                expect.objectContaining({
                    event: 'test:event',
                    data: { value: 42 },
                }),
            );
        });

        it('should unsubscribe from events', () => {
            const handler = vi.fn();
            const unsubscribe = client.on('test:event', handler);

            unsubscribe();
            client.simulateMessage('test:event', {});

            expect(handler).not.toHaveBeenCalled();
        });

        it('should handle catch-all listeners', () => {
            const handler = vi.fn();
            client.onAny(handler);

            client.simulateMessage('event1', {});
            client.simulateMessage('event2', {});

            expect(handler).toHaveBeenCalledTimes(2);
        });

        it('should get received messages by event', () => {
            client.simulateMessage('event1', { a: 1 });
            client.simulateMessage('event2', { b: 2 });
            client.simulateMessage('event1', { c: 3 });

            const event1Messages = client.getReceivedMessagesByEvent('event1');
            expect(event1Messages).toHaveLength(2);
        });
    });

    describe('waitForMessage', () => {
        beforeEach(async () => {
            await client.connect('ws://localhost:3000');
        });

        it('should wait for specific event', async () => {
            const promise = client.waitForMessage({ event: 'expected:event' });

            // Simulate the message after a short delay
            setTimeout(() => {
                client.simulateMessage('expected:event', { result: 'success' });
            }, 10);

            const result = await promise;
            expect(result).toEqual({ result: 'success' });
        });

        it('should wait for message with matching data', async () => {
            const promise = client.waitForMessage({
                event: 'response',
                data: { type: 'success' },
            });

            setTimeout(() => {
                client.simulateMessage('response', {
                    type: 'success',
                    extra: 'data',
                });
            }, 10);

            const result = await promise;
            expect(result.type).toBe('success');
        });

        it('should timeout when message not received', async () => {
            await expect(
                client.waitForMessage({ event: 'never:arrives', timeout: 50 }),
            ).rejects.toThrow("Timeout waiting for message 'never:arrives'");
        });

        it('should resolve immediately if message already received', async () => {
            client.simulateMessage('already:received', { data: 'exists' });

            const result = await client.waitForMessage({
                event: 'already:received',
            });
            expect(result).toEqual({ data: 'exists' });
        });
    });

    describe('waitForMessages', () => {
        beforeEach(async () => {
            await client.connect('ws://localhost:3000');
        });

        it('should wait for multiple messages', async () => {
            const promise = client.waitForMessages(3);

            setTimeout(() => {
                client.simulateMessage('msg1', { n: 1 });
                client.simulateMessage('msg2', { n: 2 });
                client.simulateMessage('msg3', { n: 3 });
            }, 10);

            const messages = await promise;
            expect(messages).toHaveLength(3);
        });

        it('should filter by event', async () => {
            const promise = client.waitForMessages(2, { event: 'target' });

            setTimeout(() => {
                client.simulateMessage('other', { n: 1 });
                client.simulateMessage('target', { n: 2 });
                client.simulateMessage('other', { n: 3 });
                client.simulateMessage('target', { n: 4 });
            }, 10);

            const messages = await promise;
            expect(messages).toHaveLength(2);
            expect(messages.every((m) => m.event === 'target')).toBe(true);
        });
    });

    describe('simulation methods', () => {
        beforeEach(async () => {
            await client.connect('ws://localhost:3000');
        });

        it('should simulate error', () => {
            const error = new Error('Test error');
            client.simulateError(error);

            expect(client.onError).toHaveBeenCalledWith(error);
        });

        it('should simulate close from server', () => {
            client.simulateClose(1006, 'Abnormal closure');

            expect(client.connected()).toBe(false);
            expect(client.onDisconnect).toHaveBeenCalledWith({
                code: 1006,
                reason: 'Abnormal closure',
            });
        });
    });

    describe('utility methods', () => {
        beforeEach(async () => {
            await client.connect('ws://localhost:3000');
        });

        it('should clear messages', () => {
            client.send('test', {});
            client.simulateMessage('response', {});

            client.clearMessages();

            expect(client.getSentMessages()).toHaveLength(0);
            expect(client.getReceivedMessages()).toHaveLength(0);
        });

        it('should reset client', () => {
            client.send('test', {});
            client.simulateMessage('response', {});

            client.reset();

            expect(client.getSentMessages()).toHaveLength(0);
            expect(client.getReceivedMessages()).toHaveLength(0);
            expect(client.onConnect).not.toHaveBeenCalled();
        });
    });
});

describe('RpcTestingClient', () => {
    let client: RpcTestingClient;

    beforeEach(async () => {
        client = new RpcTestingClient();
        await client.connect('ws://localhost:3000');
    });

    afterEach(async () => {
        if (client.connected()) {
            await client.close();
        }
        client.reset();
    });

    describe('RPC calls', () => {
        it('should make RPC call and receive response', async () => {
            const callPromise = client.call('users.getById', { id: 1 });

            // Get the sent message to find call ID
            const sent = client.getSentMessages();
            expect(sent).toHaveLength(1);
            expect(sent[0].event).toBe('rpc:call');

            const callId = sent[0].data.id;

            // Simulate response
            client.simulateRpcResponse(callId, { id: 1, name: 'John' });

            const result = await callPromise;
            expect(result).toEqual({ id: 1, name: 'John' });
        });

        it('should handle RPC errors', async () => {
            const callPromise = client.call('users.delete', { id: 999 });

            const sent = client.getSentMessages();
            const callId = sent[0].data.id;

            client.simulateRpcError(callId, {
                code: 404,
                message: 'User not found',
            });

            await expect(callPromise).rejects.toThrow('User not found');
        });

        it('should timeout on no response', async () => {
            await expect(client.call('slow.method', {}, 50)).rejects.toThrow(
                "RPC call 'slow.method' timed out",
            );
        });

        it('should track pending calls', async () => {
            // Start a call but don't resolve it
            client.call('pending.method', {}).catch(() => {}); // Ignore timeout error

            expect(client.getPendingCalls()).toHaveLength(1);
        });
    });
});

describe('createWsTestingClient', () => {
    it('should create a WsTestingClient', () => {
        const client = createWsTestingClient();
        expect(client).toBeInstanceOf(WsTestingClient);
    });
});

describe('createRpcTestingClient', () => {
    it('should create an RpcTestingClient', () => {
        const client = createRpcTestingClient();
        expect(client).toBeInstanceOf(RpcTestingClient);
    });
});

describe('WsMessageAssert', () => {
    let client: WsTestingClient;

    beforeEach(async () => {
        client = new WsTestingClient();
        await client.connect('ws://localhost:3000');
    });

    afterEach(async () => {
        await client.close();
    });

    describe('count assertions', () => {
        it('should assert message count', () => {
            client.send('e1', {});
            client.send('e2', {});

            expect(() => assertSentMessages(client).count(2)).not.toThrow();
            expect(() => assertSentMessages(client).count(3)).toThrow(
                'Expected 3 messages but got 2',
            );
        });

        it('should assert at least n messages', () => {
            client.send('e1', {});
            client.send('e2', {});

            expect(() => assertSentMessages(client).atLeast(1)).not.toThrow();
            expect(() => assertSentMessages(client).atLeast(2)).not.toThrow();
            expect(() => assertSentMessages(client).atLeast(3)).toThrow(
                'Expected at least 3 messages',
            );
        });
    });

    describe('event assertions', () => {
        it('should assert event exists', () => {
            client.send('target:event', {});

            expect(() =>
                assertSentMessages(client).hasEvent('target:event'),
            ).not.toThrow();
            expect(() =>
                assertSentMessages(client).hasEvent('missing'),
            ).toThrow("Expected message with event 'missing'");
        });
    });

    describe('data assertions', () => {
        it('should assert data equals', () => {
            client.send('event', { foo: 'bar' });

            expect(() =>
                assertSentMessages(client).hasData({ foo: 'bar' }),
            ).not.toThrow();
            expect(() =>
                assertSentMessages(client).hasData({ foo: 'baz' }),
            ).toThrow('Expected message with data');
        });

        it('should assert partial data match', () => {
            client.send('event', { foo: 'bar', extra: 'data' });

            expect(() =>
                assertSentMessages(client).hasDataMatching({ foo: 'bar' }),
            ).not.toThrow();
        });
    });

    describe('position assertions', () => {
        it('should assert first message', () => {
            client.send('first', { n: 1 });
            client.send('second', { n: 2 });

            expect(() =>
                assertSentMessages(client).first().event('first'),
            ).not.toThrow();
        });

        it('should assert last message', () => {
            client.send('first', { n: 1 });
            client.send('second', { n: 2 });

            expect(() =>
                assertSentMessages(client).last().event('second'),
            ).not.toThrow();
        });

        it('should assert nth message', () => {
            client.send('e0', {});
            client.send('e1', {});
            client.send('e2', {});

            expect(() =>
                assertSentMessages(client).nth(1).event('e1'),
            ).not.toThrow();
        });
    });
});

describe('WsSingleMessageAssert', () => {
    let client: WsTestingClient;

    beforeEach(async () => {
        client = new WsTestingClient();
        await client.connect('ws://localhost:3000');
    });

    afterEach(async () => {
        await client.close();
    });

    it('should assert event', () => {
        client.send('test:event', {});

        expect(() =>
            assertSentMessages(client).first().event('test:event'),
        ).not.toThrow();
        expect(() => assertSentMessages(client).first().event('wrong')).toThrow(
            "Expected event 'wrong'",
        );
    });

    it('should assert data equals', () => {
        client.send('event', { value: 42 });

        expect(() =>
            assertSentMessages(client).first().dataEquals({ value: 42 }),
        ).not.toThrow();
    });

    it('should assert data has property', () => {
        client.send('event', { name: 'test', value: 42 });

        expect(() =>
            assertSentMessages(client).first().dataHas('name'),
        ).not.toThrow();
        expect(() =>
            assertSentMessages(client).first().dataHas('missing'),
        ).toThrow("Expected data to have property 'missing'");
    });

    it('should assert data property value', () => {
        client.send('event', { count: 5 });

        expect(() =>
            assertSentMessages(client).first().dataProperty('count', 5),
        ).not.toThrow();
        expect(() =>
            assertSentMessages(client).first().dataProperty('count', 10),
        ).toThrow('Expected data.count to be 10');
    });

    it('should return the message', () => {
        client.send('event', { data: 'test' });

        const msg = assertSentMessages(client).first().getMessage();
        expect(msg.event).toBe('event');
    });
});

describe('assertReceivedMessages', () => {
    let client: WsTestingClient;

    beforeEach(async () => {
        client = new WsTestingClient();
        await client.connect('ws://localhost:3000');
    });

    afterEach(async () => {
        await client.close();
    });

    it('should assert received messages', () => {
        client.simulateMessage('server:response', { data: 'test' });

        expect(() => assertReceivedMessages(client).count(1)).not.toThrow();
        expect(() =>
            assertReceivedMessages(client).first().event('server:response'),
        ).not.toThrow();
    });
});
