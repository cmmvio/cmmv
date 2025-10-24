# Enhanced Throttler Spec

## ADDED Requirements

### Requirement: @RateLimit Decorator
The system SHALL provide @RateLimit decorator for easy rate limiting configuration.

```typescript
@Controller('users')
@RateLimit({ limit: 100, ttl: 60 }) // 100 requests per minute
export class UserController {
    @Get()
    @RateLimit({ limit: 10, ttl: 1 }) // Override: 10 per second
    getUsers() { ... }
}
```

#### Scenario: Controller-level rate limiting
- **WHEN** @RateLimit decorator is applied to a controller
- **THEN** all routes in that controller are rate limited
- **AND** uses specified limit and TTL
- **AND** returns HTTP 429 when limit exceeded

#### Scenario: Route-level rate limiting override
- **WHEN** a route has different @RateLimit than controller
- **THEN** the route-level limit takes precedence
- **AND** other routes use controller-level limit

#### Scenario: Skip rate limiting
- **WHEN** route is decorated with @SkipRateLimit()
- **THEN** no rate limiting is applied to that route
- **AND** rate limit headers are not included

### Requirement: Distributed Rate Limiting
The system SHALL support distributed rate limiting across multiple server instances.

#### Scenario: Multiple server instances with Redis
- **WHEN** multiple instances run with Redis storage adapter
- **THEN** rate limits are enforced globally across all instances
- **AND** uses Redis atomic operations (INCR, EXPIRE)
- **AND** maintains consistency without race conditions

#### Scenario: Redis connection failure
- **WHEN** Redis is unavailable
- **THEN** the system falls back to in-memory storage
- **AND** logs warning about fallback mode
- **AND** continues processing requests

### Requirement: Rate Limit Strategies
The system SHALL support multiple rate limiting strategies.

#### Scenario: IP-based rate limiting
- **WHEN** IP strategy is configured
- **THEN** rate limits apply per client IP address
- **AND** uses X-Forwarded-For if behind proxy
- **AND** handles IPv4 and IPv6 addresses

#### Scenario: User-based rate limiting
- **WHEN** user strategy is configured for authenticated routes
- **THEN** rate limits apply per authenticated user ID
- **AND** different limits for anonymous vs authenticated
- **AND** shares limits across user's devices

#### Scenario: API key-based rate limiting
- **WHEN** API key strategy is configured
- **THEN** rate limits apply per API key
- **AND** supports different tiers (free, premium, enterprise)
- **AND** allows key-specific limit overrides

### Requirement: Rate Limit Response Headers
The system SHALL include rate limit information in HTTP response headers.

#### Scenario: Successful request within limits
- **WHEN** a request is within rate limits
- **THEN** response includes X-RateLimit-Limit header
- **AND** includes X-RateLimit-Remaining header
- **AND** includes X-RateLimit-Reset header (Unix timestamp)

#### Scenario: Rate limit exceeded
- **WHEN** rate limit is exceeded
- **THEN** response returns HTTP 429 (Too Many Requests)
- **AND** includes Retry-After header in seconds
- **AND** includes X-RateLimit-Reset header
- **AND** remaining is set to 0

### Requirement: Time Window Configuration
The system SHALL support configurable time windows for rate limits.

#### Scenario: Per-second rate limiting
- **WHEN** TTL is set to 1 second
- **THEN** rate limit resets every second
- **AND** allows burst traffic up to limit

#### Scenario: Per-minute rate limiting
- **WHEN** TTL is set to 60 seconds
- **THEN** rate limit resets every minute
- **AND** distributes requests across the minute

#### Scenario: Per-hour rate limiting
- **WHEN** TTL is set to 3600 seconds
- **THEN** rate limit resets every hour
- **AND** suitable for API quotas

### Requirement: Burst Allowance
The system SHALL support burst allowance using token bucket algorithm.

#### Scenario: Normal traffic with burst capacity
- **WHEN** burst size is configured (e.g., 50)
- **THEN** allows up to 50 requests instantly
- **AND** refills tokens at steady rate
- **AND** enables handling traffic spikes

#### Scenario: Burst capacity exhausted
- **WHEN** all burst tokens are consumed
- **THEN** requests are rate limited at refill rate
- **AND** tokens gradually replenish over time

### Requirement: Custom Key Generators
The system SHALL support custom key generation for rate limiting.

```typescript
@RateLimit({
    limit: 100,
    ttl: 60,
    keyGenerator: (req) => `${req.user.id}:${req.path}`
})
```

#### Scenario: Custom key generator
- **WHEN** custom keyGenerator function is provided
- **THEN** the system uses it to generate rate limit key
- **AND** function receives request object
- **AND** can combine multiple attributes

### Requirement: Storage Adapter Interface
The system SHALL define storage adapter interface for pluggable backends.

```typescript
interface IThrottlerStorage {
    increment(key: string, ttl: number): Promise<number>;
    get(key: string): Promise<number>;
    reset(key: string): Promise<void>;
}
```

#### Scenario: Memory storage adapter
- **WHEN** no Redis is configured
- **THEN** system uses in-memory Map storage
- **AND** data is lost on restart
- **AND** suitable for single-instance deployments

#### Scenario: Redis storage adapter
- **WHEN** Redis is configured
- **THEN** system uses Redis for storage
- **AND** supports distributed deployments
- **AND** persists across restarts

## MODIFIED Requirements

### Requirement: Throttler Service
The throttler service SHALL support multiple storage backends and strategies.

#### Scenario: Initialize with storage adapter
- **WHEN** throttler service is initialized
- **THEN** it creates configured storage adapter
- **AND** validates adapter implements required interface
- **AND** tests adapter connection

### Requirement: Throttler Exception
The exception SHALL include retry-after information.

#### Scenario: Throw throttler exception
- **WHEN** rate limit is exceeded
- **THEN** exception includes retry-after seconds
- **AND** includes current limit and TTL
- **AND** includes rate limit key for debugging

## ADDED Configuration

### Configuration: Throttler Config
The throttler configuration SHALL support comprehensive options.

```typescript
throttler: {
    enabled: true,
    storage: 'redis', // 'memory' | 'redis'
    limit: 100,
    ttl: 60,
    burst: 50,
    strategy: 'ip', // 'ip' | 'user' | 'apiKey' | 'global'
    redis: {
        host: 'localhost',
        port: 6379,
        db: 0
    },
    skipRoutes: ['/health', '/metrics'],
    errorMessage: 'Too many requests, please try again later'
}
```

#### Scenario: Load configuration
- **WHEN** application starts
- **THEN** throttler validates configuration
- **AND** creates storage adapter based on config
- **AND** applies default values for missing options

