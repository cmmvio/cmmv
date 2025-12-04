# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project Overview

CMMV (Contract-Model-Model-View) is a TypeScript framework for building scalable web applications using contract-based development. It auto-generates APIs, controllers, ORM entities, and RPC communication from TypeScript contracts.

## Common Commands

```bash
# Development
pnpm run dev                    # Start dev server with hot reload (uses @swc-node/register)
pnpm run compile                # Compile contracts and generate files

# Production
pnpm run start                  # Start production server (uses @swc-node/register)
pnpm run start:prod             # Same as start

# Build
pnpm run build                  # Build all packages (dev mode)
pnpm run build:prod             # Build all packages (production)

# Testing
pnpm run test                   # Run all tests with vitest
pnpm run test:run               # Run tests once (no watch)
pnpm run test:coverage          # Run tests with coverage report
pnpm run test:watch             # Run tests in watch mode

# Code Quality
pnpm run lint                   # Run ESLint on packages and specs
pnpm run lint:fix               # Run ESLint with auto-fix
pnpm run format                 # Format code with Prettier

# Database
pnpm run migration:run          # Run TypeORM migrations
pnpm run schema:sync            # Sync database schema
```

## Architecture

### Monorepo Structure

The project is a monorepo with packages in `packages/`:

- **@cmmv/core** - Application lifecycle, contracts, decorators, transpilers, modules
- **@cmmv/http** - HTTP server, controllers, SSR view engine
- **@cmmv/ws** - WebSocket gateway for RPC
- **@cmmv/repository** - TypeORM integration, auto-generated entities
- **@cmmv/auth** - Authentication, sessions, 2FA
- **@cmmv/cache** - Redis/Memcached/MongoDB caching
- **@cmmv/protobuf** - Protocol buffer generation from contracts
- **@cmmv/graphql** - GraphQL integration
- **@cmmv/vault** - AES-256-GCM & ECC encryption
- **@cmmv/openapi** - OpenAPI documentation generation

### Contract-Driven Development

Contracts define the data model and automatically generate:
- Controllers (`@controllers/`)
- Services (`@services/`)
- Entities (`@entities/`)
- Models (`@models/`)
- Gateways (`@gateways/`)
- Proto files (`@protos/`)

Generated files go to `.generated/` directory.

### Key Patterns

**Contract Definition:**
```typescript
@Contract({
    controllerName: 'User',
    generateController: true,
    generateEntities: true,
})
export class UserContract {
    @ContractField({ protoType: 'string' })
    name: string;
}
```

**Module System:**
```typescript
new Module("moduleName", {
    controllers: [...],
    providers: [...],
    transpilers: [...],
});
```

**Application Bootstrap:**
```typescript
Application.create({
    httpAdapter: DefaultAdapter,
    modules: [DefaultHTTPModule, ApplicationModule],
    contracts: [UserContract],
});
```

### Transpilers

Transpilers process contracts and generate code. Custom transpilers extend `ITranspile` interface and are registered in modules.

### Path Aliases

TypeScript path aliases are resolved at runtime via `@swc-node/register`:
- `@cmmv/*` → `packages/*`
- `@controllers/*` → `src/controllers/*` or `.generated/controllers/*`
- `@services/*` → `src/services/*` or `.generated/services/*`
- `@entities/*` → `src/entities/*` or `.generated/entities/*`
- `@models/*` → `src/models/*` or `.generated/models/*`

## Quality Requirements

- 95%+ test coverage required
- ESLint must pass with zero warnings
- All tests must pass before committing
- Run `pnpm run lint && pnpm run test:run` before commits

## Task Management

This project uses Rulebook task management. See `/rulebook/RULEBOOK.md` for task creation guidelines. Tasks follow OpenSpec-compatible format with:
- `proposal.md` - Why and what changes
- `tasks.md` - Simple checklist only
- `specs/<module>/spec.md` - Technical specifications with SHALL/MUST requirements

## Important Files

- `src/main.ts` - Application entry point
- `src/compile.ts` - Compilation entry point
- `.cmmv.config.js` - CMMV configuration
- `nodemon.json` - Dev server configuration
- `vitest.config.ts` - Test configuration
