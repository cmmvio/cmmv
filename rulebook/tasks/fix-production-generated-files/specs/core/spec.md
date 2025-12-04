# Core Specification - Production Mode Module Loading with SWC

## MODIFIED Requirements

### Requirement: Production Runtime with SWC
The system MUST use `@swc-node/register` in production mode to resolve TypeScript path aliases at runtime, maintaining consistency with development mode.

#### Scenario: Production startup with SWC register
Given a CMMV application configured for production
When the application starts with `node -r @swc-node/register ./src/main.ts`
Then all TypeScript path aliases (@controllers, @services, @entities, @models) MUST be resolved correctly

#### Scenario: Generated controllers loading in production
Given a CMMV application with generated controllers in .generated/controllers/
When the application starts in production mode using @swc-node/register
Then all controllers MUST be loaded successfully without "Cannot find module" errors

#### Scenario: Generated services loading in production
Given a CMMV application with generated services in .generated/services/
When the application starts in production mode using @swc-node/register
Then all services MUST be loaded successfully without "Cannot find module" errors

### Requirement: Unified Module Loading
The system MUST use the same module loading approach for both development and production environments, eliminating the need for separate code paths.

#### Scenario: Consistent behavior across environments
Given a CMMV application with modules using path aliases
When the application runs in development mode
And the application runs in production mode
Then both environments MUST load modules identically using @swc-node/register

### Requirement: Package.json Production Script
The system MUST provide a production start script in package.json that uses @swc-node/register.

#### Scenario: Production start script availability
Given a CMMV project with package.json
When a user wants to start the application in production
Then a `start:prod` script MUST be available that runs `NODE_ENV=production node -r @swc-node/register ./src/main.ts`

## REMOVED Requirements

### Requirement: Compiled JavaScript Loading in Production
The previous requirement to load pre-compiled .js files from dist/ directory in production is removed in favor of runtime TypeScript transpilation with SWC.
