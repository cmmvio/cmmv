import { vi, SpyInstance } from 'vitest';

/**
 * Spy configuration options
 */
export interface ISpyOptions {
    /** Whether the spy should call through to the original implementation */
    callThrough?: boolean;
    /** Return value for the spy */
    returnValue?: any;
    /** Implementation function to use instead */
    implementation?: (...args: any[]) => any;
}

/**
 * Stub configuration options
 */
export interface IStubOptions<T = any> {
    /** Value to return */
    value?: T;
    /** Values to return sequentially */
    values?: T[];
    /** Resolved promise value */
    resolves?: T;
    /** Rejected promise value */
    rejects?: any;
    /** Implementation function */
    implementation?: (...args: any[]) => T;
    /** Throw an error */
    throws?: Error | string;
}

/**
 * Call tracking information
 */
export interface ICallInfo {
    /** Arguments passed to the call */
    args: any[];
    /** Result returned from the call */
    result?: any;
    /** Error thrown during the call */
    error?: any;
    /** Timestamp of the call */
    timestamp: number;
    /** Call order (0-indexed) */
    callOrder: number;
}

/**
 * Enhanced spy wrapper that provides additional utilities
 */
export class SpyWrapper<
    T extends (...args: any[]) => any = (...args: any[]) => any,
> {
    private _calls: ICallInfo[] = [];
    private _callOrder: number = 0;

    constructor(
        public readonly spy: SpyInstance,
        public readonly originalFn?: T,
    ) {}

    /**
     * Get number of times the spy was called
     */
    get callCount(): number {
        return this.spy.mock.calls.length;
    }

    /**
     * Get all call arguments
     */
    get calls(): any[][] {
        return this.spy.mock.calls;
    }

    /**
     * Get all return values
     */
    get returnValues(): any[] {
        return this.spy.mock.results.map((r) => r.value);
    }

    /**
     * Check if spy was called
     */
    get called(): boolean {
        return this.callCount > 0;
    }

    /**
     * Check if spy was called exactly once
     */
    get calledOnce(): boolean {
        return this.callCount === 1;
    }

    /**
     * Check if spy was called exactly twice
     */
    get calledTwice(): boolean {
        return this.callCount === 2;
    }

    /**
     * Check if spy was called exactly three times
     */
    get calledThrice(): boolean {
        return this.callCount === 3;
    }

    /**
     * Get the first call arguments
     */
    get firstCall(): any[] | undefined {
        return this.calls[0];
    }

    /**
     * Get the last call arguments
     */
    get lastCall(): any[] | undefined {
        return this.calls[this.calls.length - 1];
    }

    /**
     * Get arguments from a specific call
     */
    getCall(index: number): any[] | undefined {
        return this.calls[index];
    }

    /**
     * Check if spy was called with specific arguments
     */
    calledWith(...args: any[]): boolean {
        return this.calls.some((call) =>
            args.every((arg, i) => this.deepEqual(arg, call[i])),
        );
    }

    /**
     * Check if spy was called with specific arguments exactly
     */
    calledWithExactly(...args: any[]): boolean {
        return this.calls.some(
            (call) =>
                call.length === args.length &&
                args.every((arg, i) => this.deepEqual(arg, call[i])),
        );
    }

    /**
     * Check if first call had specific arguments
     */
    firstCalledWith(...args: any[]): boolean {
        if (!this.firstCall) return false;
        return args.every((arg, i) => this.deepEqual(arg, this.firstCall![i]));
    }

    /**
     * Check if last call had specific arguments
     */
    lastCalledWith(...args: any[]): boolean {
        if (!this.lastCall) return false;
        return args.every((arg, i) => this.deepEqual(arg, this.lastCall![i]));
    }

    /**
     * Get nth call return value
     */
    nthReturnValue(n: number): any {
        return this.returns[n];
    }

    /**
     * Reset the spy
     */
    reset(): void {
        this.spy.mockReset();
        this._calls = [];
        this._callOrder = 0;
    }

    /**
     * Clear the spy (only calls, not implementation)
     */
    clear(): void {
        this.spy.mockClear();
        this._calls = [];
        this._callOrder = 0;
    }

    /**
     * Restore the original function
     */
    restore(): void {
        this.spy.mockRestore();
    }

    /**
     * Set return value
     */
    returns(value: any): SpyWrapper<T> {
        this.spy.mockReturnValue(value);
        return this;
    }

    /**
     * Set return value once
     */
    returnsOnce(value: any): SpyWrapper<T> {
        this.spy.mockReturnValueOnce(value);
        return this;
    }

    /**
     * Set resolved value
     */
    resolves(value: any): SpyWrapper<T> {
        this.spy.mockResolvedValue(value);
        return this;
    }

    /**
     * Set resolved value once
     */
    resolvesOnce(value: any): SpyWrapper<T> {
        this.spy.mockResolvedValueOnce(value);
        return this;
    }

    /**
     * Set rejected value
     */
    rejects(value: any): SpyWrapper<T> {
        this.spy.mockRejectedValue(value);
        return this;
    }

    /**
     * Set rejected value once
     */
    rejectsOnce(value: any): SpyWrapper<T> {
        this.spy.mockRejectedValueOnce(value);
        return this;
    }

    /**
     * Set implementation
     */
    implementation(fn: (...args: any[]) => any): SpyWrapper<T> {
        this.spy.mockImplementation(fn);
        return this;
    }

    /**
     * Set implementation once
     */
    implementationOnce(fn: (...args: any[]) => any): SpyWrapper<T> {
        this.spy.mockImplementationOnce(fn);
        return this;
    }

    /**
     * Make spy throw
     */
    throws(error: Error | string): SpyWrapper<T> {
        this.spy.mockImplementation(() => {
            throw typeof error === 'string' ? new Error(error) : error;
        });
        return this;
    }

    /**
     * Make spy throw once
     */
    throwsOnce(error: Error | string): SpyWrapper<T> {
        this.spy.mockImplementationOnce(() => {
            throw typeof error === 'string' ? new Error(error) : error;
        });
        return this;
    }

    private deepEqual(a: any, b: any): boolean {
        if (a === b) return true;
        if (typeof a !== typeof b) return false;
        if (typeof a !== 'object' || a === null || b === null) return false;
        const keysA = Object.keys(a);
        const keysB = Object.keys(b);
        if (keysA.length !== keysB.length) return false;
        return keysA.every((key) => this.deepEqual(a[key], b[key]));
    }
}

/**
 * Create a spy for a standalone function
 */
export function createSpy<T extends (...args: any[]) => any>(
    implementation?: T,
): SpyWrapper<T> {
    const spy = implementation ? vi.fn(implementation) : vi.fn();
    return new SpyWrapper<T>(spy as SpyInstance, implementation);
}

/**
 * Create a spy on an object method
 */
export function spyOn<T, K extends keyof T>(
    object: T,
    method: K,
    options: ISpyOptions = {},
): SpyWrapper {
    const spy = vi.spyOn(object, method as any);

    if (options.implementation) {
        spy.mockImplementation(options.implementation);
    } else if (options.returnValue !== undefined) {
        spy.mockReturnValue(options.returnValue);
    }

    return new SpyWrapper(spy);
}

/**
 * Create a stub with specified behavior
 */
export function createStub<T = any>(options: IStubOptions<T> = {}): SpyWrapper {
    const spy = vi.fn();

    if (options.implementation) {
        spy.mockImplementation(options.implementation);
    } else if (options.throws) {
        spy.mockImplementation(() => {
            throw typeof options.throws === 'string'
                ? new Error(options.throws)
                : options.throws;
        });
    } else if (options.rejects !== undefined) {
        spy.mockRejectedValue(options.rejects);
    } else if (options.resolves !== undefined) {
        spy.mockResolvedValue(options.resolves);
    } else if (options.values && options.values.length > 0) {
        // Return values sequentially
        let callIndex = 0;
        spy.mockImplementation(() => {
            const value =
                options.values![
                    Math.min(callIndex, options.values!.length - 1)
                ];
            callIndex++;
            return value;
        });
    } else if (options.value !== undefined) {
        spy.mockReturnValue(options.value);
    }

    return new SpyWrapper(spy as SpyInstance);
}

/**
 * Create a stub object with multiple methods
 */
export function createStubObject<T extends Record<string, any>>(methods: {
    [K in keyof T]?: IStubOptions<ReturnType<T[K]>>;
}): { [K in keyof T]: SpyWrapper } {
    const stub: any = {};

    for (const [method, options] of Object.entries(methods)) {
        stub[method] = createStub(options || {});
    }

    return stub;
}

/**
 * Create a partial mock of an object
 */
export function createPartialMock<T extends object>(
    original: T,
    overrides: Partial<{ [K in keyof T]: IStubOptions }> = {},
): T {
    const mock: any = {};

    for (const key of Object.keys(original) as (keyof T)[]) {
        const value = original[key];

        if (typeof value === 'function') {
            if (overrides[key]) {
                mock[key] = createStub(overrides[key]!).spy;
            } else {
                mock[key] = vi.fn().mockImplementation(value.bind(original));
            }
        } else {
            mock[key] = value;
        }
    }

    return mock as T;
}

/**
 * Verify that a spy was called with expected arguments
 */
export function verifySpy(spy: SpyWrapper): ISpyVerifier {
    return new SpyVerifier(spy);
}

/**
 * Interface for spy verification
 */
export interface ISpyVerifier {
    /** Verify spy was called */
    wasCalled(): ISpyVerifier;
    /** Verify spy was called n times */
    wasCalledTimes(n: number): ISpyVerifier;
    /** Verify spy was called with specific arguments */
    wasCalledWith(...args: any[]): ISpyVerifier;
    /** Verify spy was never called */
    wasNotCalled(): ISpyVerifier;
    /** Verify first call arguments */
    firstCallWas(...args: any[]): ISpyVerifier;
    /** Verify last call arguments */
    lastCallWas(...args: any[]): ISpyVerifier;
    /** Verify nth call arguments */
    nthCallWas(n: number, ...args: any[]): ISpyVerifier;
}

/**
 * Spy verifier implementation
 */
class SpyVerifier implements ISpyVerifier {
    constructor(private spy: SpyWrapper) {}

    wasCalled(): ISpyVerifier {
        if (!this.spy.called) {
            throw new Error(
                'Expected spy to be called but it was never called',
            );
        }
        return this;
    }

    wasCalledTimes(n: number): ISpyVerifier {
        if (this.spy.callCount !== n) {
            throw new Error(
                `Expected spy to be called ${n} times but it was called ${this.spy.callCount} times`,
            );
        }
        return this;
    }

    wasCalledWith(...args: any[]): ISpyVerifier {
        if (!this.spy.calledWith(...args)) {
            throw new Error(
                `Expected spy to be called with ${JSON.stringify(args)} but it was called with ${JSON.stringify(this.spy.calls)}`,
            );
        }
        return this;
    }

    wasNotCalled(): ISpyVerifier {
        if (this.spy.called) {
            throw new Error(
                `Expected spy not to be called but it was called ${this.spy.callCount} times`,
            );
        }
        return this;
    }

    firstCallWas(...args: any[]): ISpyVerifier {
        if (!this.spy.firstCalledWith(...args)) {
            throw new Error(
                `Expected first call to be with ${JSON.stringify(args)} but it was ${JSON.stringify(this.spy.firstCall)}`,
            );
        }
        return this;
    }

    lastCallWas(...args: any[]): ISpyVerifier {
        if (!this.spy.lastCalledWith(...args)) {
            throw new Error(
                `Expected last call to be with ${JSON.stringify(args)} but it was ${JSON.stringify(this.spy.lastCall)}`,
            );
        }
        return this;
    }

    nthCallWas(n: number, ...args: any[]): ISpyVerifier {
        const call = this.spy.getCall(n);
        if (!call) {
            throw new Error(
                `Expected call ${n} to exist but spy was only called ${this.spy.callCount} times`,
            );
        }
        const matches = args.every((arg, i) => {
            const actual = call[i];
            return JSON.stringify(arg) === JSON.stringify(actual);
        });
        if (!matches) {
            throw new Error(
                `Expected call ${n} to be with ${JSON.stringify(args)} but it was ${JSON.stringify(call)}`,
            );
        }
        return this;
    }
}

/**
 * Reset all spies in an array
 */
export function resetAllSpies(...spies: SpyWrapper[]): void {
    for (const spy of spies) {
        spy.reset();
    }
}

/**
 * Clear all spies in an array (keeps implementations)
 */
export function clearAllSpies(...spies: SpyWrapper[]): void {
    for (const spy of spies) {
        spy.clear();
    }
}

/**
 * Restore all spies to original implementations
 */
export function restoreAllSpies(...spies: SpyWrapper[]): void {
    for (const spy of spies) {
        spy.restore();
    }
}

/**
 * Time-related test utilities
 */
export const fakeTimers = {
    /**
     * Use fake timers
     */
    useFake(): void {
        vi.useFakeTimers();
    },

    /**
     * Restore real timers
     */
    useReal(): void {
        vi.useRealTimers();
    },

    /**
     * Advance time by specified milliseconds
     */
    advance(ms: number): void {
        vi.advanceTimersByTime(ms);
    },

    /**
     * Run all pending timers
     */
    runAll(): void {
        vi.runAllTimers();
    },

    /**
     * Run only pending timers
     */
    runPending(): void {
        vi.runOnlyPendingTimers();
    },

    /**
     * Set system time
     */
    setTime(date: Date | number | string): void {
        vi.setSystemTime(date);
    },

    /**
     * Get mocked date
     */
    getMockedTime(): Date {
        return new Date();
    },
};
