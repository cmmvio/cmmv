import { AbstractService } from '@cmmv/core';
export declare class HttpService extends AbstractService {
    name: string;
    private request;
    private handleResponse;
    get<T = any>(url: string, config?: RequestInit): Promise<T>;
    delete<T = any>(url: string, config?: RequestInit): Promise<T>;
    head<T = any>(url: string, config?: RequestInit): Promise<T>;
    post<T = any>(url: string, data?: any, config?: RequestInit): Promise<T>;
    put<T = any>(url: string, data?: any, config?: RequestInit): Promise<T>;
    patch<T = any>(url: string, data?: any, config?: RequestInit): Promise<T>;
}
