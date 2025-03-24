import * as fs from 'node:fs';
import * as path from 'node:path';
import axios from 'axios';
import { compare as semverCompare } from 'semver';

import { Service, Logger } from '@cmmv/core';

interface ModuleInfo {
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
}

interface SubmoduleInfo {
    name: string;
    installed: boolean;
    description: string;
    packageName?: string;
    version?: string;
}

@Service('modules')
export class ModulesService {
    private logger = new Logger('ModulesService');
    private readonly packageJsonPath = path.join(process.cwd(), 'package.json');

    private readonly availableModules: ModuleInfo[] = [
        {
            name: 'AI',
            installed: false,
            description:
                'Artificial Intelligence integration with multiple providers',
            category: 'Integration',
            dependencies: ['@cmmv/ai'],
            documentation: 'https://cmmv.io/docs/modules/ai',
        },
        {
            name: 'Authentication',
            installed: false,
            description: 'User authentication and authorization system',
            category: 'Security',
            dependencies: [
                '@cmmv/auth',
                '@loskir/styled-qr-code-node',
                'jsonwebtoken',
                'speakeasy',
            ],
            documentation: 'https://cmmv.io/docs/modules/authentication',
        },
        {
            name: 'Cache',
            installed: false,
            description: 'Caching system for improved performance',
            category: 'Performance',
            submodules: [
                {
                    name: 'Redis',
                    installed: false,
                    description: 'Redis cache adapter',
                    packageName: '@tirke/node-cache-manager-ioredis',
                },
                {
                    name: 'Memcached',
                    installed: false,
                    description: 'Memcached cache adapter',
                    packageName: 'cache-manager-memcached-store',
                },
                {
                    name: 'MongoDB',
                    installed: false,
                    description: 'MongoDB cache adapter',
                    packageName: 'cache-manager-mongodb',
                },
                {
                    name: 'Filesystem Binary',
                    installed: false,
                    description: 'Filesystem Binary cache adapter',
                    packageName: 'cache-manager-fs-binary',
                },
            ],
            dependencies: ['@cmmv/cache', 'cache-manager'],
            documentation: 'https://cmmv.io/docs/modules/cache',
        },
        {
            name: 'Elastic',
            installed: false,
            description:
                'Elasticsearch integration for advanced search capabilities',
            category: 'Integration',
            dependencies: ['@cmmv/elastic', '@elastic/elasticsearch'],
            documentation: 'https://cmmv.io/docs/modules/elastic',
        },
        {
            name: 'Email',
            installed: false,
            description: 'Email sending service with multiple provider support',
            category: 'Communication',
            dependencies: ['@cmmv/email', 'aws-sdk', 'nodemailer'],
            documentation: 'https://cmmv.io/docs/modules/email',
        },
        {
            name: 'Encryptor',
            installed: false,
            description: 'Data encryption and security utilities',
            category: 'Security',
            dependencies: [
                '@cmmv/encryptor',
                'bip32',
                'bip39',
                'bs58',
                'elliptic',
                'tiny-secp256k1',
            ],
            documentation: 'https://cmmv.io/docs/modules/encryptor',
        },
        {
            name: 'Events',
            installed: false,
            description: 'Event-driven architecture implementation',
            category: 'Architecture',
            dependencies: ['@cmmv/events', 'eventemitter2'],
            documentation: 'https://cmmv.io/docs/modules/events',
        },
        {
            name: 'Inspector',
            installed: false,
            description: 'Code and performance inspection tools',
            category: 'Development',
            dependencies: ['@cmmv/inspector'],
            documentation: 'https://cmmv.io/docs/modules/inspector',
        },
        {
            name: 'Normalizer',
            installed: false,
            description: 'Data normalization and transformation tools',
            category: 'Data Processing',
            dependencies: [
                '@cmmv/normalizer',
                'sax',
                'fast-json-stringify',
                'stream-json',
                'yaml',
            ],
            documentation: 'https://cmmv.io/docs/modules/normalizer',
        },
        {
            name: 'OpenAPI',
            installed: false,
            description: 'OpenAPI/Swagger documentation generator',
            category: 'Documentation',
            dependencies: ['@cmmv/openapi', 'js-yaml'],
            documentation: 'https://cmmv.io/docs/modules/openapi',
        },
        {
            name: 'Parallel',
            installed: false,
            description: 'Parallel processing and multi-threading support',
            category: 'Performance',
            dependencies: [
                '@cmmv/parallel',
                '@bnaya/objectbuffer',
                'fast-thread',
            ],
            documentation: 'https://cmmv.io/docs/modules/parallel',
        },
        {
            name: 'Queue',
            installed: false,
            description: 'Message and job queuing system',
            category: 'Architecture',
            submodules: [
                {
                    name: 'Redis',
                    installed: false,
                    description: 'Redis queue adapter',
                    packageName: 'ioredis',
                },
                {
                    name: 'RabbitMQ',
                    installed: false,
                    description: 'RabbitMQ queue adapter',
                    packageName: 'amqp-connection-manager',
                },
                {
                    name: 'Kafka',
                    installed: false,
                    description: 'Kafka queue adapter',
                    packageName: 'kafkajs',
                },
            ],
            dependencies: ['@cmmv/queue'],
            documentation: 'https://cmmv.io/docs/modules/queue',
        },
        {
            name: 'Repository',
            installed: false,
            description: 'Data persistence and ORM implementation',
            category: 'Data Storage',
            submodules: [
                {
                    name: 'MySQL',
                    installed: false,
                    description: 'MySQL/MariaDB adapter',
                    packageName: 'mysql2',
                },
                {
                    name: 'PostgreSQL',
                    installed: false,
                    description: 'PostgreSQL adapter',
                    packageName: 'pg',
                },
                {
                    name: 'MongoDB',
                    installed: false,
                    description: 'MongoDB adapter',
                    packageName: 'mongodb',
                },
                {
                    name: 'SQLite',
                    installed: false,
                    description: 'SQLite adapter',
                    packageName: 'sqlite3',
                },
                {
                    name: 'SQL Server',
                    installed: false,
                    description: 'SQL Server adapter',
                    packageName: 'mssql',
                },
                {
                    name: 'Oracle',
                    installed: false,
                    description: 'Oracle adapter',
                    packageName: 'oracledb',
                },
            ],
            dependencies: ['@cmmv/repository', 'typeorm'],
            documentation: 'https://cmmv.io/docs/modules/repository',
        },
        {
            name: 'Scheduling',
            installed: false,
            description: 'Task scheduling and cron jobs',
            category: 'System',
            dependencies: ['@cmmv/scheduling', 'cron'],
            documentation: 'https://cmmv.io/docs/modules/scheduling',
        },
        {
            name: 'Vault',
            installed: false,
            description: 'Secure credentials and secrets management',
            category: 'Security',
            dependencies: ['@cmmv/vault', '@cmmv/encryptor', 'elliptic'],
            documentation: 'https://cmmv.io/docs/modules/vault',
        },
        {
            name: 'GraphQL',
            installed: false,
            description: 'GraphQL API implementation',
            category: 'Integration',
            dependencies: [
                '@cmmv/graphql',
                'graphql',
                'graphql-scalars',
                'graphql-type-json',
                'type-graphql',
                '@apollo/server',
            ],
            documentation: 'https://cmmv.io/docs/graphql/overview',
        },
        {
            name: 'Protobuf',
            installed: false,
            description: 'Protocol Buffers implementation',
            category: 'Integration',
            dependencies: ['@cmmv/protobuf', 'protobufjs'],
            documentation: 'https://cmmv.io/docs/rpc/proto',
        },
        {
            name: 'WebSocket',
            installed: false,
            description: 'WebSocket server and client implementation',
            category: 'Integration',
            dependencies: ['@cmmv/websocket', 'ws'],
            documentation: 'https://cmmv.io/docs/rpc/websocket',
        },
        {
            name: 'Keyv',
            installed: false,
            description: 'Key-value storage implementation',
            category: 'Data Storage',
            submodules: [
                {
                    name: 'Redis',
                    installed: false,
                    description: 'Redis key-value adapter',
                    packageName: '@keyv/redis',
                },
                {
                    name: 'Memcached',
                    installed: false,
                    description: 'Memcached key-value adapter',
                    packageName: '@keyv/memcached',
                },
                {
                    name: 'MongoDB',
                    installed: false,
                    description: 'MongoDB key-value adapter',
                    packageName: '@keyv/mongodb',
                },
                {
                    name: 'SQLite',
                    installed: false,
                    description: 'SQLite key-value adapter',
                    packageName: '@keyv/sqlite',
                },
                {
                    name: 'MySQL',
                    installed: false,
                    description: 'MySQL key-value adapter',
                    packageName: '@keyv/mysql',
                },
                {
                    name: 'PostgreSQL',
                    installed: false,
                    description: 'PostgreSQL key-value adapter',
                    packageName: '@keyv/postgres',
                },
            ],
            dependencies: ['@cmmv/keyv', 'keyv', '@keyv/compress-gzip'],
        },
        {
            name: 'Testing',
            installed: false,
            description: 'Testing framework and utilities',
            category: 'Development',
            dependencies: ['@cmmv/testing'],
        },
    ];

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
            if (module.dependencies) {
                const isInstalled = module.dependencies.some(
                    (dep) => dep in installedDependencies,
                );
                module.installed = isInstalled;

                if (isInstalled) {
                    const mainModulePattern = `@cmmv/${module.name.toLowerCase()}`;
                    const cmmvMainDep = module.dependencies.find(
                        (dep) => dep.toLowerCase() === mainModulePattern,
                    );

                    const cmmvDep =
                        cmmvMainDep ||
                        module.dependencies.find((dep) =>
                            dep.startsWith('@cmmv/'),
                        );

                    const mainDep = cmmvDep || module.dependencies[0];

                    if (mainDep && mainDep in installedDependencies) {
                        module.version = installedDependencies[mainDep];
                        module['versionSource'] = mainDep;
                    }
                }
            }

            if (module.submodules) {
                for (const submodule of module.submodules) {
                    const submodulePackage =
                        submodule.packageName ||
                        `@cmmv/${module.name.toLowerCase()}-${submodule.name.toLowerCase()}`;

                    submodule.installed =
                        submodulePackage in installedDependencies;

                    if (submodule.installed)
                        submodule.version =
                            installedDependencies[submodulePackage];
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
                                `@cmmv/${module.name.toLowerCase()}`,
                    ) || module.dependencies?.[0];

                if (!mainPackage) continue;

                const installedVersion = module.version?.replace(/^[\^~]/, '');
                const latestVersion = await this.getLatestVersion(mainPackage);

                if (latestVersion) {
                    module.latestVersion = latestVersion;

                    if (installedVersion && latestVersion) {
                        try {
                            module.updateAvailable =
                                semverCompare(latestVersion, installedVersion) >
                                0;
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
    async getAllModules(): Promise<ModuleInfo[]> {
        const packageJson = this.readPackageJson();
        this.updateInstalledStatus(packageJson);

        this.checkForUpdates(this.availableModules).catch((err) =>
            this.logger.error(`Error checking updates: ${err.message}`),
        );

        return this.availableModules;
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
}
