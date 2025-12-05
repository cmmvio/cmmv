# Core Specification - Application Scopes

## ADDED Requirements

### Requirement: Application Scope Types
The system MUST support three application scope types: `singleton`, `agent`, and `request`.

#### Scenario: Singleton scope (default behavior)
Given a CMMV application created without scope parameter
When `Application.create()` is called multiple times
Then all calls MUST return the same global instance

#### Scenario: Agent scope
Given a CMMV application created with `scope: 'agent'` and a unique `scopeId`
When multiple applications are created with different scopeIds
Then each MUST have its own isolated instance with independent state

#### Scenario: Request scope
Given a CMMV application configured with `scope: 'request'`
When a new HTTP request is received
Then a new isolated application context MUST be created for that request

### Requirement: ApplicationFactory
The system MUST provide an `ApplicationFactory` class for creating scoped application instances.

#### Scenario: Create agent-scoped application
Given an ApplicationFactory
When `ApplicationFactory.create({ scope: 'agent', scopeId: 'my-agent', ... })` is called
Then a new Application instance MUST be created with isolated DI container

#### Scenario: Retrieve existing scoped application
Given an ApplicationFactory with an existing 'indexer' agent scope
When `ApplicationFactory.get('indexer')` is called
Then the existing Application instance MUST be returned

#### Scenario: Dispose scoped application
Given an ApplicationFactory with an existing scoped application
When `ApplicationFactory.dispose('scopeId')` is called
Then the application MUST be stopped and resources cleaned up

### Requirement: AppRegistry
The system MUST maintain a registry of all application instances indexed by scopeId.

#### Scenario: Register application instance
Given an AppRegistry
When a new scoped Application is created
Then it MUST be registered with its scopeId

#### Scenario: Prevent duplicate scopeIds
Given an AppRegistry with an existing 'my-agent' scope
When attempting to create another application with the same scopeId
Then the system MUST throw an error indicating duplicate scope

### Requirement: Scope Context Propagation
The system MUST provide `runWithApplicationScope()` for AsyncLocalStorage-based context isolation.

#### Scenario: Execute code within scope
Given a registered application scope 'writer-agent'
When `runWithApplicationScope('writer-agent', async () => { ... })` is called
Then all code within the callback MUST access the 'writer-agent' Application instance

#### Scenario: Access current scoped application
Given code executing within a scope context
When `Application.current()` is called
Then the Application instance for the current scope MUST be returned

### Requirement: Isolated DI Container
The system MUST provide independent dependency injection containers per scope.

#### Scenario: Provider isolation between scopes
Given two agent-scoped applications 'agent-1' and 'agent-2'
When a provider is registered in 'agent-1'
Then it MUST NOT be accessible from 'agent-2'

#### Scenario: Provider resolution within scope
Given an agent-scoped application with registered providers
When `Application.resolveProvider()` is called within that scope
Then providers MUST be resolved from the scoped container only

### Requirement: Scoped Telemetry
The system MUST tag all telemetry and logs with scope identifiers.

#### Scenario: Log entries with scope tags
Given an agent-scoped application with scopeId 'indexer'
When the application logs a message
Then the log entry MUST include `app_id` and `scope_id` tags

### Requirement: Backward Compatibility
The system MUST maintain full backward compatibility with existing singleton-based code.

#### Scenario: Existing code without scope
Given existing code using `Application.create()` without scope parameter
When the application is created
Then it MUST behave exactly as before (singleton mode)

#### Scenario: Application.instance access
Given existing code accessing `Application.instance`
When accessed without scope context
Then it MUST return the singleton instance for backward compatibility

## MODIFIED Requirements

### Requirement: Application Instance Access
The Application class MUST support both singleton access (backward compatible) and scoped access via `Application.current()`.

#### Scenario: Singleton access
Given no active scope context
When `Application.instance` is accessed
Then the global singleton instance MUST be returned

#### Scenario: Scoped access
Given an active scope context for 'my-agent'
When `Application.current()` is called
Then the 'my-agent' scoped instance MUST be returned
