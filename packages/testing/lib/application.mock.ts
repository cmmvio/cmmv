import * as fs from 'node:fs';
import * as path from 'node:path';

import {
    Application,
    Config,
    IApplicationSettings,
    Logger,
    Module,
} from '@cmmv/core';

export class ApplicationMock extends Application {
    protected override logger: Logger = new Logger('ApplicationMock');

    constructor(settings: IApplicationSettings) {
        super(settings);
        Config.set('env', 'testing');
    }

    protected override async initialize(
        settings: IApplicationSettings,
    ): Promise<void> {
        const env = 'testing';
        this.loadModules(this.modules);
        await Config.validateConfigs(this.configs);
        this.processContracts();
        const appModel = await Application.generateModule();
        if (appModel) this.loadModules([...this.modules, appModel]);
    }

    protected override async createScriptBundle() {}
    protected override async createCSSBundle() {}
    protected static async generateModule() {
        const outputPath = path.resolve('src', `app.module.ts`);

        if (fs.existsSync(outputPath)) {
            const { ApplicationModule } = await import(outputPath);
            return ApplicationModule as Module;
        }

        return null;
    }
}
