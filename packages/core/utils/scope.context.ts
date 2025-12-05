import { AsyncLocalStorage } from 'node:async_hooks';
import { AppRegistry } from '../registries/app.registry';

/**
 * Context data stored in AsyncLocalStorage
 */
export interface IScopeContextData {
    /**
     * The current scope ID
     */
    scopeId: string;

    /**
     * Additional context metadata
     */
    metadata?: Record<string, any>;
}

/**
 * ScopeContext provides AsyncLocalStorage-based context isolation
 * for multi-agent and request-scoped applications.
 */
export class ScopeContext {
    private static storage = new AsyncLocalStorage<IScopeContextData>();

    /**
     * Get the current scope ID from context
     * @returns The current scope ID or undefined if not in a scope
     */
    public static getCurrentScopeId(): string | undefined {
        const context = ScopeContext.storage.getStore();
        return context?.scopeId;
    }

    /**
     * Get the current context data
     * @returns The context data or undefined
     */
    public static getContext(): IScopeContextData | undefined {
        return ScopeContext.storage.getStore();
    }

    /**
     * Check if currently running within a scope context
     * @returns True if in a scope context
     */
    public static isInScope(): boolean {
        return ScopeContext.storage.getStore() !== undefined;
    }

    /**
     * Run a function within a specific scope context
     * @param scopeId - The scope ID to run within
     * @param fn - The function to execute
     * @param metadata - Optional additional metadata
     * @returns The result of the function
     */
    public static run<T>(
        scopeId: string,
        fn: () => T,
        metadata?: Record<string, any>,
    ): T {
        const context: IScopeContextData = {
            scopeId,
            metadata,
        };
        return ScopeContext.storage.run(context, fn);
    }

    /**
     * Run an async function within a specific scope context
     * @param scopeId - The scope ID to run within
     * @param fn - The async function to execute
     * @param metadata - Optional additional metadata
     * @returns Promise with the result of the function
     */
    public static async runAsync<T>(
        scopeId: string,
        fn: () => Promise<T>,
        metadata?: Record<string, any>,
    ): Promise<T> {
        const context: IScopeContextData = {
            scopeId,
            metadata,
        };
        return ScopeContext.storage.run(context, fn);
    }

    /**
     * Get the current Application instance for the active scope
     * Falls back to singleton if not in a scope context
     * @returns The Application instance
     */
    public static getCurrentApplication(): any {
        const scopeId = ScopeContext.getCurrentScopeId();

        if (scopeId) {
            const app = AppRegistry.get(scopeId);
            if (app) return app;
        }

        // Fallback to singleton for backward compatibility
        return AppRegistry.getSingleton();
    }

    /**
     * Set metadata on the current context
     * @param key - The metadata key
     * @param value - The metadata value
     */
    public static setMetadata(key: string, value: any): void {
        const context = ScopeContext.storage.getStore();
        if (context) {
            if (!context.metadata) {
                context.metadata = {};
            }
            context.metadata[key] = value;
        }
    }

    /**
     * Get metadata from the current context
     * @param key - The metadata key
     * @returns The metadata value or undefined
     */
    public static getMetadata<T = any>(key: string): T | undefined {
        const context = ScopeContext.storage.getStore();
        return context?.metadata?.[key];
    }
}

/**
 * Helper function to run code within a specific application scope
 * @param scopeId - The scope ID to run within
 * @param callback - The async callback to execute
 * @param metadata - Optional additional metadata
 * @returns Promise with the result of the callback
 * @example
 * ```typescript
 * await runWithApplicationScope('indexer-agent', async () => {
 *     const app = Application.current();
 *     // All code here uses the 'indexer-agent' scope
 * });
 * ```
 */
export async function runWithApplicationScope<T>(
    scopeId: string,
    callback: () => Promise<T>,
    metadata?: Record<string, any>,
): Promise<T> {
    if (!AppRegistry.has(scopeId)) {
        throw new Error(
            `Application scope '${scopeId}' not found. Create it first using ApplicationFactory.create().`,
        );
    }

    return ScopeContext.runAsync(scopeId, callback, metadata);
}

/**
 * Synchronous helper to run code within a specific application scope
 * @param scopeId - The scope ID to run within
 * @param callback - The callback to execute
 * @param metadata - Optional additional metadata
 * @returns The result of the callback
 */
export function runWithApplicationScopeSync<T>(
    scopeId: string,
    callback: () => T,
    metadata?: Record<string, any>,
): T {
    if (!AppRegistry.has(scopeId)) {
        throw new Error(
            `Application scope '${scopeId}' not found. Create it first using ApplicationFactory.create().`,
        );
    }

    return ScopeContext.run(scopeId, callback, metadata);
}

/**
 * Decorator to run a method within a specific application scope
 * @param scopeId - The scope ID to run within
 * @returns Method decorator
 * @example
 * ```typescript
 * class MyService {
 *     @WithScope('indexer-agent')
 *     async processData() {
 *         // Runs within 'indexer-agent' scope
 *     }
 * }
 * ```
 */
export function WithScope(scopeId: string): MethodDecorator {
    return function (
        target: any,
        propertyKey: string | symbol,
        descriptor: PropertyDescriptor,
    ) {
        const originalMethod = descriptor.value;

        descriptor.value = async function (...args: any[]) {
            return runWithApplicationScope(scopeId, async () => {
                return originalMethod.apply(this, args);
            });
        };

        return descriptor;
    };
}
