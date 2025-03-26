"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.Test = void 0;
const core_1 = require("@cmmv/core");
const application_mock_1 = require("./application.mock");
class Test {
    static createApplication(settings) {
        const app = new application_mock_1.ApplicationMock(settings);
        return app;
    }
    static createMockModule(options) {
        const MockModule = new core_1.Module('mock-module', options || {});
        return MockModule;
    }
}
exports.Test = Test;
