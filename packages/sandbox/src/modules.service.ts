import * as fs from 'node:fs';
import * as path from 'node:path';
import axios from 'axios';
//import { compare as semverCompare } from 'semver';

import { Service, Logger } from '@cmmv/core';

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
    beta?: boolean;
    experimental?: boolean;
    official?: boolean;
    plugin?: boolean;
}

export interface SubmoduleInfo {
    name: string;
    installed: boolean;
    description: string;
    packageName?: string;
    version?: string;
}

interface ModulesResponse {
    modules: ModuleInfo[];
}

const semver = require('semver');

@Service('modules')
export class ModulesService {
    private logger = new Logger('ModulesService');
    private readonly packageJsonPath = path.join(process.cwd(), 'package.json');
    private readonly mainTsPath = path.join(process.cwd(), 'src', 'main.ts');

    private availableModules: ModuleInfo[] = [];
    private readonly modulesApiUrl =
        'https://raw.githubusercontent.com/cmmvio/cmmv-plugins/main/modules.json';

    constructor() {
        this.fetchModules().catch((err) =>
            this.logger.error(`Failed to fetch modules: ${err.message}`),
        );
    }

    private async fetchModules(): Promise<void> {
        try {
            const response = await axios.get<ModulesResponse>(
                this.modulesApiUrl,
            );

            if (response.data && response.data.modules) {
                this.availableModules = response.data.modules;
            } else {
                this.logger.error('Invalid response format from modules API');
            }
        } catch (error) {
            this.logger.error(`Error fetching modules: ${error.message}`);
            throw error;
        }
    }

    /**
     * Read the package.json file
     * @returns The package.json file
     */
    private readPackageJson(): any {
        try {
            if (fs.existsSync(this.packageJsonPath)) {
                const packageJsonContent = fs.readFileSync(
                    this.packageJsonPath,
                    'utf8',
                );
                return JSON.parse(packageJsonContent);
            }
            return null;
        } catch (error) {
            this.logger.error(`Error reading package.json: ${error.message}`);
            return null;
        }
    }

    /**
     * Update the installed status
     * @param packageJson - The package.json file
     */
    private updateInstalledStatus(packageJson: any): void {
        if (!packageJson || !packageJson.dependencies) return;

        const installedDependencies = {
            ...packageJson.dependencies,
            ...packageJson.devDependencies,
        };

        for (const module of this.availableModules) {
            // Verificar apenas o pacote principal do módulo (@cmmv/*)
            const mainPackage = module.dependencies?.find(
                (dep) =>
                    dep.startsWith('@cmmv/') &&
                    dep.toLowerCase() ===
                        `@cmmv/${module.name.toLowerCase().replace('@cmmv/', '')}`,
            );

            if (mainPackage && mainPackage in installedDependencies) {
                module.installed = true;
                module.version = installedDependencies[mainPackage];
                module.versionSource = mainPackage;
            } else {
                module.installed = false;
                module.version = undefined;
                module.versionSource = undefined;
            }

            // Verificar submodules se existirem
            if (module.submodules) {
                for (const submodule of module.submodules) {
                    const submodulePackage =
                        submodule.packageName ||
                        `@cmmv/${module.name.toLowerCase().replace('@cmmv/', '')}-${submodule.name.toLowerCase()}`;

                    submodule.installed =
                        submodulePackage in installedDependencies;
                    if (submodule.installed) {
                        submodule.version =
                            installedDependencies[submodulePackage];
                    } else {
                        submodule.version = undefined;
                    }
                }
            }
        }
    }

    /**
     * Check for updates
     * @param modules - The modules to check
     */
    private async checkForUpdates(modules: ModuleInfo[]): Promise<void> {
        const modulesToCheck = modules.filter((m) => m.installed && m.version);

        for (const module of modulesToCheck) {
            try {
                const mainPackage =
                    module.dependencies?.find(
                        (dep) =>
                            dep.startsWith('@cmmv/') &&
                            dep.toLowerCase() ===
                                `@cmmv/${module.name.toLowerCase().replace('@cmmv/', '')}`,
                    ) || module.dependencies?.[0];

                if (!mainPackage) continue;

                const installedVersion = module.version?.replace(/^[\^~]/, '');
                const latestVersion = await this.getLatestVersion(mainPackage);

                if (latestVersion) {
                    module.latestVersion = latestVersion;

                    if (installedVersion && latestVersion) {
                        try {
                            module.updateAvailable =
                                semver.compare(
                                    latestVersion,
                                    installedVersion,
                                ) > 0;
                        } catch (err) {
                            this.logger.log(
                                `Error comparing versions for ${module.name}: ${err.message}`,
                            );
                            module.updateAvailable = false;
                        }
                    }
                }
            } catch (error) {
                this.logger.log(
                    `Error checking update for ${module.name}: ${error.message}`,
                );
            }
        }
    }

    /**
     * Get the latest version of a package
     * @param packageName - The name of the package
     * @returns The latest version or null if not possible to get
     */
    private async getLatestVersion(
        packageName: string,
    ): Promise<string | null> {
        try {
            const response = await axios.get(
                `https://registry.npmjs.org/${encodeURIComponent(packageName)}/latest`,
                { timeout: 5000 },
            );

            if (response.data && response.data.version)
                return response.data.version;

            return null;
        } catch (error) {
            this.logger.log(
                `Error getting version for ${packageName}: ${error.message}`,
            );
            return null;
        }
    }

    /**
     * Get all modules
     * @returns The modules
     */
    public async getAllModules(): Promise<ModuleInfo[]> {
        // If modules haven't been loaded yet, try fetching them
        if (this.availableModules.length === 0) {
            await this.fetchModules();
        }

        const packageJson = this.readPackageJson();
        this.updateInstalledStatus(packageJson);

        // Verificar status de ativação para cada módulo
        for (const module of this.availableModules) {
            if (module.installed) {
                try {
                    const mainTs = this.readMainTs();
                    const isEnabled = this.checkModuleEnabled(mainTs, module);
                    module.isEnabled = isEnabled;
                } catch (error) {
                    this.logger.error(
                        `Error checking module status: ${error.message}`,
                    );
                    module.isEnabled = false;
                }
            } else {
                module.isEnabled = false;
            }
        }

        this.checkForUpdates(this.availableModules).catch((err) =>
            this.logger.error(`Error checking updates: ${err.message}`),
        );

        return this.availableModules;
    }

    private checkModuleEnabled(mainTs: string, module: ModuleInfo): boolean {
        if (!module?.moduleImport) {
            return false;
        }

        const { moduleImport } = module;

        // Verificar se os módulos estão presentes no array modules
        const modulesPattern = /modules:\s*\[([\s\S]*?)\]/;
        const modulesMatch = mainTs.match(modulesPattern);
        const modulesContent = modulesMatch ? modulesMatch[1] : '';

        const allModulesPresent = moduleImport.modules.every((modName) => {
            return modulesContent.includes(modName);
        });

        // Verificar se os providers estão presentes (se existirem)
        let allProvidersPresent = true;
        if (moduleImport.providers?.length) {
            const providersPattern = /providers:\s*\[([\s\S]*?)\]/;
            const providersMatch = mainTs.match(providersPattern);
            const providersContent = providersMatch ? providersMatch[1] : '';

            allProvidersPresent = moduleImport.providers.every((provider) => {
                return providersContent.includes(provider);
            });
        }

        return allModulesPresent && allProvidersPresent;
    }

    /**
     * Get the installed modules
     * @returns The installed modules
     */
    async getInstalledModules(): Promise<ModuleInfo[]> {
        const allModules = await this.getAllModules();
        return allModules.filter((module) => module.installed);
    }

    /**
     * Get the module details
     * @param moduleName - The name of the module
     * @returns The module details
     */
    async getModuleDetails(moduleName: string): Promise<ModuleInfo | null> {
        const allModules = await this.getAllModules();
        const module = allModules.find(
            (m) => m.name.toLowerCase() === moduleName.toLowerCase(),
        );

        return module || null;
    }

    /**
     * Get the modules by category
     * @returns The modules by category
     */
    async getModulesByCategory(): Promise<Record<string, ModuleInfo[]>> {
        const allModules = await this.getAllModules();
        const groupedModules: Record<string, ModuleInfo[]> = {};

        for (const module of allModules) {
            if (!groupedModules[module.category])
                groupedModules[module.category] = [];

            groupedModules[module.category].push(module);
        }

        return groupedModules;
    }

    /**
     * Detect the package manager
     * @returns The package manager
     */
    public detectPackageManager(): string {
        const projectRoot = process.cwd();

        if (fs.existsSync(path.join(projectRoot, 'pnpm-lock.yaml')))
            return 'pnpm';

        if (fs.existsSync(path.join(projectRoot, 'yarn.lock'))) return 'yarn';

        return 'npm';
    }

    /**
     * Build the install command
     * @param packageManager - The package manager
     * @param packages - The packages to install
     * @returns The install command
     */
    private buildInstallCommand(
        packageManager: string,
        packages: string[],
    ): string[] {
        switch (packageManager) {
            case 'pnpm':
                return ['add', ...packages];
            case 'yarn':
                return ['add', ...packages];
            case 'npm':
            default:
                return ['install', '--save', ...packages];
        }
    }

    /**
     * Install a module
     * @param moduleName - The name of the module
     * @param dependencies - The dependencies of the module
     * @returns The success and message of the operation
     */
    async installModule(
        moduleName: string,
        dependencies: string[],
    ): Promise<any> {
        try {
            this.logger.log(`Installing module ${moduleName}...`);

            if (!dependencies || dependencies.length === 0)
                throw new Error(
                    `No dependencies specified for module ${moduleName}`,
                );

            const { spawn } = require('child_process');
            const packageManager = this.detectPackageManager();
            const installCommand = this.buildInstallCommand(
                packageManager,
                dependencies,
            );

            this.logger.log(`Using package manager: ${packageManager}`);

            const installProcess = spawn(packageManager, installCommand, {
                cwd: process.cwd(),
                stdio: 'pipe',
                shell: true,
            });

            return new Promise((resolve, reject) => {
                let output = '';

                installProcess.stdout.on('data', (data) => {
                    output += data.toString();
                    this.logger.log(data.toString());
                });

                installProcess.stderr.on('data', (data) => {
                    output += data.toString();
                    this.logger.error(data.toString());
                });

                installProcess.on('close', (code) => {
                    if (code === 0) {
                        this.logger.log(
                            `Module ${moduleName} installed successfully`,
                        );
                        resolve({ moduleName, success: true, output });
                    } else {
                        this.logger.error(
                            `Failed to install module ${moduleName} with code ${code}`,
                        );
                        reject(
                            new Error(
                                `Installation failed with code ${code}: ${output}`,
                            ),
                        );
                    }
                });
            });
        } catch (error) {
            this.logger.error(
                `Error installing module ${moduleName}: ${error.message}`,
            );
            throw error;
        }
    }

    /**
     * Install a submodule for a module
     * @param moduleName - The name of the module
     * @param submoduleName - The name of the submodule
     * @param packageName - The name of the package to install
     * @returns The success and message of the operation
     */
    async installSubmodule(
        moduleName: string,
        submoduleName: string,
        packageName: string,
    ): Promise<any> {
        try {
            this.logger.log(
                `Installing submodule ${submoduleName} for module ${moduleName}...`,
            );

            if (!packageName)
                throw new Error(
                    `No package name specified for submodule ${submoduleName}`,
                );

            const { spawn } = require('child_process');
            const packageManager = this.detectPackageManager();
            const installCommand = this.buildInstallCommand(packageManager, [
                packageName,
            ]);

            this.logger.log(`Using package manager: ${packageManager}`);

            const installProcess = spawn(packageManager, installCommand, {
                cwd: process.cwd(),
                stdio: 'pipe',
                shell: true,
            });

            return new Promise((resolve, reject) => {
                let output = '';

                installProcess.stdout.on('data', (data) => {
                    output += data.toString();
                    this.logger.log(data.toString());
                });

                installProcess.stderr.on('data', (data) => {
                    output += data.toString();
                    this.logger.error(data.toString());
                });

                installProcess.on('close', (code) => {
                    if (code === 0) {
                        this.logger.log(
                            `Submodule ${submoduleName} installed successfully`,
                        );
                        resolve({
                            moduleName,
                            submoduleName,
                            success: true,
                            output,
                        });
                    } else {
                        this.logger.error(
                            `Failed to install submodule ${submoduleName} with code ${code}`,
                        );
                        reject(
                            new Error(
                                `Installation failed with code ${code}: ${output}`,
                            ),
                        );
                    }
                });
            });
        } catch (error) {
            this.logger.error(
                `Error installing submodule ${submoduleName}: ${error.message}`,
            );
            throw error;
        }
    }

    /**
     * Update a module
     * @param moduleName - The name of the module
     * @param dependencies - The dependencies of the module
     * @returns The success and message of the operation
     */
    async updateModule(
        moduleName: string,
        dependencies: string[],
    ): Promise<any> {
        try {
            this.logger.log(`Updating module ${moduleName}...`);

            if (!dependencies || dependencies.length === 0) {
                throw new Error(
                    `No dependencies specified for module ${moduleName}`,
                );
            }

            const { spawn } = require('child_process');
            const packageManager = this.detectPackageManager();

            let updateCommand: string[];
            switch (packageManager) {
                case 'pnpm':
                    updateCommand = ['update', '--latest', ...dependencies];
                    break;
                case 'yarn':
                    updateCommand = ['upgrade', ...dependencies];
                    break;
                case 'npm':
                default:
                    updateCommand = ['update', ...dependencies];
                    break;
            }

            this.logger.log(
                `Using package manager: ${packageManager} for update`,
            );

            const updateProcess = spawn(packageManager, updateCommand, {
                cwd: process.cwd(),
                stdio: 'pipe',
                shell: true,
            });

            return new Promise((resolve, reject) => {
                let output = '';

                updateProcess.stdout.on('data', (data) => {
                    output += data.toString();
                    this.logger.log(data.toString());
                });

                updateProcess.stderr.on('data', (data) => {
                    output += data.toString();
                    this.logger.error(data.toString());
                });

                updateProcess.on('close', (code) => {
                    if (code === 0) {
                        this.logger.log(
                            `Module ${moduleName} updated successfully`,
                        );
                        resolve({ moduleName, success: true, output });
                    } else {
                        this.logger.error(
                            `Failed to update module ${moduleName} with code ${code}`,
                        );
                        reject(
                            new Error(
                                `Update failed with code ${code}: ${output}`,
                            ),
                        );
                    }
                });
            });
        } catch (error) {
            this.logger.error(
                `Error updating module ${moduleName}: ${error.message}`,
            );
            throw error;
        }
    }

    /**
     * Ler o arquivo main.ts
     */
    private readMainTs(): string {
        try {
            return fs.readFileSync(this.mainTsPath, 'utf8');
        } catch (error) {
            this.logger.error(`Error reading main.ts: ${error.message}`);
            throw error;
        }
    }

    /**
     * Salvar o arquivo main.ts
     */
    private saveMainTs(content: string): void {
        try {
            // Criar backup
            const backupPath = `${this.mainTsPath}.backup`;
            fs.copyFileSync(this.mainTsPath, backupPath);

            // Salvar novo conteúdo
            fs.writeFileSync(this.mainTsPath, content, 'utf8');
        } catch (error) {
            this.logger.error(`Error saving main.ts: ${error.message}`);
            throw error;
        }
    }

    /**
     * Verificar se um módulo está ativo na aplicação
     */
    async isModuleEnabled(moduleName: string): Promise<boolean> {
        try {
            const mainTs = this.readMainTs();
            const module = this.availableModules.find(
                (m) => m.name === moduleName,
            );

            if (!module?.moduleImport) {
                return false;
            }

            const { moduleImport } = module;

            // Extrair o conteúdo do array modules
            const modulesMatch = mainTs.match(/modules:\s*\[([\s\S]*?)\]/);
            if (!modulesMatch) {
                return false;
            }

            const modulesContent = modulesMatch[1];

            // Verificar se todos os módulos estão presentes
            const allModulesPresent = moduleImport.modules.every((modName) => {
                return modulesContent.includes(modName);
            });

            // Verificar se todos os providers estão presentes (se existirem)
            let allProvidersPresent = true;
            if (moduleImport.providers?.length) {
                const providersMatch = mainTs.match(
                    /providers:\s*\[([\s\S]*?)\]/,
                );
                if (providersMatch) {
                    const providersContent = providersMatch[1];
                    allProvidersPresent = moduleImport.providers.every(
                        (provider) => {
                            return providersContent.includes(provider);
                        },
                    );
                } else {
                    allProvidersPresent = false;
                }
            }

            return allModulesPresent && allProvidersPresent;
        } catch (error) {
            this.logger.error(`Error checking module status: ${error.message}`);
            return false;
        }
    }

    /**
     * Ativar ou desativar um módulo na aplicação
     */
    async toggleModule(moduleName: string, enable: boolean): Promise<boolean> {
        try {
            let mainTs = this.readMainTs();
            const module = this.availableModules.find(
                (m) => m.name === moduleName,
            );

            if (!module?.moduleImport) {
                throw new Error(
                    `No module import configuration found for ${moduleName}`,
                );
            }

            const { moduleImport } = module;

            if (enable) {
                // Adicionar imports
                if (Array.isArray(moduleImport.import)) {
                    const importStatement = `import { ${moduleImport.import.join(', ')} } from '${moduleImport.path}';\n`;
                    if (!mainTs.includes(importStatement)) {
                        mainTs = this.insertImport(mainTs, importStatement);
                    }
                } else {
                    const importStatement = `import { ${moduleImport.import} } from '${moduleImport.path}';\n`;
                    if (!mainTs.includes(importStatement)) {
                        mainTs = this.insertImport(mainTs, importStatement);
                    }
                }

                // Adicionar módulos ao array modules
                for (const moduleName of moduleImport.modules) {
                    if (
                        !mainTs.includes(`${moduleName},`) &&
                        !mainTs.includes(`${moduleName}\n`)
                    ) {
                        mainTs = this.addModuleToArray(mainTs, moduleName);
                    }
                }

                // Adicionar providers se existirem
                if (moduleImport.providers?.length) {
                    for (const provider of moduleImport.providers) {
                        if (
                            !mainTs.includes(`${provider},`) &&
                            !mainTs.includes(`${provider}\n`)
                        ) {
                            mainTs = this.addProviderToArray(mainTs, provider);
                        }
                    }
                }
            } else {
                // Remover imports
                if (Array.isArray(moduleImport.import)) {
                    const importPattern = `import\\s*{[^}]*${moduleImport.import.join('[^}]*')}[^}]*}\\s*from\\s*['"]${moduleImport.path}['"];?\n?`;
                    mainTs = mainTs.replace(new RegExp(importPattern), '');
                } else {
                    const importPattern = `import\\s*{[^}]*${moduleImport.import}[^}]*}\\s*from\\s*['"]${moduleImport.path}['"];?\n?`;
                    mainTs = mainTs.replace(new RegExp(importPattern), '');
                }

                // Remover módulos do array
                for (const moduleName of moduleImport.modules) {
                    mainTs = this.removeModuleFromArray(mainTs, moduleName);
                }

                // Remover providers se existirem
                if (moduleImport.providers?.length) {
                    for (const provider of moduleImport.providers) {
                        mainTs = this.removeProviderFromArray(mainTs, provider);
                    }
                }
            }

            this.saveMainTs(mainTs);
            return true;
        } catch (error) {
            this.logger.error(`Error toggling module: ${error.message}`);
            throw error;
        }
    }

    private insertImport(content: string, importStatement: string): string {
        const lines = content.split('\n');
        const lastImportIndex = lines.reduce((lastIndex, line, index) => {
            return line.trim().startsWith('import') ? index : lastIndex;
        }, -1);

        lines.splice(lastImportIndex + 1, 0, importStatement);
        return lines.join('\n');
    }

    private addModuleToArray(content: string, moduleName: string): string {
        const moduleArrayRegex = /modules:\s*\[([\s\S]*?)\]/;
        return content.replace(moduleArrayRegex, (match, moduleList) => {
            const modules = moduleList.trim();
            const newModuleList = modules
                ? `${modules},\n        ${moduleName}`
                : moduleName;
            return `modules: [\n        ${newModuleList}\n    ]`;
        });
    }

    private removeModuleFromArray(content: string, moduleName: string): string {
        return content
            .replace(new RegExp(`[\\s,]*${moduleName}[,\\s]*`), ',')
            .replace(/,\s*,/g, ',')
            .replace(/\[\s*,/, '[')
            .replace(/,\s*\]/, ']');
    }

    private addProviderToArray(content: string, provider: string): string {
        const providerArrayRegex = /providers:\s*\[([\s\S]*?)\]/;
        return content.replace(providerArrayRegex, (match, providerList) => {
            const providers = providerList.trim();
            const newProviderList = providers
                ? `${providers},\n        ${provider}`
                : provider;
            return `providers: [\n        ${newProviderList}\n    ]`;
        });
    }

    private removeProviderFromArray(content: string, provider: string): string {
        return content
            .replace(new RegExp(`[\\s,]*${provider}[,\\s]*`), ',')
            .replace(/,\s*,/g, ',')
            .replace(/\[\s*,/, '[')
            .replace(/,\s*\]/, ']');
    }
}
