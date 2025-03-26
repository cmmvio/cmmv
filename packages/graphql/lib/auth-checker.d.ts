import { type AuthChecker } from 'type-graphql';
interface User {
    id: number;
    roles: string[];
}
interface Context {
    user?: User;
    token?: string;
}
export declare const authChecker: AuthChecker<Context>;
export {};
