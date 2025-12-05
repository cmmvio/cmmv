# Proposal: Refactor @cmmv/testing as a Complete Testing Framework

## Why

The current `@cmmv/testing` package is incomplete and does not function as a proper testing framework. It only provides basic mocks but lacks essential features that a testing framework should have:

**Current Problems:**

1. **No TestingModule Builder** - Cannot create isolated test modules with dependency injection
2. **No HTTP Request Testing** - No supertest-like API for testing endpoints
3. **No E2E Testing Support** - Cannot spin up a real server for end-to-end tests
4. **Limited Mock System** - Mocks are basic `vi.fn()` wrappers without proper DI integration
5. **No Test Utilities** - Missing helpers for common testing patterns
6. **No Database Testing** - No transaction rollback or test database support
7. **No WebSocket Testing** - Cannot test RPC/WS gateways
8. **Poor Documentation** - No clear API for test setup/teardown

**What a proper testing framework should provide (like NestJS @nestjs/testing):**

- `Test.createTestingModule()` - Create isolated modules with overridable providers
- `TestingModule.createNestApplication()` - Spin up test server
- Request testing via supertest integration
- Mock providers with `overrideProvider()`
- E2E test utilities
- Database transaction support for test isolation
- WebSocket/RPC testing utilities

## What Changes

### Complete Rewrite of @cmmv/testing

The package will be completely rewritten to provide a comprehensive testing framework inspired by NestJS testing utilities but adapted for CMMV's contract-driven architecture.

### New Architecture

```typescript
// Unit Testing - Isolated module with mocked dependencies
const moduleRef = await Test.createTestingModule({
    modules: [UserModule],
    providers: [UserService],
})
.overrideProvider(DatabaseService)
.useValue(mockDatabaseService)
.compile();

const userService = moduleRef.get(UserService);

// Integration Testing - Real HTTP server
const app = await Test.createTestingModule({
    modules: [AppModule],
}).compile();

const httpServer = app.createHttpServer();
await httpServer.init();

// E2E Testing with supertest
const response = await request(httpServer.getHttpServer())
    .get('/api/users')
    .expect(200);

// WebSocket/RPC Testing
const wsClient = await app.createWsClient();
const response = await wsClient.send('user.get', { id: 1 });

// Database Testing with Transaction Rollback
const moduleRef = await Test.createTestingModule({
    modules: [AppModule],
})
.useTestDatabase({ rollback: true })
.compile();
```

### Core Components to Create

1. **TestingModule** (`packages/testing/testing.module.ts`)
   - Isolated DI container for tests
   - Provider override capabilities
   - Module compilation

2. **TestingModuleBuilder** (`packages/testing/testing.builder.ts`)
   - Fluent API for building test modules
   - `overrideProvider()`, `overrideGuard()`, `overrideInterceptor()`
   - `useTestDatabase()` configuration

3. **HttpTestingServer** (`packages/testing/http/http-testing.server.ts`)
   - Creates real HTTP server for E2E tests
   - Supertest integration
   - Request/Response helpers

4. **WsTestingClient** (`packages/testing/ws/ws-testing.client.ts`)
   - WebSocket client for RPC testing
   - Message send/receive helpers
   - Connection lifecycle management

5. **DatabaseTestingModule** (`packages/testing/database/database-testing.module.ts`)
   - Transaction rollback after each test
   - Test database configuration
   - Seeding utilities

6. **MockFactory** (`packages/testing/mocks/mock.factory.ts`)
   - Auto-mock generation for services
   - Spy utilities
   - Mock reset helpers

7. **TestUtils** (`packages/testing/utils/test.utils.ts`)
   - `createMockContract()` - Generate mock from contract
   - `createMockProvider()` - Auto-generate provider mock
   - `waitFor()` - Async test utilities

### Files to Create/Modify

| File | Change Type |
|------|-------------|
| `packages/testing/index.ts` | REWRITE - New exports |
| `packages/testing/testing.module.ts` | NEW - TestingModule class |
| `packages/testing/testing.builder.ts` | NEW - TestingModuleBuilder |
| `packages/testing/http/http-testing.server.ts` | NEW - HTTP E2E testing |
| `packages/testing/http/request.ts` | NEW - Supertest wrapper |
| `packages/testing/ws/ws-testing.client.ts` | NEW - WebSocket testing |
| `packages/testing/database/database-testing.module.ts` | NEW - DB test utilities |
| `packages/testing/mocks/mock.factory.ts` | NEW - Mock generation |
| `packages/testing/mocks/auto-mock.ts` | NEW - Auto-mock from types |
| `packages/testing/utils/test.utils.ts` | NEW - Test utilities |
| `packages/testing/interfaces/` | NEW - Testing interfaces |

### Dependencies to Add

```json
{
  "dependencies": {
    "supertest": "^6.3.0"
  },
  "peerDependencies": {
    "@cmmv/core": ">=0.8.0",
    "@cmmv/http": ">=0.8.0",
    "vitest": ">=1.0.0"
  }
}
```

## Impact

- **Affected specs**: testing, core (test utilities integration)
- **Affected code**: Complete rewrite of @cmmv/testing package
- **Breaking change**: YES - Complete API change, but current usage is minimal
- **User benefit**: Proper testing framework enabling unit, integration, and E2E tests

## Migration Path

Since the current package has limited adoption, the migration is straightforward:

```typescript
// Before (current)
const app = Test.createApplication({ ... });

// After (new)
const moduleRef = await Test.createTestingModule({
    modules: [...],
}).compile();

const app = moduleRef.createHttpServer();
```

Documentation will include migration guide and examples for all testing scenarios.
