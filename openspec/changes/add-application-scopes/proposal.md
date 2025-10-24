# Application Scopes for Multi-Agent Scenarios

## Why

Currently, `Application.create()` behaves as a **process-wide singleton**, which creates critical limitations for modern deployment scenarios:

**Problem:**
- Multi-agent runtimes (MCP, A2A, Workers) cannot run multiple isolated agents in the same process
- State leakage between agents (configs, providers, caches, registries)
- Mixed logs and telemetry making debugging impossible
- Cannot run different configurations (ports, databases, etc.) in same process
- Blocks serverless and edge computing scenarios

**Real-World Use Cases:**
- **MCP Servers**: Run Indexer, Writer, and Planner agents in same process with isolation
- **A2A Systems**: Multiple specialized agents with different capabilities
- **Worker Pools**: Multiple workers processing different job types
- **Multi-Tenancy**: Isolated application instances per tenant
- **Testing**: Run multiple app instances for integration tests without port conflicts

**Benefits:**
- Enable true multi-agent architectures
- Better resource utilization (single process, multiple apps)
- Isolated dependency injection containers per scope
- Independent lifecycle management per application
- Scoped telemetry and logging
- Lower operational overhead than separate processes

## What Changes

- **ADDED**: Application scoping system with three scope levels (singleton, agent, request)
- **ADDED**: `ApplicationFactory` for creating scoped applications
- **ADDED**: `AppRegistry` for managing multiple application instances
- **ADDED**: Scoped DI containers with provider lifetimes (singleton, scoped, transient)
- **ADDED**: Isolated caches, loggers, and registries per scope
- **ADDED**: Scoped lifecycle APIs (start, stop, dispose)
- **ADDED**: AsyncLocalStorage-based request scoping
- **ADDED**: `runWithApplicationScope()` helper for per-request/per-agent execution
- **MODIFIED**: Application.create() to support optional scope parameter
- **MODIFIED**: All registries to support scoped instances
- **MODIFIED**: Telemetry to include app_id and scope_id
- **MODIFIED**: Logger to support scoped instances
- **ADDED**: Configuration validation per scope

## Impact

- **Affected specs:** core
- **Affected code:**
  - `packages/core/application.ts` - Add scope support
  - `packages/core/lib/application-factory.ts` - NEW: Factory for scoped apps
  - `packages/core/lib/app-registry.ts` - NEW: Registry for managing instances
  - `packages/core/lib/di-container.ts` - NEW: Scoped DI container
  - `packages/core/lib/provider-scope.ts` - NEW: Provider lifetime management
  - `packages/core/managers/` - Update to support scoping
  - `packages/core/registries/` - Add scope awareness
  - `packages/core/services/logger.service.ts` - Scoped instances
  - `packages/core/lib/telemetry.service.ts` - Add scope identifiers
  - `packages/cache/` - Namespace caches per scope
  - `packages/http/` - Scoped server instances

- **Breaking Changes:** None (backward compatible with default singleton scope)
- **Migration:** Existing code works unchanged; new multi-agent code opts into scoping
- **Performance Impact:** Minimal overhead for scoped DI lookups
- **Memory Impact:** Each scoped app maintains its own state (expected tradeoff)

**Backward Compatibility:**
- `Application.create()` without `scope` parameter defaults to "singleton" behavior
- All existing applications continue working without changes
- New applications can opt into "agent" or "request" scopes explicitly

