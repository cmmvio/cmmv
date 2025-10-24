# Application Scoping Spec

## ADDED Requirements

### Requirement: Application Scope Types
The system SHALL support three levels of application scoping.

#### Scenario: Singleton scope (default)
- **WHEN** application is created without scope parameter
- **THEN** it uses singleton scope (process-wide)
- **AND** behaves exactly like current implementation
- **AND** maintains backward compatibility

#### Scenario: Agent scope
- **WHEN** application is created with scope='agent'
- **THEN** it creates isolated application instance
- **AND** has independent DI container
- **AND** can run multiple agent-scoped apps in same process

#### Scenario: Request scope
- **WHEN** application is created with scope='request'
- **THEN** it creates per-request isolated scope
- **AND** providers are recreated per request
- **AND** supports multi-tenancy scenarios

### Requirement: ApplicationFactory
The system SHALL provide ApplicationFactory for creating scoped applications.

```typescript
const app = await ApplicationFactory.create({
    id: 'agent:indexer',
    scope: 'agent',
    httpAdapter: DefaultAdapter,
    modules: [...]
});
```

#### Scenario: Create agent-scoped application
- **WHEN** ApplicationFactory.create() is called with unique ID
- **THEN** new isolated application instance is created
- **AND** assigned the specified ID
- **AND** registered in AppRegistry

#### Scenario: Duplicate application ID
- **WHEN** creating app with existing ID
- **THEN** system throws error
- **AND** includes existing app information
- **AND** suggests using different ID

#### Scenario: Invalid scope type
- **WHEN** creating app with unsupported scope
- **THEN** system throws validation error
- **AND** lists valid scope types

### Requirement: AppRegistry
The system SHALL maintain registry of all application instances.

#### Scenario: Register application
- **WHEN** application is created via factory
- **THEN** it's automatically registered in AppRegistry
- **AND** can be retrieved by ID

#### Scenario: Get application by ID
- **WHEN** AppRegistry.get('agent:writer') is called
- **THEN** returns the application instance if exists
- **AND** returns undefined if not found

#### Scenario: List all applications
- **WHEN** AppRegistry.getAll() is called
- **THEN** returns array of all registered applications
- **AND** includes metadata (id, scope, status)

#### Scenario: Unregister application
- **WHEN** application is disposed
- **THEN** it's automatically removed from registry
- **AND** cleanup is performed

### Requirement: Scoped Dependency Injection
The system SHALL support scoped DI container with provider lifetimes.

```typescript
@Service({ lifetime: 'scoped' })
export class RequestService { ... }
```

#### Scenario: Singleton provider
- **WHEN** provider has lifetime='singleton'
- **THEN** single instance exists per scope
- **AND** same instance is injected everywhere in that scope

#### Scenario: Scoped provider
- **WHEN** provider has lifetime='scoped'
- **THEN** new instance is created per child scope
- **AND** shared within that child scope

#### Scenario: Transient provider
- **WHEN** provider has lifetime='transient'
- **THEN** new instance is created for every injection
- **AND** no instance is cached

#### Scenario: Provider resolution
- **WHEN** dependency is requested from container
- **THEN** container checks lifetime
- **AND** returns cached instance or creates new one
- **AND** handles constructor dependencies recursively

### Requirement: Scope Isolation
The system SHALL isolate state between different scoped applications.

#### Scenario: No provider leakage
- **WHEN** two agent-scoped apps are created
- **THEN** each has independent DI container
- **AND** providers registered in one don't appear in the other
- **AND** singleton providers are scoped to their application

#### Scenario: No cache leakage
- **WHEN** two apps use cache service
- **THEN** cache keys are namespaced by scope_id
- **AND** app A cannot access app B's cached data
- **AND** cache.get() only returns data from same scope

#### Scenario: No registry leakage
- **WHEN** controllers are registered in different apps
- **THEN** each app has its own controller registry
- **AND** routes don't overlap between apps

### Requirement: AsyncLocalStorage Context
The system SHALL provide request context propagation via AsyncLocalStorage.

```typescript
await runWithApplicationScope(app, async () => {
    const currentApp = getCurrentApplication();
    // All async operations see same app
});
```

#### Scenario: Run with application scope
- **WHEN** code executes within runWithApplicationScope()
- **THEN** getCurrentApplication() returns the scoped app
- **AND** context propagates through async calls
- **AND** context is isolated per scope

#### Scenario: Nested scopes
- **WHEN** request scope is created within agent scope
- **THEN** child scope has access to parent's singletons
- **AND** scoped providers are created in child scope
- **AND** child can be disposed independently

### Requirement: Independent Lifecycle
The system SHALL support independent lifecycle per application instance.

#### Scenario: Start scoped application
- **WHEN** app.start() is called
- **THEN** only that application's servers start
- **AND** other applications are unaffected
- **AND** lifecycle hooks execute for that app only

#### Scenario: Stop scoped application
- **WHEN** app.stop() is called
- **THEN** that application's servers stop gracefully
- **AND** active requests complete (up to timeout)
- **AND** other applications continue running

#### Scenario: Dispose scoped application
- **WHEN** app.dispose() is called
- **THEN** all resources are cleaned up
- **AND** providers are disposed
- **AND** application is unregistered
- **AND** memory is freed

### Requirement: Scoped HTTP Server
The system SHALL support multiple HTTP servers in same process.

#### Scenario: Multiple servers on different ports
- **WHEN** two apps specify different ports
- **THEN** each binds to its own port successfully
- **AND** requests to port A route to app A
- **AND** requests to port B route to app B

#### Scenario: Port conflict detection
- **WHEN** two apps try to use same port
- **THEN** second app throws error during start
- **AND** error message indicates port conflict
- **AND** suggests available ports

### Requirement: Scoped Logging and Telemetry
The system SHALL tag logs and metrics with scope identifiers.

#### Scenario: Scoped logging
- **WHEN** logger is used within scoped app
- **THEN** all logs include app_id
- **AND** all logs include scope_id
- **AND** logs can be filtered by scope

Example log:
```json
{
    "timestamp": "2024-10-24T10:00:00Z",
    "level": "info",
    "message": "Request processed",
    "app_id": "agent:indexer",
    "scope_id": "scope:req:abc123"
}
```

#### Scenario: Scoped metrics
- **WHEN** metrics are collected
- **THEN** each metric includes app_id label
- **AND** each metric includes scope_id label
- **AND** metrics can be aggregated per application

### Requirement: Configuration Per Scope
The system SHALL support per-scope configuration.

#### Scenario: Scope-specific config
- **WHEN** agent-scoped app is created with custom config
- **THEN** that config only applies to that app
- **AND** other apps use their own configs
- **AND** configs don't interfere

#### Scenario: Config validation
- **WHEN** application is created
- **THEN** config is validated for that scope
- **AND** errors reference the specific app_id
- **AND** invalid config prevents app creation

### Requirement: Error Handling
The system SHALL handle scope-related errors gracefully.

#### Scenario: Scope not found
- **WHEN** getCurrentApplication() is called outside scope
- **THEN** returns undefined
- **AND** does not throw error

#### Scenario: Disposal errors
- **WHEN** error occurs during app.dispose()
- **THEN** error is logged
- **AND** cleanup continues for other resources
- **AND** app is still unregistered

## MODIFIED Requirements

### Requirement: Application.create()
The Application.create() method SHALL support optional scope parameter.

#### Scenario: Backward compatibility
- **WHEN** Application.create() is called without scope
- **THEN** defaults to singleton scope
- **AND** behaves exactly as before
- **AND** existing code works unchanged

#### Scenario: Explicit scope
- **WHEN** Application.create({ scope: 'agent', ... }) is called
- **THEN** creates agent-scoped application
- **AND** delegates to ApplicationFactory internally

## ADDED Decorators

### Decorator: @Scope
Providers SHALL support @Scope decorator for lifetime specification.

```typescript
@Service()
@Scope('scoped')
export class RequestContextService {
    private requestId: string;
}
```

#### Scenario: Provider with scope decorator
- **WHEN** class is decorated with @Scope('scoped')
- **THEN** instances are created per child scope
- **AND** shared within that scope

## ADDED Interfaces

### Interface: IScopedContainer
```typescript
interface IScopedContainer {
    register(token: string, provider: any, lifetime: ProviderLifetime): void;
    resolve<T>(token: string): T;
    createScope(): IScopedContainer;
    dispose(): Promise<void>;
}
```

### Interface: IApplicationScope
```typescript
interface IApplicationScope {
    id: string;
    scope: ApplicationScope;
    parent?: IApplicationScope;
    container: IScopedContainer;
    start(): Promise<void>;
    stop(): Promise<void>;
    dispose(): Promise<void>;
}
```

