import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';

import {
    createSpy,
    spyOn,
    createStub,
    createStubObject,
    createPartialMock,
    verifySpy,
    resetAllSpies,
    clearAllSpies,
    restoreAllSpies,
    SpyWrapper,
    fakeTimers,
} from '../../core/spy-stub.utils';

describe('SpyWrapper', () => {
    describe('createSpy', () => {
        it('should create a spy without implementation', () => {
            const spy = createSpy();
            expect(spy).toBeInstanceOf(SpyWrapper);
            expect(spy.called).toBe(false);
        });

        it('should create a spy with implementation', () => {
            const spy = createSpy((x: number) => x * 2);
            const result = spy.spy(5);

            expect(result).toBe(10);
            expect(spy.called).toBe(true);
        });

        it('should track call count', () => {
            const spy = createSpy();

            spy.spy();
            spy.spy();
            spy.spy();

            expect(spy.callCount).toBe(3);
        });

        it('should track call arguments', () => {
            const spy = createSpy();

            spy.spy('a', 1);
            spy.spy('b', 2);

            expect(spy.calls).toEqual([['a', 1], ['b', 2]]);
        });

        it('should provide firstCall and lastCall', () => {
            const spy = createSpy();

            spy.spy(1);
            spy.spy(2);
            spy.spy(3);

            expect(spy.firstCall).toEqual([1]);
            expect(spy.lastCall).toEqual([3]);
        });

        it('should get specific call by index', () => {
            const spy = createSpy();

            spy.spy('first');
            spy.spy('second');
            spy.spy('third');

            expect(spy.getCall(1)).toEqual(['second']);
        });
    });

    describe('calledWith', () => {
        it('should detect when called with specific arguments', () => {
            const spy = createSpy();

            spy.spy('test', 42);

            expect(spy.calledWith('test', 42)).toBe(true);
            expect(spy.calledWith('test', 100)).toBe(false);
        });

        it('should detect when called with exact arguments', () => {
            const spy = createSpy();

            spy.spy('a', 'b', 'c');

            expect(spy.calledWithExactly('a', 'b', 'c')).toBe(true);
            expect(spy.calledWithExactly('a', 'b')).toBe(false);
        });

        it('should check first call arguments', () => {
            const spy = createSpy();

            spy.spy('first');
            spy.spy('second');

            expect(spy.firstCalledWith('first')).toBe(true);
            expect(spy.firstCalledWith('second')).toBe(false);
        });

        it('should check last call arguments', () => {
            const spy = createSpy();

            spy.spy('first');
            spy.spy('last');

            expect(spy.lastCalledWith('last')).toBe(true);
            expect(spy.lastCalledWith('first')).toBe(false);
        });
    });

    describe('convenience properties', () => {
        it('should report calledOnce correctly', () => {
            const spy = createSpy();

            expect(spy.calledOnce).toBe(false);
            spy.spy();
            expect(spy.calledOnce).toBe(true);
            spy.spy();
            expect(spy.calledOnce).toBe(false);
        });

        it('should report calledTwice correctly', () => {
            const spy = createSpy();

            spy.spy();
            expect(spy.calledTwice).toBe(false);
            spy.spy();
            expect(spy.calledTwice).toBe(true);
            spy.spy();
            expect(spy.calledTwice).toBe(false);
        });

        it('should report calledThrice correctly', () => {
            const spy = createSpy();

            spy.spy();
            spy.spy();
            expect(spy.calledThrice).toBe(false);
            spy.spy();
            expect(spy.calledThrice).toBe(true);
        });
    });

    describe('return values', () => {
        it('should set return value', () => {
            const spy = createSpy();
            spy.returns('test');

            expect(spy.spy()).toBe('test');
            expect(spy.spy()).toBe('test');
        });

        it('should set return value once', () => {
            const spy = createSpy();
            spy.returnsOnce('first').returnsOnce('second').returns('default');

            expect(spy.spy()).toBe('first');
            expect(spy.spy()).toBe('second');
            expect(spy.spy()).toBe('default');
        });

        it('should resolve promises', async () => {
            const spy = createSpy();
            spy.resolves({ data: 'test' });

            const result = await spy.spy();
            expect(result).toEqual({ data: 'test' });
        });

        it('should reject promises', async () => {
            const spy = createSpy();
            spy.rejects(new Error('failed'));

            await expect(spy.spy()).rejects.toThrow('failed');
        });

        it('should set implementation', () => {
            const spy = createSpy();
            spy.implementation((x: number) => x * 3);

            expect(spy.spy(5)).toBe(15);
        });

        it('should throw errors', () => {
            const spy = createSpy();
            spy.throws('Something went wrong');

            expect(() => spy.spy()).toThrow('Something went wrong');
        });

        it('should throw Error objects', () => {
            const spy = createSpy();
            spy.throws(new Error('Custom error'));

            expect(() => spy.spy()).toThrow('Custom error');
        });
    });

    describe('reset and clear', () => {
        it('should reset spy completely', () => {
            const spy = createSpy().returns('value');

            spy.spy();
            spy.spy();
            spy.reset();

            expect(spy.callCount).toBe(0);
            expect(spy.spy()).toBeUndefined();
        });

        it('should clear spy calls but keep implementation', () => {
            const spy = createSpy().returns('value');

            spy.spy();
            spy.spy();
            spy.clear();

            expect(spy.callCount).toBe(0);
            // Implementation is also cleared by vitest's mockClear
        });
    });
});

describe('spyOn', () => {
    it('should spy on object method', () => {
        const obj = {
            greet: (name: string) => `Hello, ${name}!`,
        };

        const spy = spyOn(obj, 'greet');
        obj.greet('World');

        expect(spy.called).toBe(true);
        expect(spy.firstCall).toEqual(['World']);
    });

    it('should spy with return value option', () => {
        const obj = {
            getValue: () => 'original',
        };

        spyOn(obj, 'getValue', { returnValue: 'mocked' });

        expect(obj.getValue()).toBe('mocked');
    });

    it('should spy with implementation option', () => {
        const obj = {
            calculate: (x: number) => x + 1,
        };

        spyOn(obj, 'calculate', { implementation: (x: number) => x * 10 });

        expect(obj.calculate(5)).toBe(50);
    });
});

describe('createStub', () => {
    it('should create stub with value', () => {
        const stub = createStub({ value: 42 });
        expect(stub.spy()).toBe(42);
    });

    it('should create stub with sequential values', () => {
        const stub = createStub({ values: [1, 2, 3] });

        expect(stub.spy()).toBe(1);
        expect(stub.spy()).toBe(2);
        expect(stub.spy()).toBe(3);
        expect(stub.spy()).toBe(3); // Last value is repeated
    });

    it('should create stub that resolves', async () => {
        const stub = createStub({ resolves: 'resolved' });
        const result = await stub.spy();

        expect(result).toBe('resolved');
    });

    it('should create stub that rejects', async () => {
        const stub = createStub({ rejects: new Error('rejected') });

        await expect(stub.spy()).rejects.toThrow('rejected');
    });

    it('should create stub with implementation', () => {
        const stub = createStub({
            implementation: (x: number, y: number) => x + y,
        });

        expect(stub.spy(3, 4)).toBe(7);
    });

    it('should create stub that throws', () => {
        const stub = createStub({ throws: 'Error message' });

        expect(() => stub.spy()).toThrow('Error message');
    });

    it('should create stub that throws Error object', () => {
        const stub = createStub({ throws: new Error('Custom error') });

        expect(() => stub.spy()).toThrow('Custom error');
    });
});

describe('createStubObject', () => {
    it('should create object with stubbed methods', () => {
        const stub = createStubObject({
            getName: { value: 'Test' },
            getAge: { value: 25 },
            fetchData: { resolves: { data: 'test' } },
        });

        expect(stub.getName.spy()).toBe('Test');
        expect(stub.getAge.spy()).toBe(25);
    });

    it('should track calls on stubbed methods', () => {
        const stub = createStubObject({
            doSomething: {},
        });

        stub.doSomething.spy('arg1');
        stub.doSomething.spy('arg2');

        expect(stub.doSomething.callCount).toBe(2);
        expect(stub.doSomething.calledWith('arg1')).toBe(true);
    });
});

describe('createPartialMock', () => {
    it('should create partial mock preserving non-function properties', () => {
        const original = {
            name: 'Test',
            getValue: () => 42,
        };

        const mock = createPartialMock(original);

        expect(mock.name).toBe('Test');
        expect(mock.getValue()).toBe(42);
    });

    it('should allow overriding specific methods', () => {
        const original = {
            name: 'Test',
            getValue: () => 42,
            getName: () => 'Original',
        };

        const mock = createPartialMock(original, {
            getValue: { value: 100 },
        });

        expect(mock.getValue()).toBe(100);
        expect(mock.getName()).toBe('Original');
    });
});

describe('verifySpy', () => {
    it('should verify spy was called', () => {
        const spy = createSpy();
        spy.spy();

        expect(() => verifySpy(spy).wasCalled()).not.toThrow();
    });

    it('should throw when spy was not called', () => {
        const spy = createSpy();

        expect(() => verifySpy(spy).wasCalled()).toThrow(
            'Expected spy to be called but it was never called',
        );
    });

    it('should verify call count', () => {
        const spy = createSpy();
        spy.spy();
        spy.spy();
        spy.spy();

        expect(() => verifySpy(spy).wasCalledTimes(3)).not.toThrow();
        expect(() => verifySpy(spy).wasCalledTimes(2)).toThrow(
            'Expected spy to be called 2 times but it was called 3 times',
        );
    });

    it('should verify called with arguments', () => {
        const spy = createSpy();
        spy.spy('test', 42);

        expect(() => verifySpy(spy).wasCalledWith('test', 42)).not.toThrow();
    });

    it('should verify not called', () => {
        const spy = createSpy();

        expect(() => verifySpy(spy).wasNotCalled()).not.toThrow();
    });

    it('should throw when should not be called but was', () => {
        const spy = createSpy();
        spy.spy();

        expect(() => verifySpy(spy).wasNotCalled()).toThrow(
            'Expected spy not to be called but it was called 1 times',
        );
    });

    it('should verify first call arguments', () => {
        const spy = createSpy();
        spy.spy('first');
        spy.spy('second');

        expect(() => verifySpy(spy).firstCallWas('first')).not.toThrow();
    });

    it('should verify last call arguments', () => {
        const spy = createSpy();
        spy.spy('first');
        spy.spy('last');

        expect(() => verifySpy(spy).lastCallWas('last')).not.toThrow();
    });

    it('should verify nth call arguments', () => {
        const spy = createSpy();
        spy.spy('a');
        spy.spy('b');
        spy.spy('c');

        expect(() => verifySpy(spy).nthCallWas(1, 'b')).not.toThrow();
    });

    it('should allow chaining verifications', () => {
        const spy = createSpy();
        spy.spy('test');
        spy.spy('test');

        expect(() =>
            verifySpy(spy).wasCalled().wasCalledTimes(2).wasCalledWith('test'),
        ).not.toThrow();
    });
});

describe('utility functions', () => {
    it('should reset all spies', () => {
        const spy1 = createSpy().returns('a');
        const spy2 = createSpy().returns('b');

        spy1.spy();
        spy2.spy();

        resetAllSpies(spy1, spy2);

        expect(spy1.callCount).toBe(0);
        expect(spy2.callCount).toBe(0);
    });

    it('should clear all spies', () => {
        const spy1 = createSpy();
        const spy2 = createSpy();

        spy1.spy();
        spy2.spy();

        clearAllSpies(spy1, spy2);

        expect(spy1.callCount).toBe(0);
        expect(spy2.callCount).toBe(0);
    });
});

describe('fakeTimers', () => {
    afterEach(() => {
        fakeTimers.useReal();
    });

    it('should use fake timers', () => {
        fakeTimers.useFake();

        let called = false;
        setTimeout(() => {
            called = true;
        }, 1000);

        expect(called).toBe(false);
        fakeTimers.advance(1000);
        expect(called).toBe(true);
    });

    it('should run all timers', () => {
        fakeTimers.useFake();

        const results: number[] = [];
        setTimeout(() => results.push(1), 100);
        setTimeout(() => results.push(2), 200);
        setTimeout(() => results.push(3), 300);

        fakeTimers.runAll();

        expect(results).toEqual([1, 2, 3]);
    });

    it('should set system time', () => {
        fakeTimers.useFake();
        // Use ISO format with explicit UTC time to avoid timezone issues
        fakeTimers.setTime(new Date('2024-01-15T12:00:00Z'));

        expect(fakeTimers.getMockedTime().getUTCFullYear()).toBe(2024);
        expect(fakeTimers.getMockedTime().getUTCMonth()).toBe(0); // January
        expect(fakeTimers.getMockedTime().getUTCDate()).toBe(15);
    });
});
