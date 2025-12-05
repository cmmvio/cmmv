/**
 * Application scope types
 * - singleton: Single global instance (default, backward compatible)
 * - agent: Isolated instance per agent/worker
 * - request: New instance per HTTP request
 */
export type ApplicationScopeType = 'singleton' | 'agent' | 'request';

/**
 * Configuration for scoped application instances
 */
export interface IApplicationScopeConfig {
    /**
     * The scope type for this application instance
     * @default 'singleton'
     */
    scope?: ApplicationScopeType;

    /**
     * Unique identifier for this scope instance
     * Required for 'agent' scope, auto-generated for 'request' scope
     */
    scopeId?: string;

    /**
     * Parent scope ID for hierarchical scopes
     */
    parentScopeId?: string;

    /**
     * Whether to inherit providers from parent scope
     * @default false
     */
    inheritProviders?: boolean;
}

/**
 * Interface for scoped application instance metadata
 */
export interface IScopedApplicationInfo {
    /**
     * Unique identifier for this scope
     */
    scopeId: string;

    /**
     * The scope type
     */
    scope: ApplicationScopeType;

    /**
     * Creation timestamp
     */
    createdAt: Date;

    /**
     * Whether the application is initialized
     */
    isInitialized: boolean;

    /**
     * Whether the application is disposed
     */
    isDisposed: boolean;

    /**
     * Parent scope ID if hierarchical
     */
    parentScopeId?: string;
}
