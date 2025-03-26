"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.AuthResolver = void 0;
const tslib_1 = require("tslib");
const core_1 = require("@cmmv/core");
const type_graphql_1 = require("type-graphql");
const auth_1 = require("@cmmv/auth");
let LoginPayload = class LoginPayload {
};
tslib_1.__decorate([
    (0, type_graphql_1.Field)(),
    tslib_1.__metadata("design:type", String)
], LoginPayload.prototype, "username", void 0);
tslib_1.__decorate([
    (0, type_graphql_1.Field)(),
    tslib_1.__metadata("design:type", String)
], LoginPayload.prototype, "password", void 0);
tslib_1.__decorate([
    (0, type_graphql_1.Field)({ nullable: true }),
    tslib_1.__metadata("design:type", String)
], LoginPayload.prototype, "token", void 0);
tslib_1.__decorate([
    (0, type_graphql_1.Field)({ nullable: true }),
    tslib_1.__metadata("design:type", String)
], LoginPayload.prototype, "opt", void 0);
LoginPayload = tslib_1.__decorate([
    (0, type_graphql_1.ArgsType)()
], LoginPayload);
let LoginReturn = class LoginReturn {
};
tslib_1.__decorate([
    (0, type_graphql_1.Field)(),
    tslib_1.__metadata("design:type", String)
], LoginReturn.prototype, "token", void 0);
tslib_1.__decorate([
    (0, type_graphql_1.Field)(),
    tslib_1.__metadata("design:type", String)
], LoginReturn.prototype, "refreshToken", void 0);
LoginReturn = tslib_1.__decorate([
    (0, type_graphql_1.ObjectType)()
], LoginReturn);
let AuthResolver = class AuthResolver {
    constructor() {
        if (core_1.Module.hasModule('auth')) {
            this.authService = core_1.Application.resolveProvider(auth_1.AuthAutorizationService);
            this.userService = core_1.Application.resolveProvider(auth_1.AuthUsersService);
        }
    }
    async login(loginPayload, ctx) {
        const authResult = await this.authService.login(loginPayload, ctx.req, null);
        return authResult.result;
    }
    async refreshToken(ctx) {
        const refreshTokenResult = await this.authService.refreshToken(ctx.req, ctx);
        return refreshTokenResult.token;
    }
    async blockUser(id) {
        return await this.userService.blockUser(id).message;
    }
    async unblockUser(id) {
        return await this.userService.unblockUser(id).message;
    }
};
exports.AuthResolver = AuthResolver;
tslib_1.__decorate([
    (0, type_graphql_1.Query)((returns) => LoginReturn),
    tslib_1.__param(0, (0, type_graphql_1.Args)()),
    tslib_1.__param(1, (0, type_graphql_1.Ctx)()),
    tslib_1.__metadata("design:type", Function),
    tslib_1.__metadata("design:paramtypes", [LoginPayload, Object]),
    tslib_1.__metadata("design:returntype", Promise)
], AuthResolver.prototype, "login", null);
tslib_1.__decorate([
    (0, type_graphql_1.Query)((returns) => String),
    (0, type_graphql_1.Authorized)(),
    tslib_1.__param(0, (0, type_graphql_1.Ctx)()),
    tslib_1.__metadata("design:type", Function),
    tslib_1.__metadata("design:paramtypes", [Object]),
    tslib_1.__metadata("design:returntype", Promise)
], AuthResolver.prototype, "refreshToken", null);
tslib_1.__decorate([
    (0, type_graphql_1.Mutation)((returns) => String),
    (0, type_graphql_1.Authorized)({ rootOnly: true }),
    tslib_1.__param(0, (0, type_graphql_1.Arg)('id')),
    tslib_1.__metadata("design:type", Function),
    tslib_1.__metadata("design:paramtypes", [String]),
    tslib_1.__metadata("design:returntype", Promise)
], AuthResolver.prototype, "blockUser", null);
tslib_1.__decorate([
    (0, type_graphql_1.Mutation)((returns) => String),
    (0, type_graphql_1.Authorized)({ rootOnly: true }),
    tslib_1.__param(0, (0, type_graphql_1.Arg)('id')),
    tslib_1.__metadata("design:type", Function),
    tslib_1.__metadata("design:paramtypes", [String]),
    tslib_1.__metadata("design:returntype", Promise)
], AuthResolver.prototype, "unblockUser", null);
exports.AuthResolver = AuthResolver = tslib_1.__decorate([
    (0, type_graphql_1.Resolver)(),
    tslib_1.__metadata("design:paramtypes", [])
], AuthResolver);
