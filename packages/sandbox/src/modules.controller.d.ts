import { ModulesService } from './modules.service';
export declare class ModulesController {
    private readonly modulesService;
    constructor(modulesService: ModulesService);
    getAllModules(): Promise<{
        success: boolean;
        data: import("./modules.service").ModuleInfo[];
        message?: undefined;
        error?: undefined;
    } | {
        success: boolean;
        message: string;
        error: any;
        data?: undefined;
    }>;
    getInstalledModules(): Promise<{
        success: boolean;
        data: import("./modules.service").ModuleInfo[];
        message?: undefined;
        error?: undefined;
    } | {
        success: boolean;
        message: string;
        error: any;
        data?: undefined;
    }>;
    getModulesByCategory(): Promise<{
        success: boolean;
        data: Record<string, import("./modules.service").ModuleInfo[]>;
        message?: undefined;
        error?: undefined;
    } | {
        success: boolean;
        message: string;
        error: any;
        data?: undefined;
    }>;
    getModuleDetails(moduleName: string): Promise<{
        success: boolean;
        message: string;
        data?: undefined;
        error?: undefined;
    } | {
        success: boolean;
        data: import("./modules.service").ModuleInfo;
        message?: undefined;
        error?: undefined;
    } | {
        success: boolean;
        message: string;
        error: any;
        data?: undefined;
    }>;
    installModule(data: {
        moduleName: string;
        dependencies: string[];
    }): Promise<{
        success: boolean;
        message: string;
        data: any;
        error?: undefined;
    } | {
        success: boolean;
        message: string;
        error: any;
        data?: undefined;
    }>;
    installSubmodule(data: {
        moduleName: string;
        submoduleName: string;
        packageName: string;
    }): Promise<{
        success: boolean;
        message: string;
        data: any;
        error?: undefined;
    } | {
        success: boolean;
        message: string;
        error: any;
        data?: undefined;
    }>;
    getPackageManager(): Promise<{
        success: boolean;
        data: {
            packageManager: string;
        };
        message?: undefined;
        error?: undefined;
    } | {
        success: boolean;
        message: string;
        error: any;
        data?: undefined;
    }>;
    updateModule(data: {
        moduleName: string;
        dependencies: string[];
    }): Promise<{
        success: boolean;
        message: string;
        data: any;
        error?: undefined;
    } | {
        success: boolean;
        message: string;
        error: any;
        data?: undefined;
    }>;
    getModuleStatus(moduleName: string): Promise<{
        success: boolean;
        data: {
            enabled: boolean;
        };
        message?: undefined;
        error?: undefined;
    } | {
        success: boolean;
        message: string;
        error: any;
        data?: undefined;
    }>;
    toggleModule(moduleName: string, data: {
        enable: boolean;
    }): Promise<{
        success: boolean;
        message: string;
        error?: undefined;
    } | {
        success: boolean;
        message: string;
        error: any;
    }>;
}
