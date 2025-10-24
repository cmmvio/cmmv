# HTTP Error Handling Spec

## ADDED Requirements

### Requirement: Exception Filter System
The system SHALL provide exception filter mechanism for centralized error handling.

```typescript
@Catch(HttpException)
export class HttpExceptionFilter implements ExceptionFilter {
    catch(exception: HttpException, host: ArgumentsHost) {
        const ctx = host.switchToHttp();
        const response = ctx.getResponse();
        // Handle exception
    }
}
```

#### Scenario: Global exception filter
- **WHEN** an unhandled exception occurs
- **THEN** the system passes it to global exception filters
- **AND** filters process the exception in order
- **AND** first matching filter handles the exception

#### Scenario: Custom exception filter for specific error type
- **WHEN** @Catch(ValidationException) filter is registered
- **THEN** only ValidationException instances are passed to it
- **AND** other exceptions bypass this filter
- **AND** filter can transform error response

### Requirement: RFC 7807 Problem Details
The system SHALL format error responses according to RFC 7807 standard.

#### Scenario: HTTP error response
- **WHEN** an HTTP exception occurs
- **THEN** response follows RFC 7807 format
- **AND** includes type, title, status, detail, instance
- **AND** optionally includes custom extensions

Example response:
```json
{
    "type": "https://api.example.com/errors/validation",
    "title": "Validation Failed",
    "status": 400,
    "detail": "One or more fields failed validation",
    "instance": "/users/create",
    "correlationId": "abc-123",
    "timestamp": "2024-10-24T10:30:00Z",
    "errors": [
        {"field": "email", "message": "Invalid email format"}
    ]
}
```

### Requirement: Exception Classes
The system SHALL provide built-in exception classes for common HTTP errors.

#### Scenario: Throw NotFoundException
- **WHEN** resource is not found
- **THEN** controller throws NotFoundException
- **AND** system returns HTTP 404
- **AND** includes standardized error message

#### Scenario: Throw BadRequestException
- **WHEN** request is invalid
- **THEN** controller throws BadRequestException
- **AND** system returns HTTP 400
- **AND** includes details about what's wrong

#### Scenario: Throw ValidationException
- **WHEN** request validation fails
- **THEN** system throws ValidationException
- **AND** includes field-level error details
- **AND** returns HTTP 422 (Unprocessable Entity)

### Requirement: Error Context
The system SHALL capture comprehensive error context.

#### Scenario: Capture request context
- **WHEN** an error occurs
- **THEN** system captures request ID, path, method, IP
- **AND** includes user information if authenticated
- **AND** includes timestamp
- **AND** logs all context for debugging

#### Scenario: Include stack traces in development
- **WHEN** NODE_ENV is development
- **THEN** error responses include stack traces
- **AND** includes full error details

#### Scenario: Hide sensitive information in production
- **WHEN** NODE_ENV is production
- **THEN** error responses omit stack traces
- **AND** sanitizes error messages
- **AND** hides internal implementation details

### Requirement: Structured Error Logging
The system SHALL log errors with structured metadata.

#### Scenario: Log error with context
- **WHEN** an exception is caught
- **THEN** system logs error with level ERROR
- **AND** includes error message, stack trace, and context
- **AND** includes correlation ID for request tracking
- **AND** outputs in JSON format if configured

### Requirement: Validation Error Formatting
The system SHALL format validation errors consistently.

#### Scenario: Class-validator validation fails
- **WHEN** request DTO validation fails
- **THEN** system collects all validation errors
- **AND** formats them as field-level errors
- **AND** returns structured response with all failed fields

Example:
```json
{
    "type": "https://api.example.com/errors/validation",
    "title": "Validation Failed",
    "status": 422,
    "errors": [
        {"field": "email", "constraints": {"isEmail": "email must be an email"}},
        {"field": "age", "constraints": {"min": "age must not be less than 18"}}
    ]
}
```

### Requirement: Error Transformation
The system SHALL transform internal errors to user-friendly HTTP errors.

#### Scenario: Database constraint violation
- **WHEN** database throws unique constraint error
- **THEN** system transforms to ConflictException
- **AND** returns HTTP 409
- **AND** includes user-friendly message

#### Scenario: Database connection error
- **WHEN** database connection fails
- **THEN** system transforms to ServiceUnavailableException
- **AND** returns HTTP 503
- **AND** suggests retry

## ADDED Decorators

### Decorator: @Catch
Exception filters SHALL be decorated with @Catch to specify handled exceptions.

```typescript
@Catch(HttpException, ValidationException)
export class CustomFilter implements ExceptionFilter {
    catch(exception: Error, host: ArgumentsHost) { ... }
}
```

#### Scenario: Filter catches specific exception types
- **WHEN** filter is decorated with @Catch(TypeA, TypeB)
- **THEN** it only receives exceptions of those types
- **AND** other exceptions are passed to other filters

#### Scenario: Filter catches all exceptions
- **WHEN** filter is decorated with @Catch() without arguments
- **THEN** it receives all uncaught exceptions
- **AND** acts as catch-all filter

