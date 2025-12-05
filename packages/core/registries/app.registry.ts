import {
    IScopedApplicationInfo,
    ApplicationScopeType,
} from '../interfaces/application-scope.interface';

/**
 * Registry entry for a scoped application instance
 */
interface AppRegistryEntry {
    /**
     * The application instance
     */
    instance: any;

    /**
     * Metadata about the scoped application
     */
    info: IScopedApplicationInfo;
}

/**
 * Simple console logger for AppRegistry to avoid circular dependencies
 */
const log = (message: string) => {
    if (process.env.NODE_ENV !== 'test') {
        console.log(
            `\x1b[32m[Server] -\x1b[0m \x1b[37m${new Date().toLocaleString()}\x1b[0m \x1b[32mLOG\x1b[0m \x1b[33m[AppRegistry]\x1b[0m \x1b[32m${message}\x1b[0m`,
        );
    }
};

const logError = (message: string) => {
    console.error(
        `\x1b[31m[Server] -\x1b[0m \x1b[37m${new Date().toLocaleString()}\x1b[0m \x1b[31mERROR\x1b[0m \x1b[33m[AppRegistry]\x1b[0m \x1b[31m${message}\x1b[0m`,
    );
};

/**
 * AppRegistry manages multiple Application instances indexed by scopeId.
 * It provides thread-safe access to scoped application instances.
 */
export class AppRegistry {
    private static instances = new Map<string, AppRegistryEntry>();
    private static singletonId = '__singleton__';

    /**
     * Register a new application instance with the given scopeId
     * @param scopeId - Unique identifier for this scope
     * @param instance - The Application instance
     * @param scope - The scope type
     * @param parentScopeId - Optional parent scope ID
     * @throws Error if scopeId already exists
     */
    public static register(
        scopeId: string,
        instance: any,
        scope: ApplicationScopeType = 'singleton',
        parentScopeId?: string,
    ): void {
        if (AppRegistry.instances.has(scopeId)) {
            throw new Error(
                `Application scope '${scopeId}' already exists. Use a unique scopeId or dispose the existing scope first.`,
            );
        }

        const entry: AppRegistryEntry = {
            instance,
            info: {
                scopeId,
                scope,
                createdAt: new Date(),
                isInitialized: false,
                isDisposed: false,
                parentScopeId,
            },
        };

        AppRegistry.instances.set(scopeId, entry);
        log(`Registered application scope: ${scopeId} (${scope})`);
    }

    /**
     * Get an application instance by scopeId
     * @param scopeId - The scope identifier
     * @returns The Application instance or undefined
     */
    public static get(scopeId: string): any | undefined {
        const entry = AppRegistry.instances.get(scopeId);
        return entry?.instance;
    }

    /**
     * Get the scope info for a given scopeId
     * @param scopeId - The scope identifier
     * @returns The scope info or undefined
     */
    public static getInfo(scopeId: string): IScopedApplicationInfo | undefined {
        const entry = AppRegistry.instances.get(scopeId);
        return entry?.info;
    }

    /**
     * Check if a scopeId exists in the registry
     * @param scopeId - The scope identifier
     * @returns True if the scope exists
     */
    public static has(scopeId: string): boolean {
        return AppRegistry.instances.has(scopeId);
    }

    /**
     * Mark a scope as initialized
     * @param scopeId - The scope identifier
     */
    public static markInitialized(scopeId: string): void {
        const entry = AppRegistry.instances.get(scopeId);
        if (entry) {
            entry.info.isInitialized = true;
        }
    }

    /**
     * Dispose a scoped application instance
     * @param scopeId - The scope identifier
     * @returns True if the scope was disposed
     */
    public static async dispose(scopeId: string): Promise<boolean> {
        const entry = AppRegistry.instances.get(scopeId);
        if (!entry) {
            return false;
        }

        try {
            // Call dispose on the application if available
            if (
                entry.instance &&
                typeof entry.instance.dispose === 'function'
            ) {
                await entry.instance.dispose();
            }

            entry.info.isDisposed = true;
            AppRegistry.instances.delete(scopeId);
            log(`Disposed application scope: ${scopeId}`);
            return true;
        } catch (error) {
            logError(`Failed to dispose scope ${scopeId}: ${error.message}`);
            throw error;
        }
    }

    /**
     * Dispose all application instances except singleton
     */
    public static async disposeAll(): Promise<void> {
        const scopeIds = Array.from(AppRegistry.instances.keys()).filter(
            (id) => id !== AppRegistry.singletonId,
        );

        for (const scopeId of scopeIds) {
            await AppRegistry.dispose(scopeId);
        }
    }

    /**
     * Get all registered scope IDs
     * @returns Array of scope IDs
     */
    public static getAllScopeIds(): string[] {
        return Array.from(AppRegistry.instances.keys());
    }

    /**
     * Get all scopes of a specific type
     * @param scope - The scope type to filter by
     * @returns Array of scope infos
     */
    public static getByType(
        scope: ApplicationScopeType,
    ): IScopedApplicationInfo[] {
        return Array.from(AppRegistry.instances.values())
            .filter((entry) => entry.info.scope === scope)
            .map((entry) => entry.info);
    }

    /**
     * Get the singleton scope ID
     * @returns The singleton scope ID constant
     */
    public static getSingletonId(): string {
        return AppRegistry.singletonId;
    }

    /**
     * Get the singleton application instance
     * @returns The singleton Application instance or undefined
     */
    public static getSingleton(): any | undefined {
        return AppRegistry.get(AppRegistry.singletonId);
    }

    /**
     * Register the singleton instance
     * @param instance - The Application instance
     */
    public static registerSingleton(instance: any): void {
        if (AppRegistry.instances.has(AppRegistry.singletonId)) {
            // Update existing singleton
            const entry = AppRegistry.instances.get(AppRegistry.singletonId);
            entry.instance = instance;
        } else {
            AppRegistry.register(
                AppRegistry.singletonId,
                instance,
                'singleton',
            );
        }
    }

    /**
     * Get count of registered scopes
     * @returns Number of registered scopes
     */
    public static count(): number {
        return AppRegistry.instances.size;
    }

    /**
     * Clear all registrations (for testing purposes)
     */
    public static clear(): void {
        AppRegistry.instances.clear();
    }
}
