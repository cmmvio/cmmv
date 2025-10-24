# API Versioning Spec

## ADDED Requirements

### Requirement: URI-Based Versioning
The system SHALL support URI-based API versioning with version prefix in paths.

#### Scenario: Request to versioned endpoint
- **WHEN** a client requests GET /v1/users
- **THEN** the system routes to the v1 UserController
- **AND** returns data formatted according to v1 schema

#### Scenario: Multiple versions of same endpoint
- **WHEN** both /v1/users and /v2/users are registered
- **THEN** the system maintains separate route handlers
- **AND** each version can have different logic and responses
- **AND** clients can choose their preferred version

#### Scenario: Version not specified
- **WHEN** a client requests /users without version
- **THEN** the system uses the configured default version
- **AND** redirects or routes to default version endpoint

### Requirement: Header-Based Versioning
The system SHALL support version specification via HTTP headers.

#### Scenario: Request with version header
- **WHEN** a client sends request with header `X-API-Version: 2`
- **THEN** the system routes to version 2 of the endpoint
- **AND** ignores URI version prefix if present

#### Scenario: Invalid version in header
- **WHEN** a client sends unsupported version in header
- **THEN** the system returns HTTP 400 (Bad Request)
- **AND** includes list of supported versions in error response

### Requirement: Media Type Versioning
The system SHALL support version specification in Accept header.

#### Scenario: Request with versioned media type
- **WHEN** a client sends `Accept: application/vnd.cmmv.v2+json`
- **THEN** the system routes to version 2 of the endpoint
- **AND** returns response with matching content-type

#### Scenario: Multiple accept types
- **WHEN** a client sends multiple versioned media types
- **THEN** the system selects the highest supported version
- **AND** returns response in that format

### Requirement: Version Decorator
The system SHALL provide @Version decorator for controllers and routes.

```typescript
@Controller('users')
@Version('2')
export class UserV2Controller {
    @Get()
    @Version(['2', '3']) // Supports both v2 and v3
    getUsers() { ... }
}
```

#### Scenario: Controller-level versioning
- **WHEN** @Version decorator is applied to controller
- **THEN** all routes in that controller use specified version
- **AND** routes are registered with version prefix

#### Scenario: Route-level versioning override
- **WHEN** a route has different @Version than controller
- **THEN** the route-level version takes precedence
- **AND** the route is registered under specified versions

#### Scenario: Multiple version support
- **WHEN** a route specifies array of versions
- **THEN** the system registers route for all specified versions
- **AND** same handler serves all those versions

### Requirement: Version Negotiation
The system SHALL negotiate API version based on configured strategy.

#### Scenario: Versioning strategy selection
- **WHEN** multiple versioning methods are provided
- **THEN** the system uses configured priority order
- **AND** URI version takes precedence over header
- **AND** header version takes precedence over media type

#### Scenario: No version specified
- **WHEN** client doesn't specify any version
- **THEN** the system uses default version from config
- **AND** logs the default version usage
- **AND** optionally includes version in response headers

### Requirement: Version Deprecation
The system SHALL support marking API versions as deprecated.

#### Scenario: Request to deprecated version
- **WHEN** a client requests a deprecated version
- **THEN** the system processes the request normally
- **AND** includes `Deprecation: true` header in response
- **AND** includes `Sunset` header with deprecation date
- **AND** logs deprecation warning

#### Scenario: Sunset date reached
- **WHEN** current date exceeds sunset date for a version
- **THEN** the system optionally blocks requests to that version
- **AND** returns HTTP 410 (Gone) if blocking is enabled
- **AND** suggests migration to newer version

### Requirement: OpenAPI Version Documentation
The system SHALL generate separate OpenAPI documentation per version.

#### Scenario: Generate versioned OpenAPI docs
- **WHEN** OpenAPI documentation is generated
- **THEN** the system creates separate spec for each version
- **AND** marks deprecated endpoints in documentation
- **AND** provides version selector in Swagger UI

#### Scenario: Access version-specific docs
- **WHEN** developer accesses /openapi/v2.json
- **THEN** the system returns OpenAPI spec for version 2 only
- **AND** includes only endpoints available in that version

### Requirement: Configuration
The system SHALL provide comprehensive versioning configuration.

#### Scenario: Configure versioning strategy
- **WHEN** developer sets versioning strategy in config
- **THEN** the system uses specified strategy (URI, header, or media type)
- **AND** validates configuration on application startup
- **AND** throws error if invalid strategy specified

#### Scenario: Configure version format
- **WHEN** developer configures version prefix format
- **THEN** the system accepts custom prefix (e.g., 'api/v', 'version/')
- **AND** applies format consistently across all routes
- **AND** updates OpenAPI documentation accordingly

## MODIFIED Requirements

### Requirement: Route Registration
The HTTP module SHALL register routes with version awareness.

#### Scenario: Register versioned routes
- **WHEN** controllers are registered during application startup
- **THEN** the system creates route entries for each version
- **AND** stores version metadata in route registry
- **AND** prevents version conflicts for same path

### Requirement: OpenAPI Path Generation
The OpenAPI module SHALL include version in generated paths.

#### Scenario: Generate OpenAPI paths with versions
- **WHEN** OpenAPI documentation is generated
- **THEN** paths include version prefix (e.g., /v1/users)
- **AND** each version has separate operation definitions
- **AND** version is included in operation metadata

