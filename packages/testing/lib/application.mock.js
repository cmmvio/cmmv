"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.ApplicationMock = void 0;
const fs = require("node:fs");
const path = require("node:path");
const core_1 = require("@cmmv/core");
class ApplicationMock extends core_1.Application {
    constructor(settings) {
        super(settings);
        this.logger = new core_1.Logger('ApplicationMock');
        core_1.Config.set('env', 'testing');
    }
    async initialize(settings) {
        const env = 'testing';
        this.loadModules(this.modules);
        await core_1.Config.validateConfigs(this.configs);
        this.processContracts();
        const appModel = await core_1.Application.generateModule();
        if (appModel)
            this.loadModules([...this.modules, appModel]);
    }
    async createScriptBundle() { }
    async createCSSBundle() { }
    static async generateModule() {
        const outputPath = path.resolve('src', `app.module.ts`);
        if (fs.existsSync(outputPath)) {
            const { ApplicationModule } = await Promise.resolve(`${outputPath}`).then(s => require(s));
            return ApplicationModule;
        }
        return null;
    }
}
exports.ApplicationMock = ApplicationMock;
