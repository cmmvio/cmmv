# Tasks: Add Application Scopes for Multi-Agent Scenarios

## Progress: 100% (18/18 tasks complete)

## 1. Design Phase
- [x] 1.1 Define ApplicationScope type ('singleton' | 'agent' | 'request')
- [x] 1.2 Design ApplicationFactory API
- [x] 1.3 Design AppRegistry interface
- [x] 1.4 Design scope context propagation strategy

## 2. Implementation Phase - Core Infrastructure
- [x] 2.1 Create `IApplicationScope` interface in `packages/core/interfaces/`
- [x] 2.2 Create `AppRegistry` class in `packages/core/registries/`
- [x] 2.3 Create `ScopeContext` with AsyncLocalStorage in `packages/core/utils/`
- [x] 2.4 Create `ApplicationFactory` class in `packages/core/`

## 3. Implementation Phase - Application Modifications
- [x] 3.1 Add `scopeId` and `scope` properties to Application class
- [x] 3.2 Add `Application.current()` static method for scoped access
- [x] 3.3 Modify `providersMap` to be scope-aware
- [x] 3.4 Add `dispose()` method for cleanup
- [x] 3.5 Update exports in `packages/core/index.ts`

## 4. Implementation Phase - Integration
- [x] 4.1 Add scope tags to telemetry/logging (`app_id`, `scope_id`)
- [x] 4.2 Create `runWithApplicationScope()` helper function

## 5. Testing Phase
- [x] 5.1 Write unit tests for AppRegistry (19 tests)
- [x] 5.2 Write unit tests for ApplicationFactory (18 tests)
- [x] 5.3 Write integration tests for multi-agent scenarios (ScopeContext tests: 22 tests)
- [x] 5.4 Verify backward compatibility with existing singleton behavior

## 6. Documentation Phase
- [x] 6.1 Update CHANGELOG.md with the new feature
