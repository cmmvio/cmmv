export interface ModuleImport {
    import: string | string[];
    path: string;
    modules: string[];
    providers?: string[];
}
export interface ModuleInfo {
    name: string;
    installed: boolean;
    version?: string;
    description: string;
    category: string;
    submodules?: SubmoduleInfo[];
    dependencies?: string[];
    documentation?: string;
    latestVersion?: string;
    updateAvailable?: boolean;
    versionSource?: string;
    moduleImport?: ModuleImport;
    isEnabled?: boolean;
}
export interface SubmoduleInfo {
    name: string;
    installed: boolean;
    description: string;
    packageName?: string;
    version?: string;
}
export declare class ModulesService {
    private logger;
    private readonly packageJsonPath;
    private readonly mainTsPath;
    private readonly availableModules;
    /**
     * Read the package.json file
     * @returns The package.json file
     */
    private readPackageJson;
    /**
     * Update the installed status
     * @param packageJson - The package.json file
     */
    private updateInstalledStatus;
    /**
     * Check for updates
     * @param modules - The modules to check
     */
    private checkForUpdates;
    /**
     * Get the latest version of a package
     * @param packageName - The name of the package
     * @returns The latest version or null if not possible to get
     */
    private getLatestVersion;
    /**
     * Get all modules
     * @returns The modules
     */
    getAllModules(): Promise<ModuleInfo[]>;
    private checkModuleEnabled;
    /**
     * Get the installed modules
     * @returns The installed modules
     */
    getInstalledModules(): Promise<ModuleInfo[]>;
    /**
     * Get the module details
     * @param moduleName - The name of the module
     * @returns The module details
     */
    getModuleDetails(moduleName: string): Promise<ModuleInfo | null>;
    /**
     * Get the modules by category
     * @returns The modules by category
     */
    getModulesByCategory(): Promise<Record<string, ModuleInfo[]>>;
    /**
     * Detect the package manager
     * @returns The package manager
     */
    detectPackageManager(): string;
    /**
     * Build the install command
     * @param packageManager - The package manager
     * @param packages - The packages to install
     * @returns The install command
     */
    private buildInstallCommand;
    /**
     * Install a module
     * @param moduleName - The name of the module
     * @param dependencies - The dependencies of the module
     * @returns The success and message of the operation
     */
    installModule(moduleName: string, dependencies: string[]): Promise<any>;
    /**
     * Install a submodule for a module
     * @param moduleName - The name of the module
     * @param submoduleName - The name of the submodule
     * @param packageName - The name of the package to install
     * @returns The success and message of the operation
     */
    installSubmodule(moduleName: string, submoduleName: string, packageName: string): Promise<any>;
    /**
     * Update a module
     * @param moduleName - The name of the module
     * @param dependencies - The dependencies of the module
     * @returns The success and message of the operation
     */
    updateModule(moduleName: string, dependencies: string[]): Promise<any>;
    /**
     * Ler o arquivo main.ts
     */
    private readMainTs;
    /**
     * Salvar o arquivo main.ts
     */
    private saveMainTs;
    /**
     * Verificar se um módulo está ativo na aplicação
     */
    isModuleEnabled(moduleName: string): Promise<boolean>;
    /**
     * Ativar ou desativar um módulo na aplicação
     */
    toggleModule(moduleName: string, enable: boolean): Promise<boolean>;
    private insertImport;
    private addModuleToArray;
    private removeModuleFromArray;
    private addProviderToArray;
    private removeProviderFromArray;
}
