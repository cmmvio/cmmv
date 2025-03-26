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
export declare class ConfigService {
    private logger;
    private readonly configFilePath;
    private readonly packageModulesPath;
    private readonly monorepoModulesPath;
    /**
     * Lê o arquivo de configuração atual
     */
    readConfig(): Promise<any>;
    /**
     * Salva a configuração em um arquivo
     */
    saveConfig(config: any): Promise<boolean>;
    /**
     * Converte objeto de configuração para string com formatação adequada
     */
    private stringifyConfig;
    /**
     * Localiza e lê os arquivos de configuração dos módulos
     */
    getModuleConfigs(): Promise<ModuleConfig[]>;
    /**
     * Mescla duas arrays de opções, evitando duplicatas
     */
    private mergeOptions;
    private findModuleConfigsInDir;
    private processSchemaSection;
    private getNestedValue;
    private flatToNested;
    private findConfigFile;
    private getCoreConfig;
    /**
     * Obter valor atual de uma configuração
     */
    getConfigValue(moduleName: string, key: string): Promise<any>;
    /**
     * Definir valor de uma configuração
     */
    setConfigValue(moduleName: string, key: string, value: any): Promise<boolean>;
    /**
     * Atualizar toda a configuração de um módulo
     */
    updateModuleConfig(moduleName: string, moduleConfig: any): Promise<boolean>;
    /**
     * Obter conteúdo do arquivo de configuração
     */
    getConfigFile(): Promise<string>;
    saveConfigFile(content: string): Promise<boolean>;
}
