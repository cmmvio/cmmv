import { describe, it, expect, beforeEach } from 'vitest';
import { Application } from '../../application';
import { AbstractWSAdapter } from '../../abstracts/ws-adapter.abstract';
import { AbstractHttpAdapter } from '../../abstracts/http-adapter.abstract';

class TestWSAdapter extends AbstractWSAdapter {
    public create(
        server: AbstractHttpAdapter,
        application: Application,
        options?: any,
    ) {
        return { server, application, options };
    }

    public bindClientConnect(server, callback: Function) {
        server.onClientConnect = callback;
        return server;
    }

    public bindCustomMessageHandler(server, callback: Function) {
        server.onMessageHandler = callback;
        return server;
    }

    public close() {
        return true;
    }
}

describe('AbstractWSAdapter', () => {
    let appMock;
    let httpServerMock;
    let wsAdapter;

    beforeEach(() => {
        httpServerMock = { listen: () => {} };
        appMock = {
            getUnderlyingHttpServer: () => httpServerMock,
        };
        wsAdapter = new TestWSAdapter(appMock);
    });

    it('should initialize with an HTTP server instance', () => {
        const adapterWithHttp = new TestWSAdapter(httpServerMock);
        expect(adapterWithHttp.httpServer).toBe(httpServerMock);
    });

    it('should correctly call the create method with server and application', () => {
        const serverMock = {};
        const applicationMock = {};
        const options = { optionKey: 'optionValue' };

        const result = wsAdapter.create(
            serverMock as AbstractHttpAdapter,
            applicationMock as Application,
            options,
        );

        expect(result.server).toBe(serverMock);
        expect(result.application).toBe(applicationMock);
        expect(result.options.optionKey).toBe('optionValue');
    });
});
