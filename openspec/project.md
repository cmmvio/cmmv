# Project Context

## Purpose

CMMV (Contract-Model-Model-View) is a revolutionary Node.js framework that redefines web application development through contract-driven development. The framework automates the generation of APIs, controllers, ORM entities, and RPC communication, delivering an optimized and robust experience.

**Core Goals:**
- Simplify development by leveraging TypeScript decorators and modular architecture
- Remove complexity through automation while allowing full customization
- Provide high-performance alternatives to traditional frameworks (4x better than Express)
- Support multiple protocols (REST, RPC, GraphQL) with automatic type inference
- Enable contract-based development where a single contract generates all necessary code

## Tech Stack

### Core Technologies
- **Runtime:** Node.js >= 20.0.0
- **Language:** TypeScript 5.8+ (ESNext target, CommonJS modules)
- **Package Manager:** pnpm 10.10.0+ (monorepo with Lerna)
- **Build System:** TypeScript compiler with incremental builds
- **Module Bundler:** Vite (for client builds), SWC (for transpilation)

### Framework Components
- **HTTP Server:** @cmmv/server (high-performance native server, 4x faster than Express)
- **RPC/WebSocket:** @cmmv/ws, @cmmv/protobuf (binary protocol support)
- **ORM:** TypeORM integration via @cmmv/repository
- **Authentication:** @cmmv/auth (JWT, OAuth2, 2FA, session management)
- **Caching:** @cmmv/cache (Redis, Memcached, MongoDB support)
- **View Engine:** @cmmv/http (SSR with EJS, Mustache support)
- **API Documentation:** @cmmv/openapi (replaces deprecated @cmmv/swagger)
- **Security:** @cmmv/vault (AES-256-GCM & ECC encryption)

### Databases
- **SQL:** PostgreSQL, MySQL, SQL Server, Oracle, SQLite
- **NoSQL:** MongoDB
- **Cache:** Redis, Memcached

### Testing
- **Framework:** Vitest 2.1+
- **E2E Testing:** @cmmv/testing (unit, S2S, mocks)
- **Assertion:** Chai 5.2+

### Development Tools
- **Linter:** ESLint 9.29+ with @typescript-eslint
- **Formatter:** Prettier 3.5+
- **Git Hooks:** Husky 9.1+
- **Commit Linting:** commitlint with conventional commits
- **Monitoring:** nodemon, @cmmv/inspector

## Project Conventions

### Code Style

**Formatting:**
- **Semicolons:** Required
- **Quotes:** Single quotes preferred
- **Trailing Commas:** All (ES5+)
- **Print Width:** 80 characters
- **Tab Width:** 4 spaces
- **Indentation:** Spaces (not tabs)

**TypeScript:**
- **Decorators:** Enabled (`experimentalDecorators: true`)
- **Metadata:** Enabled (`emitDecoratorMetadata: true`)
- **Strict Mode:** Enabled with selective overrides
- **Module Resolution:** Node
- **Target:** ESNext
- **Null Checks:** Disabled (`strictNullChecks: false`)

**Naming Conventions:**
- **Files:** kebab-case (e.g., `auth.module.ts`, `user.contract.ts`)
- **Classes:** PascalCase (e.g., `AuthModule`, `UserContract`)
- **Interfaces:** PascalCase with 'I' prefix optional
- **Decorators:** PascalCase (e.g., `@Module()`, `@Contract()`)
- **Functions/Methods:** camelCase
- **Constants:** UPPER_SNAKE_CASE for true constants, camelCase for config objects

### Architecture Patterns

**Contract-Driven Development:**
- Single source of truth: TypeScript contracts define models, API endpoints, validation, and relationships
- Automatic code generation: Contracts generate controllers, services, entities, DTOs, and RPC definitions
- Located in: `src/contracts/` or `packages/*/contracts/`

**Monorepo Structure:**
- **Workspace Root:** `cmmv/` contains the main framework
- **Packages:** `packages/` contains scoped modules (@cmmv/*)
- **Applications:** Separate repos for specific apps (cmmv-blog, cmmv-admin, etc.)
- **Lerna:** Manages versioning and publishing across packages

**Module System:**
- Each package is a standalone npm module
- Modules follow singleton-based architecture
- Modules register via Application.create() in main.ts
- Each module exports: Module class, Services, Controllers, Contracts, Decorators

**Path Aliases:**
```typescript
@cmmv/core       → packages/core
@models          → src/models (auto-generated)
@controllers     → src/controllers (auto-generated)
@services        → src/services (auto-generated)
@contracts       → src/contracts
@entities        → src/entities (auto-generated)
@gateways        → src/gateways (auto-generated)
@generated       → .generated (build artifacts)
```

**Transpilers:**
- Custom transpilers extend base AbstractTranspiler
- Transform contracts into controllers, services, entities, views
- Located in: `packages/*/transpilers/`

**Decorators Pattern:**
- Heavy use of TypeScript decorators for metadata
- Core decorators: @Module, @Controller, @Service, @Contract, @Gateway
- HTTP decorators: @Get, @Post, @Put, @Delete, @Middleware
- Auth decorators: @Auth, @Roles, @Public

### Testing Strategy

**Test Framework:** Vitest with TypeScript support

**Test Types:**
- **Unit Tests:** Test individual functions and classes in isolation
- **Integration Tests:** Test module interactions
- **E2E Tests:** Test complete request/response cycles
- **S2S Tests:** Server-to-server communication tests

**Test Location:**
- Package tests: `packages/*/tests/` or `packages/*/test/`
- Integration tests: `test/`
- Spec files: `*.spec.ts`

**Test Commands:**
- `pnpm test` - Run all tests
- `NODE_ENV=test vitest` - Run with environment

**Mocking:**
- Use @cmmv/testing for creating mocks
- Mock external services (Redis, databases)
- Use dependency injection for testability

### Git Workflow

**Branching Strategy:**
- **main:** Production-ready code
- **develop:** Integration branch (if used)
- **feature/*:** New features
- **fix/*:** Bug fixes
- **chore/*:** Maintenance tasks

**Commit Convention:**
- Follow Conventional Commits specification
- Format: `type(scope): subject`
- Types: feat, fix, docs, style, refactor, test, chore
- Example: `feat(auth): add 2FA support with QR code generation`

**Commit Categories:**
- `type: feature :tada:` - New features
- `type: bug :sob:` - Bug fixes
- `type: enhancement :wolf:` - Improvements
- `type: docs :page_facing_up:` - Documentation
- `type: code style` - Code style changes
- `dependencies` - Dependency updates

**Pre-commit Hooks:**
- **lint-staged:** Runs Prettier on staged TS and JSON files
- **commitlint:** Validates commit message format

**Release Process:**
1. `pnpm run prerelease` - Cleanup and prepare
2. `pnpm run build:prod` - Build all packages
3. `pnpm run packages:move` - Move compiled files
4. `pnpm run release:lerna` - Publish with Lerna
5. Manual: `git push` and `git push --tags` (SSH with certificate)

## Domain Context

**Contract-Driven Architecture:**
- Contracts are TypeScript classes decorated with `@Contract()`
- Define fields with validation decorators from class-validator
- Specify database relationships (@OneToMany, @ManyToOne, etc.)
- Auto-generate: REST endpoints, RPC methods, GraphQL resolvers, TypeORM entities

**Protocol Support:**
- **REST:** Traditional HTTP/JSON APIs via @cmmv/http
- **RPC:** Binary protobuf over WebSocket via @cmmv/protobuf + @cmmv/ws
- **GraphQL:** Type-safe resolvers via @cmmv/graphql
- All three can be generated from a single contract

**Authentication Flow:**
- Local login/register with email validation
- OAuth2 integration (Google, Facebook planned)
- JWT-based token authentication
- 2FA with QR code generation
- Session management with fingerprinting (IP, user-agent)
- One-time tokens for email verification

**View System:**
- Server-Side Rendering (SSR) integrated into @cmmv/http
- Template engines: EJS, Mustache
- SSR directives for dynamic content
- Client-side hydration support with Vue 3

**Encryption:**
- @cmmv/vault for secure key-value storage
- AES-256-GCM for symmetric encryption
- ECC (Elliptic Curve Cryptography) for asymmetric encryption
- Environment-based key management

## Important Constraints

**Node Version:** Minimum Node.js 20.0.0 required

**TypeScript Configuration:**
- Must enable experimental decorators
- Must enable decorator metadata emission
- Must use CommonJS modules (not ESM yet)
- Incremental compilation required for performance

**Database:**
- TypeORM entities must be auto-generated from contracts
- Manual entity modifications will be overwritten
- Use migrations for schema changes

**Build Process:**
- Clean all compiled files before build (`pnpm run clean`)
- Build packages before application
- Move compiled files to package roots for publishing

**SSH Authentication:**
- Git push requires SSH certificate and password
- Never auto-push or auto-tag without user confirmation
- Provide push commands for user to execute manually

**Deprecations:**
- @cmmv/view merged into @cmmv/http (v0.8.33+)
- @cmmv/swagger replaced by @cmmv/openapi
- Express replaced by @cmmv/server

**Performance:**
- Target 4x performance improvement over Express
- Use binary protocols (protobuf) for RPC
- Enable caching for frequently accessed data
- Optimize bundle sizes for client code

## External Dependencies

**Required Services (Optional):**
- **Redis:** For caching (@cmmv/cache, @cmmv/keyv) - localhost:6379
- **PostgreSQL/MySQL/MongoDB:** For database persistence
- **SMTP or AWS SES:** For email sending (@cmmv/email)

**AWS Integration:**
- **S3:** File storage (@aws-sdk/client-s3)
- **SES:** Email service (@aws-sdk/client-ses)
- Environment variables: AWS_REGION, AWS_ACCESS_KEY_ID, AWS_SECRET_ACCESS_KEY

**Third-Party Services:**
- **Google OAuth:** Client ID/Secret for social login
- **reCAPTCHA:** Secret key for bot protection
- **Elasticsearch:** Optional for @cmmv/elastic module

**Development Services:**
- **CircleCI:** Continuous integration
- **npm Registry:** Package publishing

**Key Environment Variables:**
```bash
NODE_ENV=development|production|test
HOST=0.0.0.0
PORT=3000
SESSION_SECRET=<secret>
SESSION_COOKIENAME=cmmv-session
JWT_SECRET=<secret>
JWT_SECRET_REFRESH=<secret>
VAULT_NAMESPACE=<namespace>
VAULT_PUBLIC_KEY=<key>
VAULT_PRIVATE_KEY=<key>
EMAIL_FROM=<email>
AWS_REGION=<region>
AWS_ACCESS_KEY_ID=<key>
AWS_SECRET_ACCESS_KEY=<secret>
RECAPTCHA_SECRET=<secret>
GOOGLE_CLIENT_ID=<id>
GOOGLE_CLIENT_SECRET=<secret>
```

**Module Dependencies:**
- Reflect-metadata (required for decorators)
- Fast-json-stringify (performance optimization)
- Class-transformer & Class-validator (validation)
- EventEmitter2 (event system)
- RxJS (reactive programming support)
