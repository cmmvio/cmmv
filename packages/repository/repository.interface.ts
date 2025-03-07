export interface IFindResponse {
    data: Array<any> | any;
    count?: number;
    pagination?: IFindPagination;
}

export interface IFindPagination {
    limit: number;
    offset: number;
    sortBy?: string;
    sort?: string;
    search?: string;
    searchField?: string;
    filters?: object;
}

export interface IInsertResponse {
    success: boolean;
    message?: string;
    data?: any;
}

export interface IFindOptions {
    resolvers?: string | string[];
}
