# Health Checks Spec

## ADDED Requirements

### Requirement: Liveness Probe Endpoint
The system SHALL provide a /health/live endpoint for container liveness checks.

#### Scenario: Application is running
- **WHEN** a liveness check is requested via GET /health/live
- **THEN** the system returns HTTP 200 (OK)
- **AND** response body is `{"status": "ok"}`
- **AND** response time is under 100ms

#### Scenario: Application is unhealthy
- **WHEN** a critical error prevents the application from functioning
- **THEN** GET /health/live returns HTTP 503 (Service Unavailable)
- **AND** includes error details in response body

### Requirement: Readiness Probe Endpoint
The system SHALL provide a /health/ready endpoint for container readiness checks.

#### Scenario: All dependencies are ready
- **WHEN** database, cache, and other dependencies are connected
- **THEN** GET /health/ready returns HTTP 200 (OK)
- **AND** response includes status of each dependency
- **AND** response includes `{"status": "ready"}`

#### Scenario: Database is not ready
- **WHEN** database connection is not established or failing
- **THEN** GET /health/ready returns HTTP 503 (Service Unavailable)
- **AND** response indicates which dependency failed
- **AND** includes error message and timestamp

### Requirement: Detailed Health Status
The system SHALL provide detailed health information for monitoring.

#### Scenario: Request detailed health status
- **WHEN** GET /health/status is requested
- **THEN** the system returns detailed health information
- **AND** includes status of all registered health indicators
- **AND** includes system metrics (memory, CPU, uptime)
- **AND** includes application version and environment

### Requirement: Custom Health Indicators
The system SHALL support custom health indicators via @HealthIndicator decorator.

```typescript
@HealthIndicator('external-api')
export class ExternalAPIHealthIndicator {
    async check(): Promise<HealthStatus> {
        // Check external API
    }
}
```

#### Scenario: Register custom health indicator
- **WHEN** a class is decorated with @HealthIndicator
- **THEN** the system registers it in health check registry
- **AND** includes it in readiness checks
- **AND** calls check() method during health evaluation

#### Scenario: Health indicator times out
- **WHEN** a health indicator takes longer than configured timeout
- **THEN** the system marks it as degraded
- **AND** continues checking other indicators
- **AND** includes timeout information in response

### Requirement: Database Health Indicator
The system SHALL monitor database connectivity and health.

#### Scenario: Database connection is healthy
- **WHEN** database health check runs
- **THEN** the system executes a simple query (SELECT 1)
- **AND** measures response time
- **AND** returns healthy status if response time < 1000ms

#### Scenario: Database connection lost
- **WHEN** database connection fails or times out
- **THEN** database health indicator returns unhealthy
- **AND** application remains in degraded state
- **AND** readiness probe fails

### Requirement: Cache Health Indicator
The system SHALL monitor cache (Redis/Memcached) connectivity.

#### Scenario: Redis is connected
- **WHEN** cache health check runs
- **THEN** the system sends PING command
- **AND** expects PONG response
- **AND** returns healthy if response received within 500ms

#### Scenario: Redis is disconnected
- **WHEN** Redis connection is unavailable
- **THEN** cache health indicator returns unhealthy
- **AND** application may continue in degraded mode
- **AND** warning is logged

### Requirement: Memory Health Indicator
The system SHALL monitor memory usage and heap statistics.

#### Scenario: Memory usage is normal
- **WHEN** heap memory usage is below 85% of max heap
- **THEN** memory health indicator returns healthy
- **AND** includes current heap usage in response

#### Scenario: Memory usage is critical
- **WHEN** heap memory exceeds 95% of max heap
- **THEN** memory health indicator returns unhealthy
- **AND** triggers warning for potential memory leak
- **AND** includes GC statistics in response

### Requirement: Graceful Shutdown
The system SHALL support graceful shutdown with connection draining.

#### Scenario: SIGTERM signal received
- **WHEN** application receives SIGTERM signal
- **THEN** the system stops accepting new connections
- **AND** waits for active requests to complete (up to configured timeout)
- **AND** closes database connections gracefully
- **AND** flushes logs and metrics
- **AND** exits with code 0

#### Scenario: Shutdown timeout exceeded
- **WHEN** active requests don't complete within shutdown timeout
- **THEN** the system forcefully terminates remaining connections
- **AND** logs warning about forced shutdown
- **AND** exits with code 1

