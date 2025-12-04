import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';

// Mock @cmmv/core
vi.mock('@cmmv/core', () => ({
    AbstractService: class AbstractService {},
    Service: vi.fn(() => (target: any) => target),
}));

// Mock global fetch
const mockFetch = vi.fn();
global.fetch = mockFetch;

import { HttpService } from '../../services/http.service';

describe('HttpService', () => {
    let httpService: HttpService;

    beforeEach(() => {
        vi.clearAllMocks();
        httpService = new HttpService();
    });

    afterEach(() => {
        vi.clearAllMocks();
    });

    describe('constructor', () => {
        it('should create an instance', () => {
            expect(httpService).toBeDefined();
            expect(httpService).toBeInstanceOf(HttpService);
        });

        it('should have name property set to http', () => {
            expect(httpService.name).toBe('http');
        });
    });

    describe('get', () => {
        it('should make GET request', async () => {
            const mockResponse = {
                status: 200,
                statusText: 'OK',
                headers: new Headers({ 'content-type': 'application/json' }),
                json: vi.fn().mockResolvedValue({ data: 'test' }),
            };
            mockFetch.mockResolvedValue(mockResponse);

            const result = await httpService.get('https://api.example.com/data');

            expect(mockFetch).toHaveBeenCalledWith('https://api.example.com/data', {
                method: 'GET',
                headers: { 'Content-Type': 'application/json' },
                body: undefined,
            });
            expect(result.status).toBe(200);
            expect(result.data).toEqual({ data: 'test' });
        });

        it('should pass custom headers', async () => {
            const mockResponse = {
                status: 200,
                statusText: 'OK',
                headers: new Headers({ 'content-type': 'application/json' }),
                json: vi.fn().mockResolvedValue({}),
            };
            mockFetch.mockResolvedValue(mockResponse);

            await httpService.get('https://api.example.com/data', {
                headers: { Authorization: 'Bearer token123' },
            });

            expect(mockFetch).toHaveBeenCalledWith(
                'https://api.example.com/data',
                expect.objectContaining({
                    headers: expect.objectContaining({
                        Authorization: 'Bearer token123',
                    }),
                }),
            );
        });

        it('should handle text response', async () => {
            const mockResponse = {
                status: 200,
                statusText: 'OK',
                headers: new Headers({ 'content-type': 'text/plain' }),
                text: vi.fn().mockResolvedValue('Plain text response'),
            };
            mockFetch.mockResolvedValue(mockResponse);

            const result = await httpService.get('https://api.example.com/text');

            expect(result.data).toBe('Plain text response');
        });

        it('should include status information in response', async () => {
            const mockResponse = {
                status: 404,
                statusText: 'Not Found',
                headers: new Headers({ 'content-type': 'application/json' }),
                json: vi.fn().mockResolvedValue({ error: 'Not found' }),
            };
            mockFetch.mockResolvedValue(mockResponse);

            const result = await httpService.get('https://api.example.com/missing');

            expect(result.status).toBe(404);
            expect(result.statusText).toBe('Not Found');
        });
    });

    describe('post', () => {
        it('should make POST request with body', async () => {
            const mockResponse = {
                status: 201,
                statusText: 'Created',
                headers: new Headers({ 'content-type': 'application/json' }),
                json: vi.fn().mockResolvedValue({ id: 1, name: 'Created' }),
            };
            mockFetch.mockResolvedValue(mockResponse);

            const postData = { name: 'Test', value: 123 };
            const result = await httpService.post(
                'https://api.example.com/create',
                postData,
            );

            expect(mockFetch).toHaveBeenCalledWith(
                'https://api.example.com/create',
                expect.objectContaining({
                    method: 'POST',
                    body: JSON.stringify(postData),
                }),
            );
            expect(result.status).toBe(201);
        });

        it('should make POST request without body', async () => {
            const mockResponse = {
                status: 200,
                statusText: 'OK',
                headers: new Headers({ 'content-type': 'application/json' }),
                json: vi.fn().mockResolvedValue({}),
            };
            mockFetch.mockResolvedValue(mockResponse);

            await httpService.post('https://api.example.com/action');

            expect(mockFetch).toHaveBeenCalledWith(
                'https://api.example.com/action',
                expect.objectContaining({
                    method: 'POST',
                    body: undefined,
                }),
            );
        });

        it('should handle complex nested objects', async () => {
            const mockResponse = {
                status: 200,
                statusText: 'OK',
                headers: new Headers({ 'content-type': 'application/json' }),
                json: vi.fn().mockResolvedValue({}),
            };
            mockFetch.mockResolvedValue(mockResponse);

            const complexData = {
                user: {
                    profile: {
                        name: 'John',
                        settings: { theme: 'dark' },
                    },
                },
                items: [1, 2, 3],
            };

            await httpService.post('https://api.example.com/complex', complexData);

            expect(mockFetch).toHaveBeenCalledWith(
                'https://api.example.com/complex',
                expect.objectContaining({
                    body: JSON.stringify(complexData),
                }),
            );
        });
    });

    describe('put', () => {
        it('should make PUT request with body', async () => {
            const mockResponse = {
                status: 200,
                statusText: 'OK',
                headers: new Headers({ 'content-type': 'application/json' }),
                json: vi.fn().mockResolvedValue({ updated: true }),
            };
            mockFetch.mockResolvedValue(mockResponse);

            const updateData = { id: 1, name: 'Updated' };
            await httpService.put('https://api.example.com/update/1', updateData);

            expect(mockFetch).toHaveBeenCalledWith(
                'https://api.example.com/update/1',
                expect.objectContaining({
                    method: 'PUT',
                    body: JSON.stringify(updateData),
                }),
            );
        });

        it('should make PUT request without body', async () => {
            const mockResponse = {
                status: 200,
                statusText: 'OK',
                headers: new Headers({ 'content-type': 'application/json' }),
                json: vi.fn().mockResolvedValue({}),
            };
            mockFetch.mockResolvedValue(mockResponse);

            await httpService.put('https://api.example.com/update/1');

            expect(mockFetch).toHaveBeenCalledWith(
                'https://api.example.com/update/1',
                expect.objectContaining({
                    method: 'PUT',
                    body: undefined,
                }),
            );
        });
    });

    describe('patch', () => {
        it('should make PATCH request with body', async () => {
            const mockResponse = {
                status: 200,
                statusText: 'OK',
                headers: new Headers({ 'content-type': 'application/json' }),
                json: vi.fn().mockResolvedValue({ patched: true }),
            };
            mockFetch.mockResolvedValue(mockResponse);

            const patchData = { name: 'Patched Name' };
            await httpService.patch('https://api.example.com/patch/1', patchData);

            expect(mockFetch).toHaveBeenCalledWith(
                'https://api.example.com/patch/1',
                expect.objectContaining({
                    method: 'PATCH',
                    body: JSON.stringify(patchData),
                }),
            );
        });

        it('should make PATCH request without body', async () => {
            const mockResponse = {
                status: 200,
                statusText: 'OK',
                headers: new Headers({ 'content-type': 'application/json' }),
                json: vi.fn().mockResolvedValue({}),
            };
            mockFetch.mockResolvedValue(mockResponse);

            await httpService.patch('https://api.example.com/patch/1');

            expect(mockFetch).toHaveBeenCalledWith(
                'https://api.example.com/patch/1',
                expect.objectContaining({
                    method: 'PATCH',
                }),
            );
        });
    });

    describe('delete', () => {
        it('should make DELETE request', async () => {
            const mockResponse = {
                status: 204,
                statusText: 'No Content',
                headers: new Headers({ 'content-type': 'application/json' }),
                json: vi.fn().mockResolvedValue({}),
            };
            mockFetch.mockResolvedValue(mockResponse);

            const result = await httpService.delete(
                'https://api.example.com/delete/1',
            );

            expect(mockFetch).toHaveBeenCalledWith(
                'https://api.example.com/delete/1',
                expect.objectContaining({
                    method: 'DELETE',
                    body: undefined,
                }),
            );
            expect(result.status).toBe(204);
        });

        it('should pass config to DELETE request', async () => {
            const mockResponse = {
                status: 200,
                statusText: 'OK',
                headers: new Headers({ 'content-type': 'application/json' }),
                json: vi.fn().mockResolvedValue({}),
            };
            mockFetch.mockResolvedValue(mockResponse);

            await httpService.delete('https://api.example.com/delete/1', {
                headers: { 'X-Custom-Header': 'value' },
            });

            expect(mockFetch).toHaveBeenCalledWith(
                'https://api.example.com/delete/1',
                expect.objectContaining({
                    headers: expect.objectContaining({
                        'X-Custom-Header': 'value',
                    }),
                }),
            );
        });
    });

    describe('head', () => {
        it('should make HEAD request', async () => {
            const mockResponse = {
                status: 200,
                statusText: 'OK',
                headers: new Headers({
                    'content-type': 'application/json',
                    'content-length': '1234',
                }),
                json: vi.fn().mockResolvedValue({}),
            };
            mockFetch.mockResolvedValue(mockResponse);

            const result = await httpService.head('https://api.example.com/resource');

            expect(mockFetch).toHaveBeenCalledWith(
                'https://api.example.com/resource',
                expect.objectContaining({
                    method: 'HEAD',
                    body: undefined,
                }),
            );
            expect(result.status).toBe(200);
        });

        it('should return headers in response', async () => {
            const responseHeaders = new Headers({
                'content-type': 'application/json',
                'x-custom': 'header-value',
            });
            const mockResponse = {
                status: 200,
                statusText: 'OK',
                headers: responseHeaders,
                json: vi.fn().mockResolvedValue({}),
            };
            mockFetch.mockResolvedValue(mockResponse);

            const result = await httpService.head('https://api.example.com/resource');

            expect(result.headers).toBeDefined();
        });
    });

    describe('response handling', () => {
        it('should handle JSON content-type', async () => {
            const mockResponse = {
                status: 200,
                statusText: 'OK',
                headers: new Headers({ 'content-type': 'application/json' }),
                json: vi.fn().mockResolvedValue({ key: 'value' }),
            };
            mockFetch.mockResolvedValue(mockResponse);

            const result = await httpService.get('https://api.example.com/json');

            expect(mockResponse.json).toHaveBeenCalled();
            expect(result.data).toEqual({ key: 'value' });
        });

        it('should handle JSON content-type with charset', async () => {
            const mockResponse = {
                status: 200,
                statusText: 'OK',
                headers: new Headers({
                    'content-type': 'application/json; charset=utf-8',
                }),
                json: vi.fn().mockResolvedValue({ key: 'value' }),
            };
            mockFetch.mockResolvedValue(mockResponse);

            const result = await httpService.get('https://api.example.com/json');

            expect(mockResponse.json).toHaveBeenCalled();
        });

        it('should handle text content-type', async () => {
            const mockResponse = {
                status: 200,
                statusText: 'OK',
                headers: new Headers({ 'content-type': 'text/html' }),
                text: vi.fn().mockResolvedValue('<html></html>'),
            };
            mockFetch.mockResolvedValue(mockResponse);

            const result = await httpService.get('https://api.example.com/html');

            expect(mockResponse.text).toHaveBeenCalled();
            expect(result.data).toBe('<html></html>');
        });

        it('should handle no content-type header', async () => {
            const mockResponse = {
                status: 200,
                statusText: 'OK',
                headers: new Headers(),
                text: vi.fn().mockResolvedValue('raw data'),
            };
            mockFetch.mockResolvedValue(mockResponse);

            const result = await httpService.get('https://api.example.com/raw');

            expect(mockResponse.text).toHaveBeenCalled();
        });

        it('should include config in response', async () => {
            const mockResponse = {
                status: 200,
                statusText: 'OK',
                headers: new Headers({ 'content-type': 'application/json' }),
                json: vi.fn().mockResolvedValue({}),
            };
            mockFetch.mockResolvedValue(mockResponse);

            const result = await httpService.get('https://api.example.com/data');

            expect(result.config).toBeDefined();
        });
    });

    describe('error scenarios', () => {
        it('should propagate fetch errors', async () => {
            mockFetch.mockRejectedValue(new Error('Network error'));

            await expect(
                httpService.get('https://api.example.com/error'),
            ).rejects.toThrow('Network error');
        });

        it('should propagate JSON parse errors', async () => {
            const mockResponse = {
                status: 200,
                statusText: 'OK',
                headers: new Headers({ 'content-type': 'application/json' }),
                json: vi.fn().mockRejectedValue(new Error('Invalid JSON')),
            };
            mockFetch.mockResolvedValue(mockResponse);

            await expect(
                httpService.get('https://api.example.com/bad-json'),
            ).rejects.toThrow('Invalid JSON');
        });

        it('should handle 500 server error', async () => {
            const mockResponse = {
                status: 500,
                statusText: 'Internal Server Error',
                headers: new Headers({ 'content-type': 'application/json' }),
                json: vi.fn().mockResolvedValue({ error: 'Server error' }),
            };
            mockFetch.mockResolvedValue(mockResponse);

            const result = await httpService.get('https://api.example.com/server-error');

            expect(result.status).toBe(500);
            expect(result.statusText).toBe('Internal Server Error');
        });

        it('should handle timeout errors', async () => {
            mockFetch.mockRejectedValue(new Error('Timeout'));

            await expect(
                httpService.get('https://api.example.com/slow'),
            ).rejects.toThrow('Timeout');
        });
    });

    describe('request configuration', () => {
        it('should merge custom config with defaults', async () => {
            const mockResponse = {
                status: 200,
                statusText: 'OK',
                headers: new Headers({ 'content-type': 'application/json' }),
                json: vi.fn().mockResolvedValue({}),
            };
            mockFetch.mockResolvedValue(mockResponse);

            await httpService.get('https://api.example.com/data', {
                credentials: 'include',
                mode: 'cors',
            });

            expect(mockFetch).toHaveBeenCalledWith(
                'https://api.example.com/data',
                expect.objectContaining({
                    credentials: 'include',
                    mode: 'cors',
                }),
            );
        });

        it('should allow overriding Content-Type header', async () => {
            const mockResponse = {
                status: 200,
                statusText: 'OK',
                headers: new Headers({ 'content-type': 'application/json' }),
                json: vi.fn().mockResolvedValue({}),
            };
            mockFetch.mockResolvedValue(mockResponse);

            await httpService.post('https://api.example.com/data', { key: 'value' }, {
                headers: { 'Content-Type': 'text/plain' },
            });

            expect(mockFetch).toHaveBeenCalledWith(
                'https://api.example.com/data',
                expect.objectContaining({
                    headers: expect.objectContaining({
                        'Content-Type': 'text/plain',
                    }),
                }),
            );
        });
    });

    describe('type generics', () => {
        interface User {
            id: number;
            name: string;
        }

        it('should support typed responses for GET', async () => {
            const mockResponse = {
                status: 200,
                statusText: 'OK',
                headers: new Headers({ 'content-type': 'application/json' }),
                json: vi.fn().mockResolvedValue({ id: 1, name: 'John' }),
            };
            mockFetch.mockResolvedValue(mockResponse);

            const result = await httpService.get<{ data: User }>(
                'https://api.example.com/user/1',
            );

            expect(result.data).toEqual({ id: 1, name: 'John' });
        });

        it('should support typed responses for POST', async () => {
            const mockResponse = {
                status: 201,
                statusText: 'Created',
                headers: new Headers({ 'content-type': 'application/json' }),
                json: vi.fn().mockResolvedValue({ id: 2, name: 'Jane' }),
            };
            mockFetch.mockResolvedValue(mockResponse);

            const result = await httpService.post<{ data: User }>(
                'https://api.example.com/users',
                { name: 'Jane' },
            );

            expect(result.data).toEqual({ id: 2, name: 'Jane' });
        });
    });

    describe('edge cases', () => {
        it('should handle empty response body', async () => {
            const mockResponse = {
                status: 204,
                statusText: 'No Content',
                headers: new Headers({ 'content-type': 'application/json' }),
                json: vi.fn().mockResolvedValue(null),
            };
            mockFetch.mockResolvedValue(mockResponse);

            const result = await httpService.delete('https://api.example.com/item/1');

            expect(result.data).toBeNull();
        });

        it('should handle array response', async () => {
            const mockResponse = {
                status: 200,
                statusText: 'OK',
                headers: new Headers({ 'content-type': 'application/json' }),
                json: vi.fn().mockResolvedValue([1, 2, 3]),
            };
            mockFetch.mockResolvedValue(mockResponse);

            const result = await httpService.get('https://api.example.com/items');

            expect(result.data).toEqual([1, 2, 3]);
        });

        it('should handle unicode in URL', async () => {
            const mockResponse = {
                status: 200,
                statusText: 'OK',
                headers: new Headers({ 'content-type': 'application/json' }),
                json: vi.fn().mockResolvedValue({}),
            };
            mockFetch.mockResolvedValue(mockResponse);

            await httpService.get('https://api.example.com/search?q=你好');

            expect(mockFetch).toHaveBeenCalledWith(
                'https://api.example.com/search?q=你好',
                expect.any(Object),
            );
        });

        it('should handle special characters in body', async () => {
            const mockResponse = {
                status: 200,
                statusText: 'OK',
                headers: new Headers({ 'content-type': 'application/json' }),
                json: vi.fn().mockResolvedValue({}),
            };
            mockFetch.mockResolvedValue(mockResponse);

            const data = { message: 'Hello & Goodbye <script>' };
            await httpService.post('https://api.example.com/data', data);

            expect(mockFetch).toHaveBeenCalledWith(
                'https://api.example.com/data',
                expect.objectContaining({
                    body: JSON.stringify(data),
                }),
            );
        });
    });
});
