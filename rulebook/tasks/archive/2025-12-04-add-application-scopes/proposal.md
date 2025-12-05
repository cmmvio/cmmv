# Proposal: Add Application Scopes for Multi-Agent Scenarios

## Why

The current `Application.create()` operates as a process-wide singleton, which breaks multi-agent scenarios. This architecture causes:

1. **State Leakage** - Providers and services from one agent contaminate another
2. **Configuration Clashes** - Different agents cannot have different configurations
3. **Poor Isolation** - Cache, telemetry, and DI containers are shared globally
4. **Mixed Telemetry** - Logs and metrics from different agents are mixed, complicating debugging
5. **Blocked Use Cases** - MCP servers, A2A (Agent-to-Agent), and Worker-based architectures require agent isolation

Real-world scenarios affected:
- Running Indexer, Writer, and Planner agents concurrently
- Multi-tenant applications with isolated contexts
- Request-scoped applications for serverless environments
- Testing multiple application instances in parallel

This is a fundamental architectural limitation that prevents CMMV from being used in modern multi-agent and distributed scenarios.

**GitHub Issue:** https://github.com/cmmvio/cmmv/issues/31

## What Changes

### Solution: ApplicationFactory with AppRegistry

Introduce an `ApplicationFactory` class that manages multiple `Application` instances with different scopes:

```typescript
// New API
const app = ApplicationFactory.create({
    scope: 'agent',           // 'singleton' | 'agent' | 'request'
    scopeId: 'indexer-agent', // Unique identifier for this scope
    httpAdapter: DefaultAdapter,
    modules: [...],
});

// Or use helper for async context isolation
await runWithApplicationScope('writer-agent', async () => {
    // All Application calls here use isolated scope
    const app = Application.current(); // Gets scoped instance
});
```

### Core Changes Required

1. **Create ApplicationFactory class** (`packages/core/application.factory.ts`)
   - Manages creation of scoped Application instances
   - Maintains AppRegistry for tracking instances by scopeId
   - Supports scope types: `singleton`, `agent`, `request`

2. **Create AppRegistry** (`packages/core/registries/app.registry.ts`)
   - Stores and retrieves Application instances by scope/id
   - Handles lifecycle (dispose, cleanup)
   - Thread-safe access to instances

3. **Modify Application class** (`packages/core/application.ts`)
   - Add `scopeId` and `scope` properties
   - Add `Application.current()` for getting scoped instance
   - Maintain backward compatibility with existing singleton behavior
   - Independent DI container per scope

4. **Add AsyncLocalStorage support** (`packages/core/utils/scope.context.ts`)
   - `runWithApplicationScope()` helper function
   - Context propagation for async operations

5. **Update providers and services**
   - Scope-aware provider resolution
   - Isolated cache per scope
   - Scoped telemetry with `app_id`/`scope_id` tags

### Files Affected

| File | Change Type |
|------|-------------|
| `packages/core/application.factory.ts` | NEW - ApplicationFactory class |
| `packages/core/registries/app.registry.ts` | NEW - AppRegistry for instance management |
| `packages/core/utils/scope.context.ts` | NEW - AsyncLocalStorage helpers |
| `packages/core/application.ts` | MODIFIED - Add scope support, maintain backward compat |
| `packages/core/interfaces/application.interface.ts` | MODIFIED - Add scope types |
| `packages/core/index.ts` | MODIFIED - Export new classes |

## Impact

- **Affected specs**: core, application lifecycle, DI container
- **Affected code**: Application bootstrap, provider resolution, telemetry
- **Breaking change**: NO - Default behavior remains singleton (backward compatible)
- **User benefit**: Enables multi-agent, multi-tenant, and request-scoped applications

## Backward Compatibility

Existing code continues to work unchanged:
```typescript
// This still works exactly as before (singleton scope)
Application.create({
    httpAdapter: DefaultAdapter,
    modules: [...],
});
```

New scope features are opt-in via `ApplicationFactory` or the `scope` parameter.
