# Proposal: Increase Test Coverage

## Why

The current test coverage across CMMV packages is approximately 23.36% overall, which is significantly below the target thresholds (80% lines, 80% functions, 70% branches). Low test coverage creates risks when using AI-assisted development, as changes may introduce regressions that aren't caught by automated tests.

## What Changes

This task will increase test coverage across all CMMV packages by creating comprehensive test suites for all public APIs. The approach will be priority-based, focusing on core packages first (@cmmv/core, @cmmv/http, @cmmv/repository), then expanding to other packages. Unit tests will be created for all exported functions and classes, and integration tests will be added for critical flows like authentication, HTTP routing, and repository operations. The existing @cmmv/testing package will be leveraged for consistent mocking patterns.

## Current Coverage by Package

| Package | Statements | Branches | Functions | Lines | Priority |
|---------|------------|----------|-----------|-------|----------|
| @cmmv/core | 38% | 85.95% | 54.08% | 38% | HIGH |
| @cmmv/http | 17.39% | 100% | 2.38% | 17.39% | HIGH |
| @cmmv/repository | ~40% | ~90% | ~50% | ~40% | HIGH |
| @cmmv/auth | 17.19% | 50% | 26.19% | 17.19% | MEDIUM |
| @cmmv/cache | 33.33% | 66.66% | 58.33% | 33.33% | MEDIUM |
| @cmmv/graphql | 0% | 0% | 0% | 0% | HIGH |
| @cmmv/email | 0% | 0% | 0% | 0% | MEDIUM |
| @cmmv/keyv | 0% | 0% | 0% | 0% | LOW |
| @cmmv/openapi | 0% | 12.5% | 12.5% | 0% | MEDIUM |
| @cmmv/protobuf | 10.17% | 57.69% | 61.53% | 10.17% | MEDIUM |
| @cmmv/ws | 0% | 0% | 0% | 0% | MEDIUM |
| @cmmv/vault | 0% | 0% | 0% | 0% | LOW |
| @cmmv/throttler | 0% | 0% | 0% | 0% | LOW |
| @cmmv/sandbox | 0% | 0% | 0% | 0% | LOW |

## Proposed Solution

1. **Priority-based approach**: Focus on core packages first (@cmmv/core, @cmmv/http, @cmmv/repository)
2. **Unit tests for all public APIs**: Every exported function/class should have tests
3. **Integration tests for critical flows**: Auth, HTTP routing, repository operations
4. **Mock utilities**: Leverage existing @cmmv/testing package for consistent mocking

## Success Criteria

- All packages achieve minimum 80% line coverage
- All packages achieve minimum 80% function coverage
- All packages achieve minimum 70% branch coverage
- No regressions in existing functionality
- Tests are maintainable and well-documented

## Estimated Effort

This is a significant undertaking that will require:
- Analysis of each package's public API
- Creation of comprehensive test suites
- Integration test scenarios
- Documentation updates

## Risks and Mitigations

| Risk | Mitigation |
|------|------------|
| Breaking existing tests | Run full test suite after each change |
| Over-mocking | Use real implementations where possible |
| Test maintenance burden | Follow consistent patterns, document test utilities |
