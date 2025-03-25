import { IApplicationSettings, Module, IModuleOptions } from '@cmmv/core';

import { ApplicationMock } from './application.mock';

export class Test {
    public static createApplication(
        settings?: IApplicationSettings,
    ): ApplicationMock {
        const app = new ApplicationMock(settings);
        return app;
    }

    public static createMockModule(options?: IModuleOptions): Module {
        const MockModule = new Module('mock-module', options || {});
        return MockModule;
    }
}
