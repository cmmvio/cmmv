# Test Coverage Enhancement Spec

## ADDED Requirements

### Requirement: Coverage Configuration
The system SHALL provide comprehensive test coverage configuration in vitest.config.ts.

#### Scenario: Coverage thresholds configured
- **WHEN** vitest runs with coverage
- **THEN** it enforces minimum thresholds
- **AND** fails if coverage below 95% lines
- **AND** fails if coverage below 85% branches
- **AND** fails if coverage below 95% functions

#### Scenario: Coverage reporting
- **WHEN** coverage is collected
- **THEN** generates text report for terminal
- **AND** generates HTML report for browsing
- **AND** generates LCOV report for CI/CD
- **AND** generates JSON report for tooling

#### Scenario: Coverage exclusions
- **WHEN** coverage is calculated
- **THEN** excludes test files (*.spec.ts, *.test.ts)
- **AND** excludes mock files (*.mock.ts)
- **AND** excludes dist/build directories
- **AND** excludes .generated directories
- **AND** includes all source files

### Requirement: Critical Package Coverage (@cmmv/vault)
The vault package SHALL have 95%+ test coverage for all encryption functionality.

#### Scenario: AES-256-GCM encryption tests
- **WHEN** encrypt() is called with valid data
- **THEN** returns encrypted ciphertext
- **AND** ciphertext is different from plaintext
- **AND** includes initialization vector (IV)
- **AND** includes authentication tag

#### Scenario: AES-256-GCM decryption tests
- **WHEN** decrypt() is called with valid ciphertext
- **THEN** returns original plaintext
- **AND** verifies authentication tag
- **AND** throws error on tampered ciphertext
- **AND** throws error on wrong key

#### Scenario: ECC key generation tests
- **WHEN** generateKeyPair() is called
- **THEN** generates public key
- **AND** generates private key
- **AND** keys are mathematically valid pair
- **AND** private key is properly secured

#### Scenario: Secure storage tests
- **WHEN** storing encrypted data
- **THEN** data is encrypted before storage
- **AND** keys are never stored in plaintext
- **AND** namespace isolation is maintained

### Requirement: Critical Package Coverage (@cmmv/throttler)
The throttler package SHALL have 90%+ test coverage for rate limiting functionality.

#### Scenario: IP-based rate limiting tests
- **WHEN** requests exceed limit from same IP
- **THEN** throws ThrottlerException
- **AND** includes retry-after information
- **AND** resets after TTL expires

#### Scenario: User-based rate limiting tests
- **WHEN** authenticated user exceeds limit
- **THEN** tracks by user ID not IP
- **AND** different users have independent limits
- **AND** throws exception on limit exceeded

#### Scenario: Storage adapter tests
- **WHEN** memory adapter is used
- **THEN** stores rate limit data in Map
- **AND** implements TTL expiration
- **AND** garbage collects expired entries

#### Scenario: Redis adapter tests
- **WHEN** Redis adapter is configured
- **THEN** stores rate limit data in Redis
- **AND** uses atomic INCR operations
- **AND** sets TTL with EXPIRE command
- **AND** handles Redis connection failures gracefully

### Requirement: HTTP Adapter Coverage
The HTTP adapter SHALL have 85%+ test coverage for request/response handling.

#### Scenario: Request handling tests
- **WHEN** HTTP request is received
- **THEN** parses method, path, headers, body
- **AND** creates request context
- **AND** applies middleware chain
- **AND** routes to correct controller

#### Scenario: Response handling tests
- **WHEN** controller returns result
- **THEN** serializes response body
- **AND** sets correct status code
- **AND** sets response headers
- **AND** sends response to client

#### Scenario: Middleware chain tests
- **WHEN** middleware is registered
- **THEN** executes in correct order
- **AND** passes context through chain
- **AND** allows middleware to modify request/response
- **AND** short-circuits on error

#### Scenario: Error handling tests
- **WHEN** error occurs during request processing
- **THEN** catches error
- **AND** formats error response
- **AND** sets appropriate status code
- **AND** logs error details
- **AND** doesn't expose internal details in production

### Requirement: WebSocket Coverage
The WebSocket module SHALL have 85%+ test coverage for RPC communication.

#### Scenario: Connection lifecycle tests
- **WHEN** client connects via WebSocket
- **THEN** establishes connection
- **AND** emits connection event
- **AND** stores connection in registry

#### Scenario: Disconnection tests
- **WHEN** client disconnects
- **THEN** removes from connection registry
- **AND** emits disconnection event
- **AND** cleans up resources

#### Scenario: RPC message handling tests
- **WHEN** RPC message is received
- **THEN** deserializes protobuf message
- **AND** validates message structure
- **AND** routes to correct handler
- **AND** serializes response
- **AND** sends back to client

#### Scenario: Binary protocol tests
- **WHEN** messages use binary protocol
- **THEN** correctly encodes/decodes protobuf
- **AND** handles large messages (>1MB)
- **AND** validates checksums

### Requirement: Integration Test Suite
The system SHALL have comprehensive integration tests for module interactions.

#### Scenario: Full application startup
- **WHEN** application starts
- **THEN** loads all modules successfully
- **AND** establishes database connection
- **AND** establishes Redis connection
- **AND** registers all controllers
- **AND** registers all services

#### Scenario: Authentication flow integration
- **WHEN** user completes login flow
- **THEN** validates credentials
- **AND** creates session
- **AND** generates JWT token
- **AND** stores session in database
- **AND** caches session in Redis

#### Scenario: Contract generation integration
- **WHEN** contract is defined
- **THEN** generates TypeORM entity
- **AND** generates controller
- **AND** generates service
- **AND** generates RPC methods
- **AND** generates GraphQL resolvers

### Requirement: E2E Test Suite
The system SHALL have end-to-end tests for complete user flows.

#### Scenario: User registration E2E
- **WHEN** new user registers
- **THEN** validates input
- **AND** creates user in database
- **AND** sends confirmation email
- **AND** returns success response

#### Scenario: CRUD operations E2E
- **WHEN** user performs CRUD operations
- **THEN** creates entity successfully
- **AND** reads entity successfully
- **AND** updates entity successfully
- **AND** deletes entity successfully
- **AND** enforces authorization at each step

### Requirement: Security Tests
The system SHALL have comprehensive security vulnerability tests.

#### Scenario: SQL injection prevention
- **WHEN** malicious SQL in input
- **THEN** parameterized queries prevent injection
- **AND** no database error exposed
- **AND** returns validation error

#### Scenario: XSS prevention
- **WHEN** malicious script in input
- **THEN** input is sanitized
- **AND** output is escaped
- **AND** script cannot execute

#### Scenario: Authentication bypass attempts
- **WHEN** request without valid token
- **THEN** returns HTTP 401
- **AND** doesn't process request
- **AND** doesn't expose user existence

#### Scenario: Rate limit bypass attempts
- **WHEN** attacker tries to bypass rate limiting
- **THEN** distributed rate limiting works
- **AND** IP spoofing is prevented
- **AND** all bypass attempts are logged

### Requirement: Edge Case Tests
The system SHALL handle edge cases correctly.

#### Scenario: Very large payloads
- **WHEN** request body exceeds 10MB
- **THEN** rejects request
- **AND** returns HTTP 413 (Payload Too Large)
- **AND** doesn't load full payload into memory

#### Scenario: Null/undefined handling
- **WHEN** input contains null or undefined
- **THEN** validation catches it
- **AND** returns descriptive error
- **AND** doesn't throw unhandled exception

#### Scenario: Concurrent operations
- **WHEN** multiple requests modify same resource
- **THEN** uses database locking
- **AND** prevents race conditions
- **AND** last write wins or returns conflict error

#### Scenario: Unicode handling
- **WHEN** input contains emoji or special Unicode
- **THEN** correctly stores in database
- **AND** correctly retrieves from database
- **AND** correctly displays in responses

### Requirement: CI/CD Integration
The system SHALL integrate test coverage into CI/CD pipeline.

#### Scenario: GitHub Actions test workflow
- **WHEN** code is pushed to repository
- **THEN** runs tests on all platforms (ubuntu, windows, macos)
- **AND** generates coverage report
- **AND** uploads to Codecov
- **AND** fails if coverage below threshold

#### Scenario: Pull request coverage check
- **WHEN** pull request is opened
- **THEN** runs coverage on changed files
- **AND** comments with coverage diff
- **AND** blocks merge if coverage decreases

#### Scenario: Coverage badge
- **WHEN** README is viewed
- **THEN** displays current coverage percentage
- **AND** badge color indicates health (green >90%, yellow >75%, red <75%)

### Requirement: Pre-commit Coverage
The system SHALL check coverage before allowing commits.

#### Scenario: Pre-commit hook execution
- **WHEN** developer attempts to commit
- **THEN** runs tests for changed files
- **AND** calculates coverage for changed files
- **AND** rejects commit if coverage below threshold
- **AND** provides feedback on which files need more tests

## MODIFIED Requirements

### Requirement: @cmmv/testing Module
The testing module SHALL provide enhanced mock utilities.

#### Scenario: Database mocks
- **WHEN** test needs database
- **THEN** provides TypeORM repository mocks
- **AND** provides entity mocks
- **AND** provides transaction mocks

#### Scenario: HTTP mocks  
- **WHEN** test needs HTTP functionality
- **THEN** provides request mocks
- **AND** provides response mocks
- **AND** provides middleware mocks
- **AND** provides controller mocks (already exists, enhance)

#### Scenario: WebSocket mocks
- **WHEN** test needs WebSocket
- **THEN** provides connection mocks
- **AND** provides message mocks
- **AND** provides gateway mocks

## ADDED Metrics

### Coverage Thresholds
```typescript
coverage: {
    lines: 95,      // 95% of lines executed
    branches: 85,   // 85% of branches tested
    functions: 95,  // 95% of functions called
    statements: 95  // 95% of statements executed
}
```

### Per-Package Targets
- **@cmmv/vault:** 95%+ (critical security)
- **@cmmv/auth:** 95%+ (critical security)
- **@cmmv/throttler:** 90%+ (critical security)
- **@cmmv/http:** 85%+ (core functionality)
- **@cmmv/ws:** 85%+ (core functionality)
- **@cmmv/core:** 85%+ (core functionality)
- **@cmmv/protobuf:** 80%+ (code generation)
- **@cmmv/graphql:** 80%+ (code generation)
- **@cmmv/repository:** 80%+ (already good)
- **@cmmv/cache:** 75%+ (already good)
- **@cmmv/openapi:** 75%+ (documentation)
- **@cmmv/email:** 75%+ (external service)
- **@cmmv/keyv:** 75%+ (external service)

### Test Execution Time
- **Unit tests:** <2 minutes
- **Integration tests:** <3 minutes
- **Full suite:** <5 minutes
- **E2E tests:** <10 minutes (parallel execution)

