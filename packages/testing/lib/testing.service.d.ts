import { IApplicationSettings, Module, IModuleOptions } from '@cmmv/core';
import { ApplicationMock } from './application.mock';
export declare class Test {
    static createApplication(settings?: IApplicationSettings): ApplicationMock;
    static createMockModule(options?: IModuleOptions): Module;
}
