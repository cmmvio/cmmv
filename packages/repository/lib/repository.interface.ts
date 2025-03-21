/**
 * Interface for the find response
 */
export interface IFindResponse {
    data: Array<any> | any;
    count?: number;
    pagination?: IFindPagination;
}

/**
 * Interface for the find pagination
 */
export interface IFindPagination {
    limit: number;
    offset: number;
    sortBy?: string;
    sort?: string;
    search?: string;
    searchField?: string;
    filters?: object;
}

/**
 * Interface for the insert response
 */
export interface IInsertResponse {
    success: boolean;
    message?: string;
    data?: any;
}

/**
 * Interface for the find options
 */
export interface IFindOptions {
    resolvers?: string | string[];
}
