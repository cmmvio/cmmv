"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.AbstractWSAdapter = void 0;
const application_1 = require("../application");
class AbstractWSAdapter {
    constructor(appOrHttpServer) {
        if (appOrHttpServer && appOrHttpServer instanceof application_1.Application)
            this.httpServer = appOrHttpServer.getUnderlyingHttpServer();
        else
            this.httpServer = appOrHttpServer;
    }
}
exports.AbstractWSAdapter = AbstractWSAdapter;
