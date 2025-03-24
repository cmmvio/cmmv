import { Controller, Get, Post, Body, Param } from '@cmmv/http';
import { Auth } from '@cmmv/auth';
import { ConfigService } from './config.service';

@Controller('config')
export class ConfigController {
    constructor(private readonly configService: ConfigService) {}

    @Get()
    @Auth({ rootOnly: true })
    async getConfig() {
        try {
            const config = await this.configService.readConfig();
            return {
                success: true,
                data: config,
            };
        } catch (error) {
            return {
                success: false,
                message: 'Error reading config',
                error: error.message,
            };
        }
    }

    @Get('modules')
    @Auth({ rootOnly: true })
    public async getModuleConfigs() {
        try {
            const moduleConfigs = await this.configService.getModuleConfigs();
            return {
                success: true,
                data: moduleConfigs,
            };
        } catch (error) {
            return {
                success: false,
                message: 'Error retrieving module configs',
                error: error.message,
            };
        }
    }

    @Get('file')
    @Auth({ rootOnly: true })
    async getConfigFile() {
        try {
            const content = await this.configService.getConfigFile();
            return {
                success: true,
                data: content,
            };
        } catch (error) {
            return {
                success: false,
                message: 'Error reading config file',
                error: error.message,
            };
        }
    }

    @Post('file')
    @Auth({ rootOnly: true })
    async saveConfigFile(@Body() body: { content: string }) {
        try {
            const success = await this.configService.saveConfigFile(
                body.content,
            );
            return {
                success: true,
                message: 'Config file saved successfully',
            };
        } catch (error) {
            return {
                success: false,
                message: 'Error saving config file',
                error: error.message,
            };
        }
    }

    @Get(':module')
    @Auth({ rootOnly: true })
    async getModuleConfig(@Param('module') moduleName: string) {
        try {
            const config = await this.configService.readConfig();
            return {
                success: true,
                data: config[moduleName] || {},
            };
        } catch (error) {
            return {
                success: false,
                message: `Error reading config for module ${moduleName}`,
                error: error.message,
            };
        }
    }

    @Post(':module')
    @Auth({ rootOnly: true })
    async updateModuleConfig(
        @Param('module') moduleName: string,
        @Body() config: any,
    ) {
        try {
            const success = await this.configService.updateModuleConfig(
                moduleName,
                config,
            );

            if (success) {
                return {
                    success: true,
                    message: `Configuration for ${moduleName} updated successfully`,
                };
            } else {
                return {
                    success: false,
                    message: `Failed to update configuration for ${moduleName}`,
                };
            }
        } catch (error) {
            return {
                success: false,
                message: `Error updating config for module ${moduleName}`,
                error: error.message,
            };
        }
    }

    @Post(':module/:key')
    @Auth({ rootOnly: true })
    async setConfigValue(
        @Param('module') moduleName: string,
        @Param('key') key: string,
        @Body() body: { value: any },
    ) {
        try {
            const success = await this.configService.setConfigValue(
                moduleName,
                key,
                body.value,
            );

            if (success) {
                return {
                    success: true,
                    message: `Configuration value ${moduleName}.${key} updated successfully`,
                };
            } else {
                return {
                    success: false,
                    message: `Failed to update configuration value ${moduleName}.${key}`,
                };
            }
        } catch (error) {
            return {
                success: false,
                message: `Error updating config value ${moduleName}.${key}`,
                error: error.message,
            };
        }
    }
}
