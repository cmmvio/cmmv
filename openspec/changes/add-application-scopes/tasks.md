# Implementation Tasks

## 1. Core Scoping Infrastructure
- [ ] 1.1 Define ApplicationScope enum (singleton, agent, request)
- [ ] 1.2 Define ProviderLifetime enum (singleton, scoped, transient)
- [ ] 1.3 Create IScopedContainer interface
- [ ] 1.4 Create IApplicationScope interface
- [ ] 1.5 Add scope property to ApplicationConfig

## 2. Dependency Injection Container
- [ ] 2.1 Create DIContainer class with scope support
- [ ] 2.2 Implement provider registration with lifetimes
- [ ] 2.3 Implement scoped instance resolution
- [ ] 2.4 Implement transient instance creation
- [ ] 2.5 Add parent-child container relationships
- [ ] 2.6 Implement container disposal and cleanup
- [ ] 2.7 Add circular dependency detection

## 3. Application Factory
- [ ] 3.1 Create ApplicationFactory class
- [ ] 3.2 Implement createSingleton() method
- [ ] 3.3 Implement createAgent() method
- [ ] 3.4 Implement createRequest() method
- [ ] 3.5 Add unique ID generation/validation
- [ ] 3.6 Add configuration validation per scope
- [ ] 3.7 Integrate with existing Application.create()

## 4. Application Registry
- [ ] 4.1 Create AppRegistry singleton
- [ ] 4.2 Implement register() method
- [ ] 4.3 Implement get() by ID
- [ ] 4.4 Implement getAll() with filtering
- [ ] 4.5 Implement unregister() and cleanup
- [ ] 4.6 Add thread-safe operations
- [ ] 4.7 Add registry event emissions

## 5. Scoped Registries
- [ ] 5.1 Update ControllerRegistry for scoping
- [ ] 5.2 Update ServiceRegistry for scoping
- [ ] 5.3 Update ModuleRegistry for scoping
- [ ] 5.4 Update ContractRegistry for scoping
- [ ] 5.5 Add scope isolation to all registries
- [ ] 5.6 Implement registry namespacing

## 6. Scoped Services
- [ ] 6.1 Create ScopedLogger with app_id
- [ ] 6.2 Create ScopedTelemetry with scope_id
- [ ] 6.3 Update Config service for scoping
- [ ] 6.4 Create scoped cache instances
- [ ] 6.5 Implement service disposal per scope

## 7. AsyncLocalStorage Integration
- [ ] 7.1 Create ApplicationContext using AsyncLocalStorage
- [ ] 7.2 Implement runWithApplicationScope() helper
- [ ] 7.3 Add getCurrentScope() utility
- [ ] 7.4 Add getCurrentApplication() utility
- [ ] 7.5 Integrate with HTTP request handling
- [ ] 7.6 Integrate with RPC request handling

## 8. Lifecycle Management
- [ ] 8.1 Add start() method per application instance
- [ ] 8.2 Add stop() method with graceful shutdown
- [ ] 8.3 Add dispose() method for cleanup
- [ ] 8.4 Implement lifecycle hooks per scope
- [ ] 8.5 Add lifecycle event emissions
- [ ] 8.6 Handle concurrent lifecycle operations
- [ ] 8.7 Add lifecycle state tracking

## 9. HTTP Server Scoping
- [ ] 9.1 Support multiple HTTP servers per process
- [ ] 9.2 Port assignment per scoped application
- [ ] 9.3 Middleware isolation per scope
- [ ] 9.4 Route registration per scope
- [ ] 9.5 Request context propagation

## 10. Cache Scoping
- [ ] 10.1 Namespace cache keys by scope_id
- [ ] 10.2 Isolate cache instances per scope
- [ ] 10.3 Add cache cleanup on scope disposal
- [ ] 10.4 Support shared caches (optional)

## 11. Telemetry and Logging
- [ ] 11.1 Add app_id to all logs
- [ ] 11.2 Add scope_id to all logs
- [ ] 11.3 Add app_id to all metrics
- [ ] 11.4 Add scope_id to all traces
- [ ] 11.5 Filter logs by scope
- [ ] 11.6 Separate log files per scope (optional)

## 12. Provider Lifetime Management
- [ ] 12.1 Implement singleton provider resolution
- [ ] 12.2 Implement scoped provider resolution
- [ ] 12.3 Implement transient provider creation
- [ ] 12.4 Add @Scope() decorator for providers
- [ ] 12.5 Validate provider lifetime consistency
- [ ] 12.6 Document provider lifetime semantics

## 13. Configuration
- [ ] 13.1 Add scope configuration schema
- [ ] 13.2 Validate unique application IDs
- [ ] 13.3 Validate port uniqueness for HTTP servers
- [ ] 13.4 Support per-scope configuration overrides
- [ ] 13.5 Add configuration inheritance (parent scope)

## 14. Error Handling
- [ ] 14.1 Handle scope not found errors
- [ ] 14.2 Handle duplicate application ID errors
- [ ] 14.3 Handle port conflicts
- [ ] 14.4 Clean up on application creation failure
- [ ] 14.5 Handle disposal errors gracefully

## 15. Multi-Agent Examples
- [ ] 15.1 Create Indexer + Writer + Planner example
- [ ] 15.2 Create multi-tenant application example
- [ ] 15.3 Create worker pool example
- [ ] 15.4 Create request-scoped example
- [ ] 15.5 Create MCP server example

## 16. Testing
- [ ] 16.1 Unit tests for DIContainer
- [ ] 16.2 Unit tests for ApplicationFactory
- [ ] 16.3 Unit tests for AppRegistry
- [ ] 16.4 Integration tests for scoped apps
- [ ] 16.5 Test provider lifetime resolution
- [ ] 16.6 Test scope isolation (no leakage)
- [ ] 16.7 Test concurrent app creation
- [ ] 16.8 Test lifecycle management
- [ ] 16.9 Test cache isolation
- [ ] 16.10 Test logging isolation
- [ ] 16.11 Performance tests (N scoped apps)
- [ ] 16.12 Memory leak tests
- [ ] 16.13 Test backward compatibility

## 17. Documentation
- [ ] 17.1 Create multi-scope applications guide
- [ ] 17.2 Document ApplicationFactory usage
- [ ] 17.3 Document provider lifetimes
- [ ] 17.4 Document scope isolation guarantees
- [ ] 17.5 Document migration from singleton
- [ ] 17.6 Add multi-agent architecture guide
- [ ] 17.7 Update @cmmv/core README
- [ ] 17.8 Update CHANGELOG
- [ ] 17.9 Add TypeDoc comments
- [ ] 17.10 Create troubleshooting guide

