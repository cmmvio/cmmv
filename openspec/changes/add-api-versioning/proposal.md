# API Versioning Support

## Why

As CMMV applications evolve, API endpoints need to change while maintaining backward compatibility for existing clients. Currently, CMMV lacks built-in API versioning support, forcing developers to manually implement versioning strategies or risk breaking existing integrations.

**Benefits:**
- Enables iterative API evolution without breaking changes
- Supports multiple API versions simultaneously
- Provides clear deprecation path for old endpoints
- Industry-standard approach for REST APIs
- Improves developer experience with clear versioning strategy

## What Changes

- **ADDED**: Multiple versioning strategies (URI versioning, header versioning, media type versioning)
- **ADDED**: @Version decorator for controllers and routes
- **ADDED**: Automatic route prefixing with version numbers
- **ADDED**: Version negotiation middleware
- **ADDED**: Deprecation warning headers for old versions
- **ADDED**: OpenAPI documentation per version
- **MODIFIED**: HTTP module to support version routing
- **MODIFIED**: Controller registry to track versions
- **ADDED**: Configuration for default version and supported versions

## Impact

- **Affected specs:** http, openapi, core
- **Affected code:**
  - `packages/http/lib/http.module.ts` - Version routing support
  - `packages/http/decorators/` - New @Version decorator
  - `packages/http/lib/version.middleware.ts` - Version negotiation
  - `packages/core/registries/controller.registry.ts` - Version tracking
  - `packages/openapi/lib/openapi.service.ts` - Multi-version docs
  - `config.ts` - Versioning configuration

- **Breaking Changes:** None (additive only)
- **Migration:** Existing routes default to v1 if not specified

