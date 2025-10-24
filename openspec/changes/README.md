# CMMV Improvement Proposals

This directory contains OpenSpec change proposals for enhancing the CMMV framework. Each proposal follows the three-stage OpenSpec workflow: Planning → Implementation → Archiving.

**Total Proposals:** 7  
**Total Tasks:** 637  
**Estimated Effort:** 20-22 weeks

## Active Proposals

### 1. OAuth Provider Integration
**Location:** `add-oauth-providers/`  
**Status:** Awaiting Approval  
**Priority:** HIGH  

Adds OAuth 2.0 authentication with Google, Facebook, GitHub, and Microsoft. Includes @OAuth decorator, account linking, and automatic profile synchronization.

**Key Features:**
- Multiple OAuth provider support
- Account linking between local and OAuth accounts
- Security best practices (state verification, PKCE)
- Automatic user profile sync

**Impact:** Database migration required, no breaking changes

---

### 2. API Versioning Support
**Location:** `add-api-versioning/`  
**Status:** Awaiting Approval  
**Priority:** HIGH  

Implements comprehensive API versioning with multiple strategies (URI, header, media type). Includes @Version decorator and deprecation support.

**Key Features:**
- Multiple versioning strategies
- @Version decorator for controllers/routes
- Deprecation warnings and sunset dates
- Multi-version OpenAPI documentation

**Impact:** Additive only, existing routes default to v1

---

### 3. Health Checks and Observability
**Location:** `add-health-observability/`  
**Status:** Awaiting Approval  
**Priority:** CRITICAL  

Production-ready health checks and observability features including Kubernetes probes, Prometheus metrics, and distributed tracing.

**Key Features:**
- /health/live and /health/ready endpoints
- Prometheus metrics endpoint
- Distributed tracing (OpenTelemetry)
- Structured logging (JSON)
- Graceful shutdown
- Resource monitoring

**Impact:** New packages, optional dependencies, minimal performance overhead

---

### 4. Enhanced Throttler
**Location:** `enhance-throttler/`  
**Status:** Awaiting Approval  
**Priority:** HIGH  

Upgrades throttler with decorator support, distributed rate limiting via Redis, and industry-standard rate limit headers.

**Key Features:**
- @RateLimit() decorator
- Redis-backed distributed limiting
- Multiple strategies (IP, user, API key)
- Rate limit headers (X-RateLimit-*)
- Burst allowance
- Custom key generators

**Impact:** Backward compatible, optional Redis

---

### 5. Centralized Error Handling
**Location:** `add-error-handling/`  
**Status:** Awaiting Approval  
**Priority:** HIGH  

Exception filter system for centralized, consistent error handling with RFC 7807 Problem Details format.

**Key Features:**
- Exception filter system
- @Catch() decorator
- RFC 7807 Problem Details format
- Built-in exception classes
- Error context with correlation IDs
- Structured error logging

**Impact:** Additive only, cleaner controller code

---

### 6. Application Scopes for Multi-Agent
**Location:** `add-application-scopes/`  
**Status:** Awaiting Approval  
**Priority:** CRITICAL  

Enables multiple isolated CMMV applications in the same process for multi-agent architectures (MCP, A2A, Workers).

**Key Features:**
- Three scope levels (singleton, agent, request)
- ApplicationFactory and AppRegistry
- Scoped DI containers with lifetimes
- AsyncLocalStorage context propagation
- Independent lifecycle per app
- Isolated caches, logs, registries

**Impact:** Backward compatible, enables multi-agent scenarios

---

### 7. Comprehensive Test Coverage (95%+)
**Location:** `improve-test-coverage/`  
**Status:** Awaiting Approval  
**Priority:** CRITICAL  

Increase test coverage from 53% to 95%+ across all packages with comprehensive unit, integration, E2E, and security tests.

**Key Features:**
- Coverage configuration with 95% threshold
- Critical package tests (vault, auth, throttler)
- API layer tests (http, ws)
- Integration and E2E test suites
- Security vulnerability tests
- CI/CD integration with coverage enforcement
- Enhanced mock utilities

**Impact:** Significantly improves code quality and reliability, prevents regressions

**Effort:** 12 weeks (267 tasks)

---

## How to Use These Proposals

### 1. Review
```bash
# View proposal details
cat add-oauth-providers/proposal.md

# View technical specifications
cat add-oauth-providers/specs/auth/spec.md

# View implementation tasks
cat add-oauth-providers/tasks.md
```

### 2. Validate
```bash
# Validate a specific proposal
openspec validate add-oauth-providers --strict

# Validate all proposals
openspec validate --strict
```

### 3. Implement
```bash
# Show proposal details
openspec show add-oauth-providers

# Follow tasks.md checklist
# Mark tasks as complete in tasks.md as you work
```

### 4. Archive (After Deployment)
```bash
# Archive completed proposal
openspec archive add-oauth-providers --yes

# This moves the proposal to archive/ and updates specs/
```

## Proposal Structure

Each proposal contains:

```
add-feature-name/
├── proposal.md           # Why, what changes, impact
├── tasks.md              # Implementation checklist
├── design.md             # Technical decisions (if needed)
└── specs/
    └── capability/
        └── spec.md       # ADDED/MODIFIED/REMOVED requirements
```

## Priority Recommendations

**Critical (Implement First):**
1. **Comprehensive Test Coverage (95%+)** - Foundation for all other changes
2. **Health Checks and Observability** - Essential for production
3. **Application Scopes** - Multi-agent architecture support

**High Priority:**
4. Centralized Error Handling - Improves DX and debugging
5. Enhanced Throttler - Security and scalability
6. OAuth Provider Integration - Complete documented feature
7. API Versioning - Long-term API management

## Estimated Effort

| Proposal | Complexity | Estimated Time |
|----------|------------|----------------|
| Health Checks & Observability | High | 14 days |
| OAuth Provider Integration | Medium | 10 days |
| API Versioning | Medium | 9 days |
| Enhanced Throttler | Medium | 7 days |
| Centralized Error Handling | Medium | 7 days |
| Application Scopes | High | 12 days |
| **Comprehensive Test Coverage** | **Critical** | **12 weeks** |
| **Total** | | **20-22 weeks** |

## Additional Resources

- **Analysis:** `../ANALYSIS.md` - Complete project analysis
- **Getting Started:** `../GETTING_STARTED.md` - OpenSpec workflow guide
- **Project Context:** `../project.md` - CMMV conventions and stack
- **Agent Instructions:** `../AGENTS.md` - AI assistant guidelines

## Contributing

When implementing a proposal:

1. Read the proposal, design (if exists), and spec deltas
2. Follow tasks.md sequentially
3. Check off completed tasks
4. Write tests for new functionality
5. Update documentation
6. Archive after deployment

## Status Legend

- **Awaiting Approval:** Proposal is complete, waiting for team approval
- **In Progress:** Implementation has started
- **Ready for Review:** Implementation complete, awaiting code review
- **Deployed:** Feature is in production
- **Archived:** Moved to `archive/` after deployment

---

**Note:** All proposals follow CMMV conventions (4-space indentation, single quotes, TypeScript decorators, etc.) as documented in `../project.md`.

