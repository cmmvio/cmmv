export interface IResponse {
    status: number;
    processingTime: number;
    result: IReponseResult;
}

export interface IReponseResult {
    success: boolean;
    message?: string;
    data?: Array<any> | any | object;
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
