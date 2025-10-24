# Centralized Error Handling and Exception Filters

## Why

Currently, CMMV has basic error handling in the HTTP adapter, but it lacks a comprehensive, centralized error handling system. This leads to:

- Inconsistent error responses across modules
- Repeated error handling code in controllers
- Difficulty in logging and monitoring errors systematically
- No standardized error format
- Limited ability to customize error responses per context
- No global exception filters

**Benefits:**
- Consistent error responses across the entire application
- Centralized error logging and monitoring
- Easier debugging with detailed error context
- Standardized error format (RFC 7807 Problem Details)
- Custom exception filters for different error types
- Better error tracking and observability
- Cleaner controller code without repetitive try-catch blocks

## What Changes

- **ADDED**: Exception filter system inspired by NestJS
- **ADDED**: Global exception filter with RFC 7807 support
- **ADDED**: @Catch() decorator for custom exception filters
- **ADDED**: Built-in exception filters (ValidationFilter, HttpExceptionFilter, etc.)
- **ADDED**: Error context with request ID, timestamp, and stack traces
- **ADDED**: Structured error logging with correlation IDs
- **ADDED**: Custom error classes for common scenarios
- **ADDED**: Error transformation pipeline
- **MODIFIED**: HTTP adapter to use exception filter system
- **MODIFIED**: Logger to support error context
- **ADDED**: Error response formatters
- **ADDED**: Error recovery strategies

## Impact

- **Affected specs:** http, core
- **Affected code:**
  - New `packages/core/filters/` - Exception filter system
  - `packages/http/adapters/default.adapter.ts` - Use exception filters
  - `packages/http/lib/exceptions.ts` - New exception classes
  - `packages/core/services/logger.service.ts` - Error logging
  - `packages/core/decorators/` - New @Catch decorator
  - All controllers - Cleaner error handling

- **Breaking Changes:** None (additive, existing error handling works)
- **Migration:** Existing HttpException usage continues to work

