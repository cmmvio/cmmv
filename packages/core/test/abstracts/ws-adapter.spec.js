"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const vitest_1 = require("vitest");
const ws_adapter_abstract_1 = require("../../abstracts/ws-adapter.abstract");
class TestWSAdapter extends ws_adapter_abstract_1.AbstractWSAdapter {
    create(server, application, options) {
        return { server, application, options };
    }
    bindClientConnect(server, callback) {
        server.onClientConnect = callback;
        return server;
    }
    bindCustomMessageHandler(server, callback) {
        server.onMessageHandler = callback;
        return server;
    }
    close() {
        return true;
    }
}
(0, vitest_1.describe)('AbstractWSAdapter', () => {
    let appMock;
    let httpServerMock;
    let wsAdapter;
    (0, vitest_1.beforeEach)(() => {
        httpServerMock = { listen: () => { } };
        appMock = {
            getUnderlyingHttpServer: () => httpServerMock,
        };
        wsAdapter = new TestWSAdapter(appMock);
    });
    (0, vitest_1.it)('should initialize with an HTTP server instance', () => {
        const adapterWithHttp = new TestWSAdapter(httpServerMock);
        (0, vitest_1.expect)(adapterWithHttp.httpServer).toBe(httpServerMock);
    });
    (0, vitest_1.it)('should correctly call the create method with server and application', () => {
        const serverMock = {};
        const applicationMock = {};
        const options = { optionKey: 'optionValue' };
        const result = wsAdapter.create(serverMock, applicationMock, options);
        (0, vitest_1.expect)(result.server).toBe(serverMock);
        (0, vitest_1.expect)(result.application).toBe(applicationMock);
        (0, vitest_1.expect)(result.options.optionKey).toBe('optionValue');
    });
});
