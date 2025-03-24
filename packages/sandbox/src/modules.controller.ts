import { Controller, Get, Param, Post, Body } from '@cmmv/http';

import { Auth } from '@cmmv/auth';

import { ModulesService } from './modules.service';

@Controller('modules')
export class ModulesController {
    constructor(private readonly modulesService: ModulesService) {}

    @Get()
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

    @Get('installed')
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

    @Get('categories')
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

    @Get(':name')
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

    @Post('install')
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

    @Post('install-submodule')
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

    @Get('package-manager')
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

    @Post('update')
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
}
