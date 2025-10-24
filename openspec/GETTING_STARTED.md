# OpenSpec Workflow for CMMV

## Overview

OpenSpec is a specification-driven development methodology that helps maintain consistency between what you plan to build (specs) and what you actually build (code). This guide explains how to use OpenSpec with the CMMV framework.

## Three-Stage Development Cycle

### Stage 1: Planning (Creating Change Proposals)

**When to create a proposal:**
- ✅ Adding new features or capabilities
- ✅ Making breaking changes (API, schema, architecture)
- ✅ Significant performance optimizations
- ✅ Security pattern changes
- ❌ Simple bug fixes (just fix directly)
- ❌ Typos, formatting, comments
- ❌ Non-breaking dependency updates

**Workflow:**

1. **Check existing specs and changes:**
```bash
# See what capabilities already exist
openspec list --specs

# See what changes are in progress
openspec list

# Search for related requirements
rg -n "Requirement:|Scenario:" openspec/specs
```

2. **Create your change directory:**
```bash
# Choose a unique, verb-led change ID
CHANGE=add-rate-limiting
mkdir -p openspec/changes/$CHANGE/specs
```

3. **Write proposal.md:**
```markdown
## Why
We need to protect our API from abuse and ensure fair usage across all users.

## What Changes
- Add rate limiting middleware to @cmmv/throttler
- Configure limits per endpoint and user role
- Add Redis-based distributed rate limiting

## Impact
- Affected specs: http, auth
- Affected code: packages/throttler, packages/http
- **BREAKING**: New middleware configuration required in config.ts
```

4. **Create spec deltas:**

Create `openspec/changes/add-rate-limiting/specs/throttler/spec.md`:

```markdown
## ADDED Requirements

### Requirement: Rate Limiting
The system SHALL enforce configurable rate limits on API endpoints.

#### Scenario: Rate limit exceeded
- **WHEN** a user exceeds the configured rate limit
- **THEN** the system returns HTTP 429 (Too Many Requests)
- **AND** includes Retry-After header

#### Scenario: Rate limit within bounds
- **WHEN** a user makes requests within the rate limit
- **THEN** the system processes the request normally
- **AND** includes X-RateLimit-* headers

### Requirement: Distributed Rate Limiting
The system SHALL support distributed rate limiting using Redis.

#### Scenario: Multiple server instances
- **WHEN** running multiple server instances
- **THEN** rate limits are enforced across all instances
- **AND** uses Redis as the shared state store
```

5. **Create tasks.md:**
```markdown
## 1. Implementation
- [ ] 1.1 Create rate limiting middleware
- [ ] 1.2 Add Redis integration for distributed limiting
- [ ] 1.3 Add configuration options to config.ts
- [ ] 1.4 Create decorator @RateLimit()
- [ ] 1.5 Update HTTP module to register middleware

## 2. Testing
- [ ] 2.1 Unit tests for rate limiting logic
- [ ] 2.2 Integration tests with Redis
- [ ] 2.3 E2E tests for rate-limited endpoints

## 3. Documentation
- [ ] 3.1 Update @cmmv/throttler README
- [ ] 3.2 Add configuration examples
- [ ] 3.3 Update CHANGELOG
```

6. **Validate your proposal:**
```bash
openspec validate add-rate-limiting --strict
```

7. **Request approval** (from team lead or in PR)

### Stage 2: Implementation (Building)

**Workflow:**

1. **Read the proposal:**
```bash
openspec show add-rate-limiting
```

2. **Implement tasks one by one:**
   - Work through tasks.md sequentially
   - Check off items as you complete them
   - Keep commits aligned with tasks

3. **Update task checklist:**
```markdown
## 1. Implementation
- [x] 1.1 Create rate limiting middleware
- [x] 1.2 Add Redis integration for distributed limiting
- [ ] 1.3 Add configuration options to config.ts  ← currently working
- [ ] 1.4 Create decorator @RateLimit()
- [ ] 1.5 Update HTTP module to register middleware
```

4. **Run tests and validation:**
```bash
# Run tests
pnpm test

# Validate the change still passes
openspec validate add-rate-limiting --strict
```

### Stage 3: Archiving (After Deployment)

**When:** After the feature is deployed to production

**Workflow:**

1. **Archive the change:**
```bash
openspec archive add-rate-limiting --yes
```

This will:
- Move `changes/add-rate-limiting/` → `changes/archive/YYYY-MM-DD-add-rate-limiting/`
- Merge spec deltas into `specs/throttler/spec.md`
- Update the main specifications

2. **Validate everything still works:**
```bash
openspec validate --strict
```

3. **Commit the archive:**
```bash
git add openspec/
git commit -m "docs(openspec): archive add-rate-limiting change"
git push
```

## Key OpenSpec Commands

```bash
# List all active changes
openspec list

# List all specifications
openspec list --specs

# Show details of a change or spec
openspec show add-rate-limiting
openspec show throttler --type spec

# Show what changed in a proposal
openspec diff add-rate-limiting

# Validate a change
openspec validate add-rate-limiting --strict

# Validate everything
openspec validate --strict

# Archive a completed change
openspec archive add-rate-limiting --yes

# Initialize OpenSpec in a new project
openspec init

# Update OpenSpec instruction files
openspec update
```

## Spec File Format

### Critical Rules

**Scenario Headers:**
```markdown
✅ CORRECT:
#### Scenario: User login success

❌ WRONG:
- **Scenario: User login**
**Scenario**: User login
### Scenario: User login
```

**Requirement Structure:**
- Every requirement MUST have at least one scenario
- Use SHALL/MUST for normative requirements
- Use WHEN/THEN format for scenarios

**Delta Operations:**
- `## ADDED Requirements` - New capabilities
- `## MODIFIED Requirements` - Changed behavior (paste complete updated requirement)
- `## REMOVED Requirements` - Deprecated features
- `## RENAMED Requirements` - Name changes only

### Example: MODIFIED Requirements

```markdown
## MODIFIED Requirements

### Requirement: User Authentication
The system SHALL authenticate users using JWT tokens with configurable expiration.

#### Scenario: Successful authentication
- **WHEN** user provides valid credentials
- **THEN** system returns JWT token
- **AND** token expires in configured time

#### Scenario: Token expiration
- **WHEN** user presents an expired token
- **THEN** system returns HTTP 401
- **AND** includes WWW-Authenticate header
```

**Important:** When using MODIFIED, include the ENTIRE updated requirement, not just the changes.

## Working with AI Assistants

### Triggering OpenSpec Mode

The AI will automatically use OpenSpec when you mention:
- "proposal" or "change proposal"
- "spec" or "specification"
- "plan" with feature requests
- Breaking changes or architecture shifts

### Example Requests

**Creating a Proposal:**
```
I want to add real-time notifications using WebSocket.
Please create an OpenSpec change proposal for this feature.
```

**Implementing a Change:**
```
Let's implement the add-rate-limiting change.
Follow the tasks.md checklist.
```

**Reviewing Specs:**
```
Show me the current specifications for the auth module.
What requirements do we have for 2FA?
```

## Best Practices

### Keep It Simple
- Default to <100 lines of new code per change
- Single-file implementations until proven insufficient
- Avoid frameworks without clear justification
- Choose boring, proven patterns

### When to Add Complexity
Only add complexity with:
- Performance data showing current solution is too slow
- Concrete scale requirements (>1000 users, >100MB data)
- Multiple proven use cases requiring abstraction

### Capability Naming
- Use verb-noun format: `user-auth`, `rate-limiting`, `file-upload`
- Single purpose per capability
- 10-minute understandability rule
- Split if description needs "AND"

### Change ID Naming
- Use kebab-case
- Verb-led prefixes: `add-`, `update-`, `remove-`, `refactor-`
- Short and descriptive
- Ensure uniqueness (append `-2`, `-3` if needed)

## Common Scenarios

### Scenario 1: Adding a New Module

```bash
# 1. Create change
CHANGE=add-queue-module
mkdir -p openspec/changes/$CHANGE/specs/queue

# 2. Write proposal explaining why we need queue management

# 3. Create spec delta with all requirements
# - Job scheduling
# - Worker management
# - Dead letter queues
# - etc.

# 4. Validate
openspec validate $CHANGE --strict

# 5. Get approval, implement, test, deploy

# 6. Archive
openspec archive $CHANGE --yes
```

### Scenario 2: Breaking Change to Existing Module

```bash
# 1. Create change
CHANGE=update-auth-jwt-algorithm
mkdir -p openspec/changes/$CHANGE/specs/auth

# 2. Mark as BREAKING in proposal.md

# 3. Use MODIFIED Requirements in spec delta
# Include migration path in REMOVED section if deprecating old behavior

# 4. Validate and proceed
```

### Scenario 3: Multi-Capability Change

```bash
# 1. Create change affecting multiple specs
CHANGE=add-2fa-with-email
mkdir -p openspec/changes/$CHANGE/specs/{auth,email}

# 2. Create separate spec.md for each capability:
#    - specs/auth/spec.md (ADDED: Two-Factor Authentication)
#    - specs/email/spec.md (ADDED: OTP Email Notification)

# 3. Single proposal.md and tasks.md for entire change
```

## Troubleshooting

### "Change must have at least one delta"
- Check `changes/[name]/specs/` exists with .md files
- Verify files have operation prefixes (## ADDED Requirements)

### "Requirement must have at least one scenario"
- Check scenarios use `#### Scenario:` format (4 hashtags)
- Don't use bullet points or bold for scenario headers

### Silent Scenario Parsing Failures
```bash
# Debug with JSON output
openspec show $CHANGE --json --deltas-only
```

### Validation Errors
```bash
# Always use strict mode
openspec validate $CHANGE --strict

# Check specific requirement
openspec show throttler --json -r 1
```

## Integration with CMMV

### Contract Changes
When changing contracts that generate code:
1. Create OpenSpec proposal first
2. Define requirements and scenarios
3. Implement contract changes
4. Verify generated code matches specs
5. Archive after deployment

### Module Changes
For @cmmv/* package changes:
1. Create spec in `specs/[module-name]/spec.md`
2. Document all public APIs and behaviors
3. Include error scenarios
4. Test against specs
5. Update package README to reference spec

### Configuration Changes
For `config.ts` changes:
1. Document in relevant module spec
2. Include default values
3. Document environment variable mappings
4. Test with different configurations

## Questions?

- Check `openspec/AGENTS.md` for AI assistant instructions
- Check `openspec/project.md` for CMMV project conventions
- Run `openspec --help` for command reference
- Review `openspec/changes/archive/` for examples

