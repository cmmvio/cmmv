export interface GraphQLContext {
    req: Request;
    token?: string;
    refreshToken?: string;
}
export interface IPaginationArgs {
    limit?: number;
    offset?: number;
    sortBy?: string;
    sort?: string;
    search?: string;
    searchField?: string;
    filters?: Record<string, any>;
}
export declare class PaginationResponse implements IPaginationArgs {
    limit?: number;
    offset?: number;
    sortBy?: string;
    sort?: string;
    search?: string;
    searchField?: string;
    filters?: Record<string, any>;
}
export declare class PaginationArgs {
    limit?: number;
    offset?: number;
    sortBy?: string;
    sort?: string;
    search?: string;
    searchField?: string;
    filters?: Record<string, any>;
}
