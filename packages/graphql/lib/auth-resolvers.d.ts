import { GraphQLContext } from './graphql.types';
declare class LoginPayload {
    username: string;
    password: string;
    token?: string;
    opt?: string;
}
export declare class AuthResolver {
    private readonly authService;
    private readonly userService;
    constructor();
    login(loginPayload: LoginPayload, ctx: GraphQLContext): Promise<any>;
    refreshToken(ctx: GraphQLContext): Promise<any>;
    blockUser(id: string): Promise<any>;
    unblockUser(id: string): Promise<any>;
}
export {};
