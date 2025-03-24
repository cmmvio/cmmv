import * as fs from 'node:fs';
import * as path from 'node:path';
import * as fg from 'fast-glob';
import { Service, Logger } from '@cmmv/core';

export interface ConfigOption {
    key: string;
    type: string;
    default?: any;
    description: string;
    required?: boolean;
    enum?: string[];
    min?: number;
    max?: number;
    pattern?: string;
    group?: string;
    env?: string;
    properties?: Record<string, ConfigSubOption>;
}

export interface ConfigSubOption {
    type: string;
    default?: any;
    required?: boolean;
    description?: string;
    enum?: string[];
    min?: number;
    max?: number;
    pattern?: string;
    env?: string;
    properties?: Record<string, ConfigSubOption>;
}

export interface ModuleConfig {
    name: string;
    description: string;
    options: ConfigOption[];
    icon?: string;
    order?: number;
}

@Service('config')
export class ConfigService {
    private logger = new Logger('ConfigService');
    private readonly configFilePath = path.join(
        process.cwd(),
        '.cmmv.config.cjs',
    );
    private readonly packageModulesPath = path.join(
        process.cwd(),
        'node_modules/@cmmv',
    );
    private readonly monorepoModulesPath = path.join(process.cwd(), 'packages');

    /**
     * Lê o arquivo de configuração atual
     */
    async readConfig(): Promise<any> {
        try {
            if (!fs.existsSync(this.configFilePath)) {
                this.logger.log(
                    `Config file not found at ${this.configFilePath}`,
                );
                return {};
            }

            // Como o arquivo é CJS, precisamos limpar o cache para ler alterações recentes
            delete require.cache[require.resolve(this.configFilePath)];
            const config = require(this.configFilePath);
            return config;
        } catch (error) {
            this.logger.error(`Error reading config file: ${error.message}`);
            return {};
        }
    }

    /**
     * Salva a configuração em um arquivo
     */
    async saveConfig(config: any): Promise<boolean> {
        try {
            // Converter o objeto de configuração para string formatada
            const configString = `module.exports = ${this.stringifyConfig(config, 2)};`;

            // Criar backup do arquivo atual, se existir
            if (fs.existsSync(this.configFilePath)) {
                const backupPath = `${this.configFilePath}.backup`;
                fs.copyFileSync(this.configFilePath, backupPath);
            }

            // Salvar o novo arquivo de configuração
            fs.writeFileSync(this.configFilePath, configString, 'utf8');

            this.logger.log(`Config saved to ${this.configFilePath}`);
            return true;
        } catch (error) {
            this.logger.error(`Error saving config file: ${error.message}`);
            return false;
        }
    }

    /**
     * Converte objeto de configuração para string com formatação adequada
     */
    private stringifyConfig(config: any, indent: number = 2): string {
        const replacer = (key: string, value: any) => {
            // Se o valor for uma função, retorna-a como string
            if (typeof value === 'function') {
                return value.toString();
            }
            // Se o valor for undefined, retorna undefined como texto
            if (value === undefined) {
                return 'undefined';
            }
            return value;
        };

        // Stringify inicial
        let str = JSON.stringify(config, replacer, indent);

        // Substituir aspas em chaves de funções
        str = str.replace(/"(function\s*\([^)]*\)\s*{[^}]*})"/g, '$1');

        // Substituir aspas em referências a processos
        str = str.replace(/"process\.env\.([A-Z_0-9]+)"/g, 'process.env.$1');

        // Substituir "undefined" string por undefined real
        str = str.replace(/"undefined"/g, 'undefined');

        return str;
    }

    /**
     * Localiza e lê os arquivos de configuração dos módulos
     */
    public async getModuleConfigs(): Promise<ModuleConfig[]> {
        const moduleConfigsMap = new Map<string, ModuleConfig>();

        // Primeiro procura nos módulos do monorepo
        const monorepoModules = await this.findModuleConfigsInDir(
            this.monorepoModulesPath,
        );
        for (const module of monorepoModules) {
            moduleConfigsMap.set(module.name, module);
        }

        // Depois procura nos node_modules e mescla com existentes
        const nodeModules = await this.findModuleConfigsInDir(
            this.packageModulesPath,
            '@cmmv',
        );
        for (const module of nodeModules) {
            if (moduleConfigsMap.has(module.name)) {
                // Mesclar opções se o módulo já existe
                const existing = moduleConfigsMap.get(module.name)!;
                const mergedOptions = this.mergeOptions(
                    existing.options,
                    module.options,
                );
                moduleConfigsMap.set(module.name, {
                    ...existing,
                    options: mergedOptions,
                });
            } else {
                moduleConfigsMap.set(module.name, module);
            }
        }

        // Converter o Map para array e ordenar
        const moduleConfigs = Array.from(moduleConfigsMap.values());
        return moduleConfigs.sort((a, b) => {
            if (a.name === 'core') return -1;
            if (b.name === 'core') return 1;

            if (a.order !== undefined && b.order !== undefined)
                return a.order - b.order;

            if (a.order !== undefined) return -1;
            if (b.order !== undefined) return 1;

            return a.name.localeCompare(b.name);
        });
    }

    /**
     * Mescla duas arrays de opções, evitando duplicatas
     */
    private mergeOptions(
        options1: ConfigOption[],
        options2: ConfigOption[],
    ): ConfigOption[] {
        const optionsMap = new Map<string, ConfigOption>();

        // Função auxiliar para criar uma chave única para cada opção
        const createKey = (option: ConfigOption) => {
            return `${option.group || 'General'}.${option.key}`;
        };

        // Função para mesclar duas opções
        const mergeOption = (
            target: ConfigOption,
            source: ConfigOption,
        ): ConfigOption => {
            const merged = { ...target };

            // Mesclar propriedades simples
            if (source.description) merged.description = source.description;
            if (source.default !== undefined) merged.default = source.default;
            if (source.required !== undefined)
                merged.required = source.required;
            if (source.type) merged.type = source.type;
            if (source.group) merged.group = source.group;
            if (source.env) merged.env = source.env;

            // Mesclar arrays
            if (source.enum) {
                merged.enum = Array.from(
                    new Set([...(target.enum || []), ...source.enum]),
                );
            }

            // Mesclar propriedades numéricas
            if (source.min !== undefined) merged.min = source.min;
            if (source.max !== undefined) merged.max = source.max;
            if (source.pattern) merged.pattern = source.pattern;

            // Mesclar propriedades de objetos aninhados
            if (target.properties || source.properties) {
                merged.properties = { ...(target.properties || {}) };

                if (source.properties) {
                    for (const [key, sourceProp] of Object.entries(
                        source.properties,
                    )) {
                        if (merged.properties[key]) {
                            // Mesclar propriedades existentes
                            merged.properties[key] = {
                                ...merged.properties[key],
                                ...sourceProp,
                                // Preservar defaults existentes se não houver novos
                                default:
                                    sourceProp.default !== undefined
                                        ? sourceProp.default
                                        : merged.properties[key].default,
                            };
                        } else {
                            // Adicionar nova propriedade
                            merged.properties[key] = sourceProp;
                        }
                    }
                }
            }

            return merged;
        };

        // Primeiro, adiciona todas as opções do primeiro array
        for (const option of options1) {
            const key = createKey(option);
            optionsMap.set(key, { ...option });
        }

        // Depois, mescla ou adiciona opções do segundo array
        for (const option of options2) {
            const key = createKey(option);
            if (optionsMap.has(key)) {
                // Se a opção já existe, mescla as propriedades
                const existing = optionsMap.get(key)!;
                optionsMap.set(key, mergeOption(existing, option));
            } else {
                // Se não existe, adiciona a nova opção
                optionsMap.set(key, { ...option });
            }
        }

        // Converte o Map de volta para array
        return Array.from(optionsMap.values());
    }

    private async findModuleConfigsInDir(
        directory: string,
        prefix: string = '',
    ): Promise<ModuleConfig[]> {
        const moduleConfigsMap = new Map<string, ModuleConfig>();
        const currentConfig = await this.readConfig();

        try {
            if (!fs.existsSync(directory)) {
                return [];
            }

            const packageJsonPaths = await fg('**/package.json', {
                absolute: true,
                cwd: directory,
                dot: false,
                ignore: [
                    'node_modules/**',
                    'dist/**',
                    'build/**',
                    'coverage/**',
                ],
            });

            for (const packageJsonPath of packageJsonPaths) {
                try {
                    const packageJson = JSON.parse(
                        fs.readFileSync(packageJsonPath, 'utf8'),
                    );
                    const moduleName =
                        packageJson.name?.replace('@cmmv/', '') ||
                        path.basename(path.dirname(packageJsonPath));
                    const moduleDir = path.dirname(packageJsonPath);

                    const configFiles = await fg(
                        [
                            '*.config.js',
                            'lib/*.config.js',
                            'dist/*.config.js',
                            '*.config.ts',
                            'lib/*.config.ts',
                            'src/*.config.ts',
                        ],
                        {
                            absolute: true,
                            cwd: moduleDir,
                            dot: false,
                        },
                    );

                    let moduleOptions: ConfigOption[] = [];

                    // Processar cada arquivo de configuração encontrado
                    for (const configFile of configFiles) {
                        if (fs.existsSync(configFile)) {
                            try {
                                delete require.cache[
                                    require.resolve(configFile)
                                ];
                                const configModule = require(configFile);

                                // Procurar por qualquer exportação que termine com 'Config'
                                const configKeys = Object.keys(
                                    configModule,
                                ).filter((key) => key.endsWith('Config'));

                                for (const configKey of configKeys) {
                                    const moduleSchema =
                                        configModule[configKey];
                                    const fileOptions: ConfigOption[] = [];

                                    // Processar cada seção do schema
                                    for (const [
                                        sectionKey,
                                        sectionSchema,
                                    ] of Object.entries<Record<string, any>>(
                                        moduleSchema,
                                    )) {
                                        this.processSchemaSection(
                                            sectionKey,
                                            sectionSchema,
                                            fileOptions,
                                            currentConfig[moduleName],
                                        );
                                    }

                                    // Mesclar as opções deste arquivo com as opções anteriores
                                    if (moduleOptions.length === 0) {
                                        moduleOptions = fileOptions;
                                    } else {
                                        moduleOptions = this.mergeOptions(
                                            moduleOptions,
                                            fileOptions,
                                        );
                                    }
                                }
                            } catch (error) {
                                this.logger.error(
                                    `Error loading config from ${configFile}: ${error.message}`,
                                );
                            }
                        }
                    }

                    // Se encontramos opções para este módulo
                    if (moduleOptions.length > 0) {
                        if (moduleConfigsMap.has(moduleName)) {
                            // Se o módulo já existe, mesclar as opções
                            const existing = moduleConfigsMap.get(moduleName)!;
                            moduleConfigsMap.set(moduleName, {
                                ...existing,
                                options: this.mergeOptions(
                                    existing.options,
                                    moduleOptions,
                                ),
                            });
                        } else {
                            // Se é um novo módulo, adicionar ao map
                            moduleConfigsMap.set(moduleName, {
                                name: moduleName,
                                description: `Configuration for ${moduleName}`,
                                options: moduleOptions,
                            });
                        }
                    }
                } catch (error) {
                    this.logger.error(
                        `Error processing module at ${packageJsonPath}: ${error.message}`,
                    );
                }
            }

            return Array.from(moduleConfigsMap.values());
        } catch (error) {
            this.logger.error(
                `Error searching for module configs in ${directory}: ${error.message}`,
            );
            return [];
        }
    }

    private processSchemaSection(
        sectionKey: string,
        schema: Record<string, any>,
        options: ConfigOption[],
        currentConfig?: any,
        parentKey: string = '',
    ) {
        for (const [key, definition] of Object.entries<any>(schema)) {
            const fullKey = parentKey ? `${parentKey}.${key}` : key;

            // Obter o valor atual da configuração
            const currentValue = currentConfig
                ? this.getNestedValue(currentConfig, fullKey)
                : undefined;

            if (definition.type === 'object' && definition.properties) {
                // É um objeto com sub-propriedades
                const option: ConfigOption = {
                    key: key, // Usar apenas a chave local
                    type: 'object',
                    description:
                        definition.description || `${key} configuration`,
                    required: definition.required || false,
                    group: sectionKey,
                    properties: {},
                };

                // Processar sub-propriedades
                for (const [propKey, propDef] of Object.entries<any>(
                    definition.properties,
                )) {
                    option.properties![propKey] = {
                        type: propDef.type,
                        default: propDef.default,
                        required: propDef.required || false,
                        description: propDef.description,
                        enum: propDef.enum,
                        min: propDef.min,
                        max: propDef.max,
                        pattern: propDef.pattern,
                        env: propDef.env,
                        properties: propDef.properties,
                    };

                    // Adicionar o valor atual da sub-propriedade
                    const subValue = currentValue
                        ? currentValue[propKey]
                        : undefined;
                    if (subValue !== undefined) {
                        option.properties![propKey].default = subValue;
                    }
                }

                options.push(option);
            } else {
                // É uma propriedade simples
                options.push({
                    key: key, // Usar apenas a chave local
                    type: definition.type,
                    default:
                        currentValue !== undefined
                            ? currentValue
                            : definition.default,
                    required: definition.required || false,
                    description:
                        definition.description || `${key} configuration`,
                    group: sectionKey,
                    enum: definition.enum,
                    min: definition.min,
                    max: definition.max,
                    pattern: definition.pattern,
                    env: definition.env,
                });
            }
        }
    }

    // Atualizar o método getNestedValue para trabalhar com caminhos simples
    private getNestedValue(obj: any, path: string): any {
        if (!obj) return undefined;

        const parts = path.split('.');
        let current = obj;

        for (const part of parts) {
            if (current === undefined || current === null) return undefined;
            current = current[part];
        }

        return current;
    }

    // Função auxiliar para converter objeto achatado em aninhado
    private flatToNested(flat: Record<string, any>): Record<string, any> {
        const nested: Record<string, any> = {};

        for (const [key, value] of Object.entries(flat)) {
            const parts = key.split('.');
            let current = nested;

            for (let i = 0; i < parts.length - 1; i++) {
                const part = parts[i];
                current[part] = current[part] || {};
                current = current[part];
            }

            current[parts[parts.length - 1]] = value;
        }

        return nested;
    }

    private findConfigFile(modulePath: string): string | null {
        const possibleFiles = [
            path.join(modulePath, '*.config.js'),
            path.join(modulePath, 'lib', '*.config.js'),
            path.join(modulePath, 'dist', '*.config.js'),
            path.join(modulePath, '*.config.ts'),
            path.join(modulePath, 'lib', '*.config.ts'),
            path.join(modulePath, 'src', '*.config.ts'),
        ];

        for (const pattern of possibleFiles) {
            const files = fg.sync(pattern, {
                absolute: true,
                cwd: modulePath,
            });

            if (files.length > 0) {
                return files[0];
            }
        }

        return null;
    }

    private async getCoreConfig(): Promise<ModuleConfig | null> {
        try {
            const possibleCorePaths = [
                path.join(this.monorepoModulesPath, 'core'),
                path.join(this.packageModulesPath, '@cmmv', 'core'),
            ];

            for (const corePath of possibleCorePaths) {
                const configFile = this.findConfigFile(corePath);
                if (configFile) {
                    delete require.cache[require.resolve(configFile)];
                    const coreConfig = require(configFile);

                    if (coreConfig) {
                        return {
                            name: 'core',
                            description:
                                coreConfig.description || 'Core Configuration',
                            options: coreConfig.options || [],
                            icon: coreConfig.icon,
                            order: -999,
                        };
                    }
                }
            }

            return null;
        } catch (error) {
            this.logger.error(`Error loading core config: ${error.message}`);
            return null;
        }
    }

    /**
     * Obter valor atual de uma configuração
     */
    async getConfigValue(moduleName: string, key: string): Promise<any> {
        const config = await this.readConfig();
        if (!config) return undefined;

        if (!config[moduleName]) return undefined;

        return config[moduleName][key];
    }

    /**
     * Definir valor de uma configuração
     */
    async setConfigValue(
        moduleName: string,
        key: string,
        value: any,
    ): Promise<boolean> {
        try {
            const config = await this.readConfig();

            // Garantir que o módulo existe na configuração
            if (!config[moduleName]) {
                config[moduleName] = {};
            }

            // Definir o valor
            config[moduleName][key] = value;

            // Salvar o arquivo
            return await this.saveConfig(config);
        } catch (error) {
            this.logger.error(`Error setting config value: ${error.message}`);
            return false;
        }
    }

    /**
     * Atualizar toda a configuração de um módulo
     */
    async updateModuleConfig(
        moduleName: string,
        moduleConfig: any,
    ): Promise<boolean> {
        try {
            const config = await this.readConfig();

            // Converter de formato achatado para aninhado
            const nestedConfig = this.flatToNested(moduleConfig);

            // Atualizar a configuração do módulo
            config[moduleName] = nestedConfig;

            // Salvar o arquivo
            return await this.saveConfig(config);
        } catch (error) {
            this.logger.error(`Error updating module config: ${error.message}`);
            return false;
        }
    }

    /**
     * Obter conteúdo do arquivo de configuração
     */
    async getConfigFile(): Promise<string> {
        try {
            if (!fs.existsSync(this.configFilePath)) {
                return '';
            }

            return fs.readFileSync(this.configFilePath, 'utf8');
        } catch (error) {
            this.logger.error(`Error reading config file: ${error.message}`);
            throw error;
        }
    }

    async saveConfigFile(content: string): Promise<boolean> {
        try {
            if (fs.existsSync(this.configFilePath)) {
                const backupPath = `${this.configFilePath}.backup`;
                fs.copyFileSync(this.configFilePath, backupPath);
            }

            fs.writeFileSync(this.configFilePath, content, 'utf8');

            this.logger.log(`Config file saved to ${this.configFilePath}`);
            return true;
        } catch (error) {
            this.logger.error(`Error saving config file: ${error.message}`);
            throw error;
        }
    }
}
