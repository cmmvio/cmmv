import { Module, Application } from '@cmmv/core';

import {
    ArgsType,
    Field,
    Resolver,
    Args,
    Arg,
    Query,
    ObjectType,
    Ctx,
    Authorized,
    ID,
    Mutation,
} from 'type-graphql';

import { AuthAutorizationService, AuthUsersService } from '@cmmv/auth';

import { GraphQLContext } from './graphql.types';

@ArgsType()
class LoginPayload {
    @Field()
    username!: string;

    @Field()
    password!: string;

    @Field({ nullable: true })
    token?: string;

    @Field({ nullable: true })
    opt?: string;
}

@ObjectType()
class LoginReturn {
    @Field()
    token!: string;

    @Field()
    refreshToken!: string;
}

@Resolver()
export class AuthResolver {
    private readonly authService: any;
    private readonly userService: any;

    constructor() {
        if (Module.hasModule('auth')) {
            this.authService = Application.resolveProvider(
                AuthAutorizationService,
            );
            this.userService = Application.resolveProvider(AuthUsersService);
        }
    }

    @Query((returns) => LoginReturn)
    async login(
        @Args() loginPayload: LoginPayload,
        @Ctx() ctx: GraphQLContext,
    ) {
        const authResult = await this.authService.login(
            loginPayload,
            ctx.req,
            null,
        );
        return authResult.result;
    }

    @Query((returns) => String)
    @Authorized()
    async refreshToken(@Ctx() ctx: GraphQLContext) {
        const refreshTokenResult = await this.authService.refreshToken(
            ctx.req,
            ctx,
        );
        return refreshTokenResult.token;
    }

    @Mutation((returns) => String)
    @Authorized({ rootOnly: true })
    async blockUser(@Arg('id') id: string) {
        return await this.userService.blockUser(id).message;
    }

    @Mutation((returns) => String)
    @Authorized({ rootOnly: true })
    async unblockUser(@Arg('id') id: string) {
        return await this.userService.unblockUser(id).message;
    }
}
