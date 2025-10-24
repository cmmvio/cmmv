# Enhanced Throttler with Decorator Support

## Why

The current @cmmv/throttler module provides basic rate limiting functionality but lacks important features needed for production applications:

- No decorator support for easy controller/route-level rate limiting
- No distributed rate limiting across multiple server instances
- Limited to in-memory storage (doesn't scale horizontally)
- No support for different rate limit strategies (per user, per IP, per API key)
- No rate limit headers in responses (X-RateLimit-*)
- Basic configuration without flexibility

**Benefits:**
- Easy-to-use decorator-based rate limiting
- Horizontal scaling with Redis-backed distributed limiting
- Industry-standard rate limit headers
- Flexible rate limit strategies
- Protection against API abuse and DDoS
- Better developer experience

## What Changes

- **ADDED**: @RateLimit() decorator for controllers and routes
- **ADDED**: Redis storage adapter for distributed rate limiting
- **ADDED**: Multiple rate limit strategies (IP-based, user-based, API-key-based)
- **ADDED**: Rate limit headers in responses (X-RateLimit-Limit, X-RateLimit-Remaining, X-RateLimit-Reset)
- **ADDED**: Configurable time windows (per second, minute, hour, day)
- **ADDED**: Burst allowance for sudden traffic spikes
- **ADDED**: Custom key generators for rate limiting
- **ADDED**: Skip rate limiting for specific routes or users
- **MODIFIED**: ThrottlerService to support multiple storage backends
- **MODIFIED**: ThrottlerException to include retry-after information
- **ADDED**: Rate limit metrics and monitoring

## Impact

- **Affected specs:** throttler, http, cache
- **Affected code:**
  - `packages/throttler/lib/throttler.service.ts` - Enhanced service with adapters
  - `packages/throttler/decorators/` - New @RateLimit decorator
  - `packages/throttler/lib/throttler.middleware.ts` - HTTP middleware
  - `packages/throttler/adapters/` - Memory and Redis adapters
  - `packages/throttler/lib/throttler.config.ts` - Enhanced configuration
  - `packages/http/lib/http.module.ts` - Middleware integration

- **Breaking Changes:** None (backward compatible, existing code works as-is)
- **Migration:** Existing throttler usage continues to work with memory storage
- **Dependencies:** Optional Redis for distributed limiting

