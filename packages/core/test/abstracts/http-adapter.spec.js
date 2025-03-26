"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const vitest_1 = require("vitest");
const http_adapter_abstract_1 = require("../../abstracts/http-adapter.abstract");
class Adapter extends http_adapter_abstract_1.AbstractHttpAdapter {
}
(0, vitest_1.describe)('AbstractHttpAdapter', () => {
    let adapter;
    let instanceMock;
    (0, vitest_1.beforeEach)(() => {
        instanceMock = {
            use: (...args) => {
                instanceMock.use.calledWith = args;
            },
            get: (...args) => {
                instanceMock.get.calledWith = args;
            },
            post: (...args) => {
                instanceMock.post.calledWith = args;
            },
            listen: (...args) => {
                instanceMock.listen.calledWith = args;
            },
        };
        adapter = new Adapter(instanceMock);
    });
    (0, vitest_1.it)('should initialize application and settings in init method', async () => {
        const applicationMock = {};
        const settingsMock = { port: 3000 };
        await adapter.init(applicationMock, settingsMock);
        (0, vitest_1.expect)(adapter).toBeInstanceOf(http_adapter_abstract_1.AbstractHttpAdapter);
    });
    (0, vitest_1.it)('should correctly set and get the HTTP server instance', () => {
        const serverMock = {};
        adapter.setHttpServer(serverMock);
        (0, vitest_1.expect)(adapter.getHttpServer()).toBe(serverMock);
    });
    (0, vitest_1.it)('should correctly set and get the instance', () => {
        const newInstanceMock = {};
        adapter.setInstance(newInstanceMock);
        (0, vitest_1.expect)(adapter.getInstance()).toBe(newInstanceMock);
    });
    (0, vitest_1.it)('should correctly identify JSON objects', () => {
        const jsonString = '{"key":"value"}';
        const jsonObject = { key: 'value' };
        (0, vitest_1.expect)(adapter.isJson(jsonString)).toBe(true);
        (0, vitest_1.expect)(adapter.isJson(jsonObject)).toBe(true);
        (0, vitest_1.expect)(adapter.isJson('not a json string')).toBe(false);
    });
    (0, vitest_1.it)('should correctly call the use method of the instance', () => {
        const middleware = () => { };
        adapter.use(middleware);
        (0, vitest_1.expect)(instanceMock.use.calledWith).toEqual([middleware]);
    });
    (0, vitest_1.it)('should correctly call the get method of the instance with path and handler', () => {
        const path = '/test';
        const handler = () => { };
        adapter.get(path, handler);
        (0, vitest_1.expect)(instanceMock.get.calledWith).toEqual([path, handler]);
    });
    (0, vitest_1.it)('should correctly call the post method of the instance with path and handler', () => {
        const path = '/test';
        const handler = () => { };
        adapter.post(path, handler);
        (0, vitest_1.expect)(instanceMock.post.calledWith).toEqual([path, handler]);
    });
    (0, vitest_1.it)('should call listen method with correct parameters', () => {
        const port = 3000;
        const hostname = 'localhost';
        const callback = () => { };
        adapter.listen(port, hostname, callback);
        (0, vitest_1.expect)(instanceMock.listen.calledWith).toEqual([
            port,
            hostname,
            callback,
        ]);
    });
});
