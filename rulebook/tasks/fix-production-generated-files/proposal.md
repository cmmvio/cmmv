# Proposal: Fix Production Mode - .generated Files Not Recognized

## Why

The API works correctly in development mode but fails in production mode. The root cause is that files in the `.generated` directory are not properly recognized and loaded in production because:

1. **Development uses @swc-node/register** for on-the-fly TypeScript transpilation, which resolves path aliases at runtime
2. **Production does NOT use @swc-node/register**, so path aliases (like `@controllers`, `@services`) are NOT resolved by Node.js
3. **The `.generated/` directory is NOT included in the build process**, so generated files never become `.js` files in `dist/`
4. **Generated imports use TypeScript path aliases** that only work with TypeScript tooling or SWC runtime

This is a critical bug affecting all production deployments of CMMV applications.

## What Changes

### Solution: Use @swc-node/register in Production

The project already uses `@swc-node/register` in development mode via nodemon. The same approach should be used in production to maintain consistency and leverage SWC's Rust-based performance.

**Why @swc-node/register:**
- Written in Rust, extremely fast (10-20x faster than tsc)
- Already a project dependency (no new dependencies needed)
- Resolves TypeScript path aliases at runtime
- Maintains the same behavior in dev and prod
- No build step changes required for .generated files

### Core Changes Required

1. **Update package.json start scripts**
   - Add production start script using `@swc-node/register`
   - Example: `"start:prod": "NODE_ENV=production node -r @swc-node/register ./src/main.ts"`

2. **Update application.ts production module loading**
   - `packages/core/application.ts` lines 195-211
   - Ensure it loads TypeScript files directly instead of looking for compiled `.js` files
   - Remove the distinction between dev/prod file loading since both use SWC

3. **Update documentation**
   - Document the production startup command
   - Update any deployment guides

### Files Affected

| File | Change Type |
|------|-------------|
| `package.json` | MODIFIED - Add start:prod script with @swc-node/register |
| `packages/core/application.ts` | MODIFIED - Simplify module loading (no dev/prod distinction) |
| `README.md` or docs | MODIFIED - Document production startup |

## Impact

- **Affected specs**: core, build system
- **Affected code**: Application bootstrap and module loading
- **Breaking change**: NO - This is a bug fix, not a breaking change
- **User benefit**: CMMV applications will work correctly in production mode with path aliases preserved
- **Performance**: SWC is written in Rust and provides excellent runtime performance
