# Changelog

All notable changes to this project will be documented in this file.

The format is based on [Keep a Changelog](https://keepachangelog.com/en/1.0.0/),
and this project adheres to [Semantic Versioning](https://semver.org/spec/v2.0.0.html).

## [Unreleased]

### Added

#### @cmmv/core - Application Scopes for Multi-Agent Support

Added application scope infrastructure enabling multiple isolated Application instances for MCP servers, A2A communication, and worker-based architectures.

**New Scope Types:**
- `singleton` - Default, backward-compatible single instance
- `agent` - Isolated per agent/worker (requires explicit `scopeId`)
- `request` - New instance per HTTP request (auto-generated `scopeId`)

**New Classes & Interfaces:**
- `ApplicationFactory` - Factory for creating scoped applications
  - `create(settings)` - Create a new scoped application
  - `get(scopeId)` - Retrieve an application by scope ID
  - `current()` - Get the current application based on context
  - `dispose(scopeId)` - Dispose a specific scope
  - `runInScope(scopeId, callback)` - Execute code within a scope
- `AppRegistry` - Registry for managing multiple Application instances
  - Thread-safe storage indexed by `scopeId`
  - Automatic lifecycle management
- `ScopeContext` - AsyncLocalStorage-based context isolation
  - `run(scopeId, fn)` / `runAsync(scopeId, fn)` - Execute within scope
  - `getCurrentScopeId()` - Get current scope identifier
  - `getCurrentApplication()` - Get current Application instance
  - `getMetadata(key)` / `setMetadata(key, value)` - Scope metadata
- `IApplicationScopeConfig` - Configuration interface for scopes
- `IScopedApplicationInfo` - Scope metadata interface

**Utility Functions:**
- `runWithApplicationScope(scopeId, callback)` - Run async code in a registered scope
- `runWithApplicationScopeSync(scopeId, callback)` - Sync version
- `@WithScope(scopeId)` - Method decorator for scope execution

**Application Class Enhancements:**
- New `scopeId` and `scope` properties
- `Application.current()` static method for context-aware access
- `dispose()` method for cleanup with `onDispose` hook
- Backward compatible - existing code works unchanged

**Telemetry Integration:**
- Logger now includes optional `scopeId` for scope-tagged logging
- `LogEvent` interface extended with `scopeId` field

**Test Coverage:**
- 59 new tests for scope functionality
- AppRegistry: 19 tests
- ScopeContext: 22 tests
- ApplicationFactory: 18 tests

#### @cmmv/testing - Complete Refactor

Comprehensive testing utilities for the CMMV framework with mocks for all packages.

**Core Testing Utilities:**
- `Test.createTestingModule()` - Fluent API for creating test modules with automatic provider, controller, and mock registration
- `TestingModuleBuilder` - Builder pattern with `.useMock()`, `.useProviders()`, `.useControllers()`, `.compile()`
- `SpyWrapper` - Enhanced spy functionality with `createSpy()`, `spyOn()`, `verifySpy()`
- `StubWrapper` - Stub creation with `createStub()` supporting `.returns()`, `.throws()`, `.callsFake()`
- `fakeTimers` - Time manipulation utilities for testing time-dependent code

**HTTP Testing:**
- `HttpTestingServer` - E2E HTTP testing server with Express-like API
- `HttpRequestBuilder` - Fluent API for building HTTP requests (`.get()`, `.post()`, `.put()`, `.delete()`)
- `HttpResponseAssert` - Response assertions (`.status()`, `.json()`, `.header()`, `.body()`)
- Factory functions: `createHttpTestingServer()`, `assertResponse()`

**WebSocket Testing:**
- `WsTestingClient` - WebSocket testing client with message simulation
- `RpcTestingClient` - RPC-specific client with `.call()`, `.simulateRpcResponse()`, `.simulateRpcError()`
- `WsMessageAssert` / `WsSingleMessageAssert` - Fluent message assertions
- `waitForMessage()` / `waitForMessages()` - Async message waiting with timeout support
- Factory functions: `createWsTestingClient()`, `createRpcTestingClient()`

**Database Testing:**
- `DatabaseTestingModule` - In-memory database testing with transaction isolation
- `MockTestDataSource` - Mock TypeORM DataSource with query runner support
- `MockTestRepository<T>` - Generic repository mock with full CRUD operations
- `MockQueryBuilder<T>` - Query builder mock with chaining support
- `FixtureFactory<T>` - Test data factory with `.create()`, `.createMany()`, `.build()`, `.buildMany()`
- Transaction support: `startTransaction()`, `runInTransaction()`, `withTransaction()`
- Seeding: `seed()`, `seedMany()`, `getSeededData()`, `clearSeededData()`

**Package Mocks:**
- `MockApplication` - Core application mock
- `MockLogger` - Logger mock with spy methods
- `MockScope` - Scope mock for DI testing
- `MockConfig` - Configuration mock
- `MockCompile` - Compilation mock
- `MockHooks` - Hooks system mock
- `MockModule` - Module mock
- `MockResolvers` - Resolvers mock
- `MockTelemetry` - Telemetry mock
- `MockTranspile` - Transpiler mock
- `MockCoreService` - Core service mock
- `MockDecorators` - Decorator testing utilities
- `MockHttpAdapter` / `MockHttpContext` - HTTP mocks
- `MockHttpLib` - HTTP library mock
- `MockHttpView` - View engine mock
- `MockCacheService` / `MockCacheManager` - Cache mocks
- `MockEmailService` - Email service mock
- `MockRepository` / `MockEntityManager` - Repository mocks
- `MockAuthService` / `MockSessionService` - Auth mocks
- `MockGraphQLService` / `MockGraphQLContext` - GraphQL mocks
- `MockWsGateway` / `MockWsAdapter` - WebSocket mocks
- `MockProtobufService` - Protobuf mock
- `MockOpenAPIService` - OpenAPI mock
- `MockVaultService` - Vault mock
- `MockThrottlerService` - Throttler mock
- `MockKeyvService` - Keyv mock

**Test Statistics:**
- 2072+ tests passing
- 94 test files
- Testing package: 520 tests in 24 files

### Changed

- Updated dependencies to latest versions
- Fixed `cron` v4 breaking changes in auth package

### Fixed

#### Production Mode - `.generated` Files Loading

Fixed critical issue where `.generated` files were not recognized in production mode:

- **Root Cause**: Development mode used `@swc-node/register` for on-the-fly TypeScript transpilation, but production mode did not, causing path aliases (`@controllers`, `@services`, etc.) to fail resolution
- **Solution**: Unified module loading by using `@swc-node/register` in both development and production modes
- **Changes**:
  - Added `start:prod` script: `NODE_ENV=production node -r @swc-node/register ./src/main.ts`
  - Updated `application.ts` to load `.generated/app.module.ts` directly in production
  - Path aliases now resolve correctly in both environments
- **Benefit**: CMMV applications work correctly in production with all generated files and path aliases preserved

#### @cmmv/sandbox - ESM Compatibility

- Fixed `chokidar` v5 ESM import issue by using dynamic import (`await import('chokidar')`)

#### Other Fixes

- Fixed timezone handling in fake timers tests
- Fixed duplicate member conflicts in SpyWrapper class

## [0.8.x] - Previous Releases

See GitHub releases for previous changelog entries.
