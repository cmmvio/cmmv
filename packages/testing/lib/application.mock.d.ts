import { Application, IApplicationSettings, Logger, Module } from '@cmmv/core';
export declare class ApplicationMock extends Application {
    protected logger: Logger;
    constructor(settings: IApplicationSettings);
    protected initialize(settings: IApplicationSettings): Promise<void>;
    protected createScriptBundle(): Promise<void>;
    protected createCSSBundle(): Promise<void>;
    protected static generateModule(): Promise<Module>;
}
