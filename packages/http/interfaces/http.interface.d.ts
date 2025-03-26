export interface IResponse<T = undefined> {
    status: number;
    processingTime: number;
    result: IReponseResult<T>;
}
export interface IReponseResult<T = undefined> {
    count?: number;
    message?: string;
    data?: Array<T>;
    pagination?: IResponsePagination;
}
export interface IResponsePagination {
    limit: number;
    offset: number;
    sortBy?: string;
    sort?: string;
    search?: string;
    searchField?: string;
    filters?: object;
}
export interface IOperationResult<T = undefined> {
    success?: boolean;
    affected?: number;
    data?: T;
}
