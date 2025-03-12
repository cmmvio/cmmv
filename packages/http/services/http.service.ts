import { AbstractService, Service } from '@cmmv/core';

@Service('http')
export class HttpService extends AbstractService {
    public name = 'http';

    private async request<T = any>(
        url: string,
        method: string,
        body?: any,
        config?: RequestInit,
    ): Promise<Response> {
        const headers = {
            'Content-Type': 'application/json',
            ...(config?.headers || {}),
        };

        const response = await fetch(url, {
            method,
            headers,
            body: body ? JSON.stringify(body) : undefined,
            ...config,
        });

        return response;
    }

    private async handleResponse<T = any>(response: Response): Promise<T> {
        const contentType = response.headers.get('content-type');
        let data: any;

        if (contentType && contentType.includes('application/json')) {
            data = await response.json();
        } else {
            data = await response.text();
        }

        return {
            data,
            status: response.status,
            statusText: response.statusText,
            headers: response.headers,
            config: {},
        } as any;
    }

    async get<T = any>(url: string, config?: RequestInit): Promise<T> {
        const response = await this.request<T>(url, 'GET', undefined, config);
        return this.handleResponse<T>(response);
    }

    async delete<T = any>(url: string, config?: RequestInit): Promise<T> {
        const response = await this.request<T>(
            url,
            'DELETE',
            undefined,
            config,
        );
        return this.handleResponse<T>(response);
    }

    async head<T = any>(url: string, config?: RequestInit): Promise<T> {
        const response = await this.request<T>(url, 'HEAD', undefined, config);
        return this.handleResponse<T>(response);
    }

    async post<T = any>(
        url: string,
        data?: any,
        config?: RequestInit,
    ): Promise<T> {
        const response = await this.request<T>(url, 'POST', data, config);
        return this.handleResponse<T>(response);
    }

    async put<T = any>(
        url: string,
        data?: any,
        config?: RequestInit,
    ): Promise<T> {
        const response = await this.request<T>(url, 'PUT', data, config);
        return this.handleResponse<T>(response);
    }

    async patch<T = any>(
        url: string,
        data?: any,
        config?: RequestInit,
    ): Promise<T> {
        const response = await this.request<T>(url, 'PATCH', data, config);
        return this.handleResponse<T>(response);
    }
}
