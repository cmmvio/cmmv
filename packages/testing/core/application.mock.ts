import * as fs from 'node:fs';
import * as path from 'node:path';

import {
    Application,
    Config,
    IApplicationSettings,
    Logger,
    Module,
    AbstractHttpAdapter,
} from '@cmmv/core';

// Importação do tipo MockDefaultAdapter para casting
import { MockDefaultAdapter } from '../http/http.mock';

export class ApplicationMock extends Application {
    protected override logger: Logger = new Logger('ApplicationMock');
    protected mockHttpAdapter: AbstractHttpAdapter;

    constructor(settings: IApplicationSettings) {
        super(settings);
        Config.set('env', 'testing');

        if (settings.httpAdapter) {
            this.mockHttpAdapter = new settings.httpAdapter();
        }
    }

    protected override async initialize(
        settings: IApplicationSettings = this.settings,
    ): Promise<void> {
        const env = 'testing';
        this.loadModules(this.modules);
        await Config.validateConfigs(this.configs);
        this.processContracts();
        const appModel = await Application.generateModule();
        if (appModel) this.loadModules([...this.modules, appModel]);

        // Inicializa o adaptador HTTP se disponível
        if (this.mockHttpAdapter) {
            await this.mockHttpAdapter.init(
                this as unknown as Application,
                settings.httpOptions,
            );

            // Registra os controladores explicitamente - passo essencial para os testes
            // Cast para MockDefaultAdapter para acessar o método registerControllers
            (
                this.mockHttpAdapter as unknown as MockDefaultAdapter
            ).registerControllers();
        }
    }

    /**
     * Obtém o adaptador HTTP usado pela aplicação mock
     */
    public getHttpAdapter(): AbstractHttpAdapter {
        return this.mockHttpAdapter;
    }

    /**
     * Fecha a aplicação mock e seus recursos
     */
    public async close(): Promise<void> {
        if (this.mockHttpAdapter) {
            return this.mockHttpAdapter.close();
        }
        return Promise.resolve();
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
