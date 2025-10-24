# Application Scoping Design Document

## Context

CMMV's `Application.create()` currently creates a global singleton that manages the entire application state. This works well for traditional single-application servers but breaks down in multi-agent scenarios where multiple isolated applications need to coexist in the same process.

**Key Problems:**
1. Global state prevents running multiple apps with different configs
2. Provider registry is process-wide, causing conflicts
3. Caches and registries leak between instances
4. No way to isolate telemetry and logs per application
5. Lifecycle management applies globally, not per-instance

**Stakeholders:**
- Developers building multi-agent systems (MCP, A2A)
- Teams deploying to serverless/edge environments
- Teams implementing multi-tenancy
- Testing frameworks needing isolated app instances

## Goals / Non-Goals

### Goals
1. Enable multiple isolated CMMV applications in same process
2. Maintain 100% backward compatibility with existing singleton behavior
3. Provide scoped dependency injection with three lifetime models
4. Isolate caches, logs, and registries per application scope
5. Support independent lifecycle per application instance
6. Enable request-scoped providers for per-request isolation
7. Maintain performance (minimal overhead for DI resolution)

### Non-Goals
1. Cross-scope communication (use message passing externally)
2. Automatic scope selection (developers explicitly choose scope)
3. Dynamic scope switching during runtime
4. Scope inheritance beyond parent-child containers
5. Distributed scoping across processes/machines

## Decisions

### Decision 1: Three-Level Scope Hierarchy

**What:** Singleton → Agent → Request scope levels

**Why:**
- **Singleton**: Backward compatible, global state (existing behavior)
- **Agent**: Isolated application instances for multi-agent scenarios
- **Request**: Per-request isolation for multi-tenancy and testing

**Alternatives Considered:**
- Two levels (singleton, scoped): Not granular enough for request-scoped providers
- Four+ levels: Over-engineered, adds complexity without clear benefit
- Dynamic scopes: Too complex, hard to reason about

**Implementation:**
```typescript
enum ApplicationScope {
    Singleton = 'singleton', // Process-wide (default)
    Agent = 'agent',         // Per-application instance
    Request = 'request'      // Per-HTTP/RPC request
}
```

### Decision 2: ApplicationFactory Pattern

**What:** Factory for creating scoped applications instead of modifying Application.create()

**Why:**
- Cleaner separation of concerns
- Easier to add validation and initialization logic
- Allows different creation strategies per scope
- Keeps Application class focused on runtime behavior

**Alternatives Considered:**
- Modify Application.create() directly: Would bloat the class, harder to test
- Builder pattern: Overkill, factory is simpler and sufficient
- Static methods on Application: Less flexible, harder to mock

**API Design:**
```typescript
class ApplicationFactory {
    static async create(config: ScopedApplicationConfig): Promise<Application> {
        const { id, scope = 'singleton', ...appConfig } = config;
        
        switch (scope) {
            case 'singleton':
                return this.createSingleton(id, appConfig);
            case 'agent':
                return this.createAgent(id, appConfig);
            case 'request':
                return this.createRequest(id, appConfig);
        }
    }
}
```

### Decision 3: Scoped DI Container with Provider Lifetimes

**What:** Dedicated DI container supporting three provider lifetimes

**Why:**
- **Singleton**: Single instance per scope (most services)
- **Scoped**: New instance per child scope (request-specific services)
- **Transient**: New instance every time (stateless utilities)

**Implementation:**
```typescript
enum ProviderLifetime {
    Singleton = 'singleton', // One instance per container
    Scoped = 'scoped',       // One instance per child scope
    Transient = 'transient'  // New instance every injection
}

class DIContainer {
    private providers = new Map<string, ProviderDefinition>();
    private singletons = new Map<string, any>();
    private parent?: DIContainer;
    
    register(token: string, provider: any, lifetime: ProviderLifetime) { ... }
    resolve<T>(token: string): T { ... }
    createScope(): DIContainer { ... }
}
```

**Alternatives Considered:**
- Use existing singleton pattern: Doesn't support scoping
- External DI library (TSyringe, InversifyJS): Adds dependency, not CMMV-native
- Manual factory functions: Error-prone, no lifetime management

### Decision 4: AppRegistry for Instance Management

**What:** Central registry for managing multiple application instances

**Why:**
- Single source of truth for active applications
- Enables lookup by ID for inter-agent communication setup
- Facilitates cleanup and lifecycle management
- Provides observability (list all running apps)

**API Design:**
```typescript
class AppRegistry {
    private static apps = new Map<string, Application>();
    
    static register(app: Application): void { ... }
    static get(id: string): Application | undefined { ... }
    static getAll(): Application[] { ... }
    static unregister(id: string): void { ... }
}
```

**Alternatives Considered:**
- No registry, manual tracking: Error-prone, hard to debug
- Separate registry per scope type: Unnecessary complexity
- WeakMap for automatic cleanup: Prevents intentional lookup

### Decision 5: AsyncLocalStorage for Request Scoping

**What:** Use Node.js AsyncLocalStorage for request context propagation

**Why:**
- Native Node.js feature (no dependencies)
- Automatically propagates through async call chains
- Zero boilerplate in controllers
- Works with async/await, promises, callbacks

**Implementation:**
```typescript
import { AsyncLocalStorage } from 'async_hooks';

const appContext = new AsyncLocalStorage<Application>();

export function runWithApplicationScope<T>(
    app: Application, 
    fn: () => T | Promise<T>
): T | Promise<T> {
    return appContext.run(app, fn);
}

export function getCurrentApplication(): Application | undefined {
    return appContext.getStore();
}
```

**Alternatives Considered:**
- CLS (continuation-local-storage): Deprecated in favor of AsyncLocalStorage
- Manual context passing: Requires changes in every function signature
- Thread-local storage: Node.js is single-threaded

### Decision 6: Namespace-Based Cache Isolation

**What:** Prefix all cache keys with scope_id

**Why:**
- Simple and effective isolation
- Works with all cache backends (Redis, Memcached, memory)
- Low implementation complexity
- Minimal performance impact

**Implementation:**
```typescript
class ScopedCache {
    constructor(
        private backend: CacheBackend,
        private scopeId: string
    ) {}
    
    async get(key: string): Promise<any> {
        return this.backend.get(`${this.scopeId}:${key}`);
    }
    
    async set(key: string, value: any): Promise<void> {
        return this.backend.set(`${this.scopeId}:${key}`, value);
    }
}
```

**Alternatives Considered:**
- Separate cache instances per scope: Wastes connections
- Shared cache without isolation: Data leakage risk
- Database-per-scope: Too heavy for caching

### Decision 7: Scoped Telemetry with Context Tags

**What:** Add app_id and scope_id to all logs, metrics, and traces

**Why:**
- Essential for debugging multi-agent systems
- Enables filtering by application in log aggregators
- Supports distributed tracing across agents
- No performance impact (tags are cheap)

**Implementation:**
```typescript
class ScopedLogger {
    constructor(
        private baseLogger: Logger,
        private appId: string,
        private scopeId: string
    ) {}
    
    log(message: string, context?: any) {
        this.baseLogger.log(message, {
            ...context,
            app_id: this.appId,
            scope_id: this.scopeId
        });
    }
}
```

### Decision 8: Backward Compatible API

**What:** Keep Application.create() unchanged, default to singleton

**Why:**
- Zero breaking changes for existing applications
- Opt-in adoption of new scoping features
- Easier migration path
- Maintains trust with existing users

**Backward Compatibility:**
```typescript
// Existing code continues to work:
Application.create({ modules: [...] });  // → singleton scope

// New scoped code:
ApplicationFactory.create({
    id: 'agent:indexer',
    scope: 'agent',
    modules: [...]
});
```

## Risks / Trade-offs

### Risk 1: Memory Usage
**Risk:** Each scoped app maintains its own state (providers, caches, registries)  
**Impact:** Medium  
**Mitigation:**
- Document memory implications per scope
- Provide guidelines on when to use each scope
- Implement proper disposal methods
- Monitor memory in tests with many scopes

### Risk 2: Complexity
**Risk:** Scoping adds conceptual and implementation complexity  
**Impact:** Medium  
**Mitigation:**
- Comprehensive documentation with examples
- Clear error messages for scope-related issues
- Good defaults (singleton remains default)
- Gradual adoption path

### Risk 3: Breaking Changes in Edge Cases
**Risk:** Subtle behavior changes in advanced scenarios  
**Impact:** Low  
**Mitigation:**
- Extensive testing of edge cases
- Beta period with early adopters
- Clear migration guide
- Version bump communication

### Risk 4: Performance Overhead
**Risk:** DI resolution and scope lookups add latency  
**Impact:** Low  
**Mitigation:**
- Cache resolved instances when possible
- Optimize hot paths (request handling)
- Benchmark before/after
- Document performance characteristics

## Migration Plan

### Phase 1: Foundation (Weeks 1-2)
- Implement DIContainer with lifetimes
- Implement ApplicationFactory
- Implement AppRegistry
- Core scoping infrastructure

### Phase 2: Integration (Weeks 3-4)
- Update all registries for scoping
- Implement scoped logger and telemetry
- Add AsyncLocalStorage support
- HTTP server scoping

### Phase 3: Features (Week 5)
- Cache scoping
- Request-scoped providers
- Lifecycle management
- Error handling

### Phase 4: Testing & Documentation (Week 6)
- Comprehensive test suite
- Multi-agent examples
- Migration guide
- Performance benchmarks

### Rollout Strategy
1. Release as beta in minor version (0.18.0-beta)
2. Gather feedback from early adopters
3. Fix issues and iterate
4. Promote to stable in next minor (0.18.0)
5. Document in blog post and examples

## Open Questions

1. **Q:** Should we support scope inheritance beyond parent-child?  
   **A:** No, keep it simple. Parent-child is sufficient for known use cases.

2. **Q:** How to handle port conflicts for HTTP servers?  
   **A:** Validate at creation time, throw descriptive error.

3. **Q:** Should scoped apps share the same event bus?  
   **A:** No, each scope gets its own event emitter for isolation.

4. **Q:** Can scopes communicate directly?  
   **A:** No, use external message passing (queues, RPC). Keeps scopes isolated.

5. **Q:** Should we support scope priorities?  
   **A:** Not initially. Can add later if needed.

## Success Metrics

- [ ] Run 10+ agent instances in same process without leakage
- [ ] Zero breaking changes in existing test suite
- [ ] Performance overhead <5% for DI resolution
- [ ] Memory usage linear with number of scopes
- [ ] Clean disposal: no memory leaks after scope cleanup
- [ ] Adoption: 10+ GitHub stars on multi-agent examples

## References

- NestJS Module Scoping: https://docs.nestjs.com/fundamentals/injection-scopes
- AsyncLocalStorage: https://nodejs.org/api/async_context.html
- Dependency Injection Lifetimes: https://learn.microsoft.com/en-us/dotnet/core/extensions/dependency-injection
- Multi-Agent Systems: MCP Protocol, AutoGen, LangGraph

