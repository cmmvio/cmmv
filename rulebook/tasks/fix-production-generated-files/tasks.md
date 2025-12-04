# Tasks: Fix Production Mode - .generated Files Not Recognized

## Progress: 37% (3/8 tasks complete)

## 1. Implementation Phase
- [x] 1.1 Add `start:prod` script to package.json using `@swc-node/register`
- [x] 1.2 Review and simplify `application.ts` module loading logic (load .ts instead of .js in prod)
- [x] 1.3 Ensure `.generated/` files are loaded correctly with SWC in both environments

## 2. Testing Phase
- [ ] 2.1 Test development mode still works (`npm run dev`)
- [ ] 2.2 Test production mode starts correctly (`npm run start:prod`)
- [ ] 2.3 Verify all controllers and services from `.generated/` are loaded in production
- [ ] 2.4 Verify path aliases (@controllers, @services, etc.) resolve correctly

## 3. Documentation Phase
- [ ] 3.1 Update CHANGELOG.md with the fix
