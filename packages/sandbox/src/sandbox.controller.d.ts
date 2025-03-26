import { IContract } from '@cmmv/core';
import { SandboxService } from './sandbox.service';
export declare class SandboxController {
    private readonly sandboxService;
    constructor(sandboxService: SandboxService);
    handlerIndex(res: any): Promise<any>;
    handlerClientJavascript(res: any): Promise<void>;
    handlerClientGraphQL(res: any): Promise<void>;
    handlerClientDataTable(res: any): Promise<void>;
    handlerLogs(res: any): Promise<void>;
    handlerFormBuilder(res: any): Promise<void>;
    handlerBackup(res: any): Promise<void>;
    handlerModules(res: any): Promise<void>;
    handlerConfig(res: any): Promise<void>;
    handlerSchema(): Promise<any>;
    heandlerCompile(schema: IContract): Promise<string>;
    handlerDelete(contractName: string): Promise<string>;
    handlerRestart(): Promise<string>;
}
