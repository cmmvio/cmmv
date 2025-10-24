# OAuth Provider Integration

## Why

Currently, CMMV's @cmmv/auth module supports local authentication (email/password), JWT tokens, and 2FA, but lacks integration with third-party OAuth providers like Google, Facebook, GitHub, and Microsoft. This feature is marked as incomplete in the project README and is essential for modern web applications.

**Benefits:**
- Simplified user registration and login experience
- Reduced authentication implementation complexity for developers
- Industry-standard security practices
- Lower password management overhead
- Increased user adoption rates

## What Changes

- **ADDED**: OAuth 2.0 provider integration for Google, Facebook, GitHub, and Microsoft
- **ADDED**: Decorator-based OAuth configuration (@OAuth decorator)
- **ADDED**: Automatic user profile synchronization from providers
- **ADDED**: Account linking for users who register both locally and via OAuth
- **MODIFIED**: Auth module to support multiple authentication strategies
- **MODIFIED**: User contract to include OAuth provider fields
- **ADDED**: OAuth callback controllers with state verification
- **ADDED**: Configuration schema for OAuth providers

## Impact

- **Affected specs:** auth
- **Affected code:**
  - `packages/auth/lib/auth.module.ts` - Add OAuth providers
  - `packages/auth/contracts/users.contract.ts` - Add OAuth fields
  - `packages/auth/controllers/` - New OAuth callback controllers
  - `packages/auth/services/` - New OAuth services
  - `packages/auth/lib/auth.config.ts` - OAuth configuration
  - `config.ts` - OAuth provider credentials

- **Breaking Changes:** None (additive only)
- **Database Migration:** Required (add OAuth columns to users table)
- **Configuration Required:** OAuth provider credentials (client IDs and secrets)

