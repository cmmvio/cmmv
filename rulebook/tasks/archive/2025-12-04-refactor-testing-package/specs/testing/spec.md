# Testing Package Specification

## ADDED Requirements

### Requirement: TestingModule Builder
The system MUST provide a `Test.createTestingModule()` method that creates an isolated testing module with its own DI container.

#### Scenario: Create isolated test module
Given a test file that needs to test a service
When `Test.createTestingModule({ providers: [MyService] }).compile()` is called
Then a TestingModule MUST be created with isolated dependency injection

#### Scenario: Get provider from test module
Given a compiled TestingModule with UserService registered
When `moduleRef.get(UserService)` is called
Then the UserService instance from the test container MUST be returned

### Requirement: Provider Override
The system MUST allow overriding providers with mock implementations using a fluent API.

#### Scenario: Override provider with mock value
Given a TestingModuleBuilder with DatabaseService as dependency
When `builder.overrideProvider(DatabaseService).useValue(mockDb).compile()` is called
Then the TestingModule MUST use mockDb instead of real DatabaseService

#### Scenario: Override provider with mock class
Given a TestingModuleBuilder with CacheService as dependency
When `builder.overrideProvider(CacheService).useClass(MockCacheService).compile()` is called
Then the TestingModule MUST instantiate MockCacheService instead of CacheService

#### Scenario: Override provider with factory
Given a TestingModuleBuilder with ConfigService as dependency
When `builder.overrideProvider(ConfigService).useFactory(() => mockConfig).compile()` is called
Then the TestingModule MUST use the factory result as the provider

### Requirement: HTTP E2E Testing Server
The system MUST provide an HTTP testing server for end-to-end testing of API endpoints.

#### Scenario: Create HTTP testing server
Given a compiled TestingModule with HTTP controllers
When `moduleRef.createHttpServer()` is called
Then an HttpTestingServer MUST be created and ready for requests

#### Scenario: Make HTTP request in test
Given an initialized HttpTestingServer
When a GET request is made to `/api/users`
Then the response MUST be returned with status code and body

#### Scenario: Test with supertest
Given an HttpTestingServer instance
When `request(server.getHttpServer()).get('/api/users').expect(200)` is called
Then supertest MUST execute the request against the test server

### Requirement: Request Testing Utilities
The system MUST provide utilities for testing HTTP requests with assertions.

#### Scenario: Assert response status
Given a test making an HTTP request
When the response is received
Then the system MUST allow asserting the status code

#### Scenario: Assert response body
Given a test making an HTTP request
When the response is received
Then the system MUST allow asserting the response body content

#### Scenario: Assert response headers
Given a test making an HTTP request
When the response is received
Then the system MUST allow asserting response headers

### Requirement: WebSocket/RPC Testing
The system MUST provide a WebSocket testing client for RPC gateway testing.

#### Scenario: Create WebSocket test client
Given a compiled TestingModule with WS gateway
When `moduleRef.createWsClient()` is called
Then a WsTestingClient MUST be created and connected

#### Scenario: Send RPC message
Given a connected WsTestingClient
When `client.send('user.get', { id: 1 })` is called
Then the RPC message MUST be sent and response awaited

#### Scenario: Test RPC response
Given an RPC call made via WsTestingClient
When the response is received
Then the system MUST allow asserting the response data

### Requirement: Database Testing Support
The system MUST provide database testing utilities with transaction rollback.

#### Scenario: Test with transaction rollback
Given a TestingModule configured with `useTestDatabase({ rollback: true })`
When a test modifies database data
Then all changes MUST be rolled back after the test completes

#### Scenario: Seed test data
Given a TestingModule with database testing enabled
When `moduleRef.seed(UserSeeder)` is called
Then the seeder MUST populate the test database

### Requirement: Mock Factory
The system MUST provide utilities for automatic mock generation.

#### Scenario: Create mock from contract
Given a UserContract definition
When `createMockContract(UserContract)` is called
Then a mock object MUST be generated with all contract fields

#### Scenario: Create mock provider
Given a UserService class
When `createMockProvider(UserService)` is called
Then a mock provider MUST be generated with all methods as spies

#### Scenario: Auto-mock all dependencies
Given a TestingModuleBuilder
When `builder.useMockProviders()` is called
Then all providers MUST be automatically mocked unless explicitly provided

### Requirement: Test Lifecycle Hooks
The system MUST support test lifecycle hooks for setup and teardown.

#### Scenario: Before all hook
Given a TestingModule
When `moduleRef.beforeAll(async () => { ... })` is registered
Then the callback MUST execute before all tests in the suite

#### Scenario: After each hook
Given a TestingModule
When `moduleRef.afterEach(async () => { ... })` is registered
Then the callback MUST execute after each test

#### Scenario: Cleanup on close
Given an initialized TestingModule
When `moduleRef.close()` is called
Then all resources (HTTP server, WS connections, DB) MUST be cleaned up

## MODIFIED Requirements

### Requirement: Test Class API
The Test class MUST provide the new `createTestingModule()` method while maintaining backward compatibility.

#### Scenario: New API usage
Given a test file using the new API
When `Test.createTestingModule({ modules: [...] })` is called
Then a TestingModuleBuilder MUST be returned

#### Scenario: Legacy API deprecation
Given a test file using `Test.createApplication()`
When the method is called
Then a deprecation warning SHOULD be logged and the method MUST still work

## REMOVED Requirements

### Requirement: Direct ApplicationMock Usage
The system MUST deprecate direct usage of `ApplicationMock` class in favor of `TestingModule`.

#### Scenario: ApplicationMock deprecation
Given code using `new ApplicationMock(settings)`
When executed
Then a deprecation warning MUST be logged recommending `Test.createTestingModule()`
