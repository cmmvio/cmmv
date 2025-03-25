import { Controller, Get, Param, Post, Body } from '@cmmv/http';

import { Auth } from '@cmmv/auth';

import { ModulesService } from './modules.service';

@Controller('modules')
export class ModulesController {
    constructor(private readonly modulesService: ModulesService) {}

    @Get({ exclude: true })
    @Auth({ rootOnly: true })
    public async getAllModules() {
        try {
            const modules = await this.modulesService.getAllModules();
            return {
                success: true,
                data: modules,
            };
        } catch (error) {
            return {
                success: false,
                message: 'Error retrieving modules',
                error: error.message,
            };
        }
    }

    @Get('installed', { exclude: true })
    @Auth({ rootOnly: true })
    public async getInstalledModules() {
        try {
            const modules = await this.modulesService.getInstalledModules();
            return {
                success: true,
                data: modules,
            };
        } catch (error) {
            return {
                success: false,
                message: 'Error retrieving installed modules',
                error: error.message,
            };
        }
    }

    @Get('categories', { exclude: true })
    @Auth({ rootOnly: true })
    public async getModulesByCategory() {
        try {
            const modules = await this.modulesService.getModulesByCategory();
            return {
                success: true,
                data: modules,
            };
        } catch (error) {
            return {
                success: false,
                message: 'Error retrieving modules by category',
                error: error.message,
            };
        }
    }

    @Get(':name', { exclude: true })
    @Auth({ rootOnly: true })
    public async getModuleDetails(@Param('name') moduleName: string) {
        try {
            const module =
                await this.modulesService.getModuleDetails(moduleName);

            if (!module) {
                return {
                    success: false,
                    message: `Module '${moduleName}' not found`,
                };
            }

            return {
                success: true,
                data: module,
            };
        } catch (error) {
            return {
                success: false,
                message: 'Error retrieving module details',
                error: error.message,
            };
        }
    }

    @Post('install', { exclude: true })
    @Auth({ rootOnly: true })
    public async installModule(
        @Body() data: { moduleName: string; dependencies: string[] },
    ) {
        try {
            const result = await this.modulesService.installModule(
                data.moduleName,
                data.dependencies,
            );
            return {
                success: true,
                message: `Module ${data.moduleName} installed successfully`,
                data: result,
            };
        } catch (error) {
            return {
                success: false,
                message: `Failed to install module ${data.moduleName}`,
                error: error.message,
            };
        }
    }

    @Post('install-submodule', { exclude: true })
    @Auth({ rootOnly: true })
    public async installSubmodule(
        @Body()
        data: {
            moduleName: string;
            submoduleName: string;
            packageName: string;
        },
    ) {
        try {
            const result = await this.modulesService.installSubmodule(
                data.moduleName,
                data.submoduleName,
                data.packageName,
            );
            return {
                success: true,
                message: `Submodule ${data.submoduleName} installed successfully`,
                data: result,
            };
        } catch (error) {
            return {
                success: false,
                message: `Failed to install submodule ${data.submoduleName}`,
                error: error.message,
            };
        }
    }

    @Get('package-manager', { exclude: true })
    @Auth({ rootOnly: true })
    public async getPackageManager() {
        try {
            const packageManager = this.modulesService.detectPackageManager();
            return {
                success: true,
                data: { packageManager },
            };
        } catch (error) {
            return {
                success: false,
                message: 'Error retrieving package manager',
                error: error.message,
            };
        }
    }

    @Post('update', { exclude: true })
    @Auth({ rootOnly: true })
    public async updateModule(
        @Body() data: { moduleName: string; dependencies: string[] },
    ) {
        try {
            const result = await this.modulesService.updateModule(
                data.moduleName,
                data.dependencies,
            );
            return {
                success: true,
                message: `Module ${data.moduleName} updated successfully`,
                data: result,
            };
        } catch (error) {
            return {
                success: false,
                message: `Failed to update module ${data.moduleName}`,
                error: error.message,
            };
        }
    }

    @Get(':name/status', { exclude: true })
    @Auth({ rootOnly: true })
    public async getModuleStatus(@Param('name') moduleName: string) {
        try {
            const isEnabled =
                await this.modulesService.isModuleEnabled(moduleName);
            return {
                success: true,
                data: { enabled: isEnabled },
            };
        } catch (error) {
            return {
                success: false,
                message: 'Error checking module status',
                error: error.message,
            };
        }
    }

    @Post(':name/toggle', { exclude: true })
    @Auth({ rootOnly: true })
    public async toggleModule(
        @Param('name') moduleName: string,
        @Body() data: { enable: boolean },
    ) {
        try {
            await this.modulesService.toggleModule(moduleName, data.enable);
            return {
                success: true,
                message: `Module ${moduleName} ${data.enable ? 'enabled' : 'disabled'} successfully`,
            };
        } catch (error) {
            return {
                success: false,
                message: `Failed to ${data.enable ? 'enable' : 'disable'} module ${moduleName}`,
                error: error.message,
            };
        }
    }
}
