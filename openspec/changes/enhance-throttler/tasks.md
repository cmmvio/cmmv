# Implementation Tasks

## 1. Core Enhancements
- [ ] 1.1 Create storage adapter interface (IThrottlerStorage)
- [ ] 1.2 Refactor ThrottlerService to use storage adapters
- [ ] 1.3 Create rate limit strategy interface
- [ ] 1.4 Add support for multiple time windows

## 2. Storage Adapters
- [ ] 2.1 Create MemoryStorageAdapter (current implementation)
- [ ] 2.2 Create RedisStorageAdapter for distributed limiting
- [ ] 2.3 Implement atomic increment operations
- [ ] 2.4 Add TTL support for rate limit keys
- [ ] 2.5 Implement storage adapter factory

## 3. Decorators
- [ ] 3.1 Create @RateLimit() decorator for controllers
- [ ] 3.2 Create @RateLimit() decorator for individual routes
- [ ] 3.3 Support decorator options (limit, ttl, strategy)
- [ ] 3.4 Create @SkipRateLimit() decorator
- [ ] 3.5 Add decorator metadata to route registry

## 4. Rate Limit Strategies
- [ ] 4.1 Create IPRateLimitStrategy
- [ ] 4.2 Create UserRateLimitStrategy (for authenticated users)
- [ ] 4.3 Create APIKeyRateLimitStrategy
- [ ] 4.4 Create GlobalRateLimitStrategy
- [ ] 4.5 Support custom strategy functions

## 5. Middleware
- [ ] 5.1 Create ThrottlerMiddleware for HTTP
- [ ] 5.2 Extract rate limit key based on strategy
- [ ] 5.3 Check rate limit before request processing
- [ ] 5.4 Add rate limit headers to response
- [ ] 5.5 Handle rate limit exceeded scenarios
- [ ] 5.6 Integrate with HTTP module middleware chain

## 6. Response Headers
- [ ] 6.1 Add X-RateLimit-Limit header
- [ ] 6.2 Add X-RateLimit-Remaining header
- [ ] 6.3 Add X-RateLimit-Reset header (Unix timestamp)
- [ ] 6.4 Add Retry-After header when limit exceeded
- [ ] 6.5 Support standardized RateLimit header (RFC draft)

## 7. Configuration
- [ ] 7.1 Update ThrottlerConfig with new options
- [ ] 7.2 Add storage adapter configuration
- [ ] 7.3 Add default rate limits per route type
- [ ] 7.4 Support per-environment rate limits
- [ ] 7.5 Add whitelist/blacklist IP support

## 8. Burst Allowance
- [ ] 8.1 Implement token bucket algorithm
- [ ] 8.2 Allow burst above steady rate
- [ ] 8.3 Configure burst size and refill rate
- [ ] 8.4 Update storage to track burst tokens

## 9. Custom Key Generators
- [ ] 9.1 Create KeyGenerator interface
- [ ] 9.2 Implement default key generators
- [ ] 9.3 Support custom key generator functions
- [ ] 9.4 Allow combining multiple key components

## 10. Metrics and Monitoring
- [ ] 10.1 Track rate limit hits and misses
- [ ] 10.2 Export rate limit metrics
- [ ] 10.3 Log rate limit violations
- [ ] 10.4 Add telemetry for rate limit checks

## 11. Error Handling
- [ ] 11.1 Update ThrottlerException with retry information
- [ ] 11.2 Add custom error messages per route
- [ ] 11.3 Support custom error responses
- [ ] 11.4 Handle storage adapter failures gracefully

## 12. Testing
- [ ] 12.1 Unit tests for storage adapters
- [ ] 12.2 Unit tests for rate limit strategies
- [ ] 12.3 Integration tests with Redis
- [ ] 12.4 E2E tests for decorated routes
- [ ] 12.5 Test burst allowance scenarios
- [ ] 12.6 Test distributed rate limiting
- [ ] 12.7 Performance tests for high throughput

## 13. Documentation
- [ ] 13.1 Update @cmmv/throttler README
- [ ] 13.2 Document decorator usage with examples
- [ ] 13.3 Document Redis setup for distributed limiting
- [ ] 13.4 Create rate limiting best practices guide
- [ ] 13.5 Document custom strategies
- [ ] 13.6 Update CHANGELOG
- [ ] 13.7 Add TypeDoc comments

