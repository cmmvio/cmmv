"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.HttpService = void 0;
const tslib_1 = require("tslib");
const core_1 = require("@cmmv/core");
let HttpService = class HttpService extends core_1.AbstractService {
    constructor() {
        super(...arguments);
        this.name = 'http';
    }
    async request(url, method, body, config) {
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
    async handleResponse(response) {
        const contentType = response.headers.get('content-type');
        let data;
        if (contentType && contentType.includes('application/json')) {
            data = await response.json();
        }
        else {
            data = await response.text();
        }
        return {
            data,
            status: response.status,
            statusText: response.statusText,
            headers: response.headers,
            config: {},
        };
    }
    async get(url, config) {
        const response = await this.request(url, 'GET', undefined, config);
        return this.handleResponse(response);
    }
    async delete(url, config) {
        const response = await this.request(url, 'DELETE', undefined, config);
        return this.handleResponse(response);
    }
    async head(url, config) {
        const response = await this.request(url, 'HEAD', undefined, config);
        return this.handleResponse(response);
    }
    async post(url, data, config) {
        const response = await this.request(url, 'POST', data, config);
        return this.handleResponse(response);
    }
    async put(url, data, config) {
        const response = await this.request(url, 'PUT', data, config);
        return this.handleResponse(response);
    }
    async patch(url, data, config) {
        const response = await this.request(url, 'PATCH', data, config);
        return this.handleResponse(response);
    }
};
exports.HttpService = HttpService;
exports.HttpService = HttpService = tslib_1.__decorate([
    (0, core_1.Service)('http')
], HttpService);
