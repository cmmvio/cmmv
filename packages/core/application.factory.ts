import { v4 as uuidv4 } from 'uuid';
import { Logger } from './lib';
import { AppRegistry } from './registries/app.registry';
import { ScopeContext, runWithApplicationScope } from './utils/scope.context';
import {
    ApplicationScopeType,
    IApplicationScopeConfig,
    IScopedApplicationInfo,
} from './interfaces/application-scope.interface';
import { IApplicationSettings, Application } from './application';

/**
 * Extended application settings with scope configuration
 */
export interface IScopedApplicationSettings
    extends IApplicationSettings, IApplicationScopeConfig {}

/**
 * ApplicationFactory manages the creation and lifecycle of scoped Application instances.
 * It provides a unified API for creating singleton, agent-scoped, and request-scoped applications.
 *
 * @example
 * ```typescript
 * // Create an agent-scoped application
 * const indexerApp = await ApplicationFactory.create({
 *     scope: 'agent',
 *     scopeId: 'indexer-agent',
 *     httpAdapter: DefaultAdapter,
 *     modules: [IndexerModule],
 * });
 *
 * // Create another agent-scoped application
 * const writerApp = await ApplicationFactory.create({
 *     scope: 'agent',
 *     scopeId: 'writer-agent',
 *     httpAdapter: DefaultAdapter,
 *     modules: [WriterModule],
 * });
 *
 * // Run code within a specific scope
 * await runWithApplicationScope('indexer-agent', async () => {
 *     const app = Application.current();
 *     // Uses indexer-agent's isolated context
 * });
 * ```
 */
export class ApplicationFactory {
    private static logger = new Logger('ApplicationFactory');

    /**
     * Create a new scoped Application instance
     * @param settings - Application settings with scope configuration
     * @returns The created Application instance
     */
    public static create(settings: IScopedApplicationSettings): Application {
        const scope = settings.scope || 'singleton';
        let scopeId = settings.scopeId;

        // Generate scopeId if not provided
        if (!scopeId) {
            if (scope === 'singleton') {
                scopeId = AppRegistry.getSingletonId();
            } else if (scope === 'request') {
                scopeId = `request-${uuidv4()}`;
            } else {
                throw new Error(
                    "scopeId is required for 'agent' scope. Please provide a unique identifier.",
                );
            }
        }

        // Check for duplicate scopeId (except for singleton)
        if (scope !== 'singleton' && AppRegistry.has(scopeId)) {
            throw new Error(
                `Application scope '${scopeId}' already exists. Use ApplicationFactory.get() to retrieve it or dispose it first.`,
            );
        }

        ApplicationFactory.logger.log(
            `Creating application with scope: ${scope}, scopeId: ${scopeId}`,
        );

        // Create the application instance with scope metadata
        const app = new Application(settings, false, {
            scope,
            scopeId,
            parentScopeId: settings.parentScopeId,
        });

        // Register in the AppRegistry
        if (scope === 'singleton') {
            AppRegistry.registerSingleton(app);
        } else {
            AppRegistry.register(scopeId, app, scope, settings.parentScopeId);
        }

        return app;
    }

    /**
     * Create a scoped application for compilation only
     * @param settings - Application settings with scope configuration
     * @returns The created Application instance
     */
    public static compile(settings: IScopedApplicationSettings): Application {
        const scope = settings.scope || 'singleton';
        const scopeId = settings.scopeId || AppRegistry.getSingletonId();

        const app = new Application(settings, true, {
            scope,
            scopeId,
        });

        if (scope === 'singleton') {
            AppRegistry.registerSingleton(app);
        }

        return app;
    }

    /**
     * Get an existing scoped Application instance
     * @param scopeId - The scope identifier
     * @returns The Application instance or undefined
     */
    public static get(scopeId: string): Application | undefined {
        return AppRegistry.get(scopeId);
    }

    /**
     * Get the singleton Application instance
     * @returns The singleton Application instance
     */
    public static getSingleton(): Application | undefined {
        return AppRegistry.getSingleton();
    }

    /**
     * Check if a scope exists
     * @param scopeId - The scope identifier
     * @returns True if the scope exists
     */
    public static has(scopeId: string): boolean {
        return AppRegistry.has(scopeId);
    }

    /**
     * Get information about a scoped application
     * @param scopeId - The scope identifier
     * @returns The scope info or undefined
     */
    public static getInfo(scopeId: string): IScopedApplicationInfo | undefined {
        return AppRegistry.getInfo(scopeId);
    }

    /**
     * Dispose a scoped application instance
     * @param scopeId - The scope identifier
     * @returns True if the scope was disposed
     */
    public static async dispose(scopeId: string): Promise<boolean> {
        return AppRegistry.dispose(scopeId);
    }

    /**
     * Dispose all non-singleton scoped applications
     */
    public static async disposeAll(): Promise<void> {
        return AppRegistry.disposeAll();
    }

    /**
     * Get all registered scope IDs
     * @returns Array of scope IDs
     */
    public static getAllScopeIds(): string[] {
        return AppRegistry.getAllScopeIds();
    }

    /**
     * Get all scopes of a specific type
     * @param scope - The scope type to filter by
     * @returns Array of scope infos
     */
    public static getByType(
        scope: ApplicationScopeType,
    ): IScopedApplicationInfo[] {
        return AppRegistry.getByType(scope);
    }

    /**
     * Get the current Application based on scope context
     * Falls back to singleton if not in a scope
     * @returns The current Application instance
     */
    public static current(): Application {
        return ScopeContext.getCurrentApplication();
    }

    /**
     * Run a function within a specific application scope
     * @param scopeId - The scope ID to run within
     * @param callback - The async callback to execute
     * @returns Promise with the result
     */
    public static async runInScope<T>(
        scopeId: string,
        callback: () => Promise<T>,
    ): Promise<T> {
        return runWithApplicationScope(scopeId, callback);
    }

    /**
     * Create a request-scoped application and run code within it
     * The scope is automatically disposed after the callback completes
     * @param settings - Application settings (scope will be set to 'request')
     * @param callback - The async callback to execute
     * @returns Promise with the result
     */
    public static async withRequestScope<T>(
        settings: Omit<IScopedApplicationSettings, 'scope' | 'scopeId'>,
        callback: (app: Application) => Promise<T>,
    ): Promise<T> {
        const scopeId = `request-${uuidv4()}`;
        const app = ApplicationFactory.create({
            ...settings,
            scope: 'request',
            scopeId,
        });

        try {
            return await runWithApplicationScope(scopeId, async () => {
                return callback(app);
            });
        } finally {
            await ApplicationFactory.dispose(scopeId);
        }
    }

    /**
     * Get count of registered scopes
     * @returns Number of registered scopes
     */
    public static count(): number {
        return AppRegistry.count();
    }
}
