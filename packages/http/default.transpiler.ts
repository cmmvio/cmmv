import * as fs from 'fs';
import * as path from 'path';

import {
    Application,
    Config,
    ITranspile,
    Scope,
    AbstractTranspile,
    IContract,
    Module,
} from '@cmmv/core';

export class DefaultHTTPTranspiler
    extends AbstractTranspile
    implements ITranspile
{
    run(): void {
        const contracts = Scope.getArray<any>('__contracts');
        const controllers = [];
        const providers = [];

        contracts?.forEach((contract: IContract) => {
            if (contract.generateController) {
                this.generateService(contract);
                this.generateController(contract);
                controllers.push({
                    name: `${contract.controllerName}Controller`,
                    subPath: contract.subPath ? contract.subPath : '',
                });
                providers.push({
                    name: `${contract.controllerName}Service`,
                    subPath: contract.subPath ? contract.subPath : '',
                });
            }
        });

        this.generateModule(controllers, providers);
    }

    private generateService(contract: IContract): void {
        const serviceName = `${contract.controllerName}Service`;
        const modelName = `${contract.controllerName}`;
        const modelInterfaceName = `I${modelName}`;
        const serviceFileNameGenerated = `${contract.controllerName.toLowerCase()}.service.ts`;
        const serviceFileName = `${contract.controllerName.toLowerCase()}.service.ts`;

        let importsFromModel = [];

        contract.services
            .filter((service) => service.createBoilerplate === true)
            .map((service) => {
                importsFromModel.push(service.request);
                importsFromModel.push(service.response);
            });

        importsFromModel = [...new Set(importsFromModel)];

        const serviceTemplateGenerated = `/**
    **********************************************
    This script was generated automatically by CMMV.
    It is recommended not to modify this file manually,
    as it may be overwritten by the application.
    **********************************************
**/

import {
    AbstractService, Service, validate,
    instanceToPlain, plainToClass
} from '@cmmv/core';

import {
    ${modelName},
    ${modelInterfaceName},${importsFromModel.join(', \n   ')}
} from "${this.getImportPath(contract, 'models', modelName.toLowerCase() + '.model', '@models')}";

export class ${serviceName}Generated extends AbstractService {
    private items: ${modelName}[] = [];

    async getAll(queries?: any, req?: any) {
        return this.items;
    }

    async getById(id: string, req?: any) {
        const item = this.items.find(i => i.id === id);

        if (item)
            return item;

        throw new Error('Item not found');
    }

    async insert(item: ${modelInterfaceName}, req?: any) {
        return new Promise((resolve, reject) => {
            item['id'] = this.items.length + 1;

            const newItem = plainToClass(${modelName}, item, {
                excludeExtraneousValues: true
            });

            validate(newItem, { skipMissingProperties: true }).then(err => {
                if(!err){
                    this.items.push(newItem);
                    resolve(newItem);
                }
                else{
                    reject(err);
                }
            });
        });
    }

    async update(id: string, item: ${modelInterfaceName}, req?: any) {
        return new Promise((resolve, reject) => {
            const index = this.items.findIndex(i => i.id === parseInt(id));

            if (index !== -1){
                let itemRaw = instanceToPlain(this.items[index]);
                let updateItem = { ...itemRaw, ...item };

                const editedItem = plainToClass(${modelName}, updateItem, {
                    excludeExtraneousValues: true
                });

                validate(editedItem, { skipMissingProperties: true }).then(err => {
                    if(!err){
                        this.items[index] = editedItem;
                        resolve(editedItem);
                    }
                    else reject(err);
                });
            }
            else{
                reject('Item not found');
            }
        });
    }

    async delete(id: string, req?: any) {
        const index = this.items.findIndex(i => i.id === parseInt(id));

        if (index !== -1) {
            this.items.splice(index, 1);
            return { affected: 1 };
        }

        throw new Error('Item not found');
    }

    ${contract.services
        .filter((service) => service.createBoilerplate === true)
        .map((service) => {
            return `    async ${service.name}(payload: ${service.request}): Promise<${service.response}> {
            throw new Error("Function ${service.name} not implemented");
        }`;
        })
        .join('\n\n')}
}`;

        const outputDir = this.getRootPath(contract, 'services');
        const outputDirGenerated = this.getGeneratedPath(contract, 'services');
        const outputFilePath = path.join(
            outputDirGenerated,
            serviceFileNameGenerated,
        );

        fs.writeFileSync(
            outputFilePath,
            this.removeExtraSpaces(serviceTemplateGenerated),
            'utf8',
        );

        //Service
        const serviceTemplate = `import { Service } from '@cmmv/core';

import {
   ${serviceName}Generated
} from "${this.getImportPath(contract, 'services', contract.controllerName.toLowerCase() + '.service', '@generated/services')}";

@Service("${contract.controllerName.toLowerCase()}")
export class ${serviceName} extends ${serviceName}Generated {
${contract.services
    .filter((service) => service.createBoilerplate === true)
    .map((service) => {
        return `    override async ${service.functionName}(payload: ${service.request}): Promise<${service.response}> {
        throw new Error("Function ${service.functionName} not implemented");
    }`;
    })
    .join('\n\n')}
}`;

        const outputFilePathFinal = path.join(outputDir, serviceFileName);

        if (!fs.existsSync(outputFilePathFinal)) {
            fs.writeFileSync(
                outputFilePathFinal,
                this.removeExtraSpaces(serviceTemplate),
                'utf8',
            );
        }
    }

    private getControllerDecorators(
        { authRouter, rootOnlyRouter = false, hasCache, contract },
        medatada?: any,
        authRole = 'get',
    ) {
        let decoracotrs = '';

        if (authRouter === true && !rootOnlyRouter)
            decoracotrs += `\n    @Auth("${contract.controllerName.toLowerCase()}:${authRole}")`;
        else if (authRouter === true && rootOnlyRouter)
            decoracotrs += `\n    @Auth({ rootOnly: true })`;

        if (hasCache === true)
            decoracotrs += `\n    @Cache("${medatada.cacheKeyPrefix}getAll", { ttl: ${medatada.cacheTtl}, compress: ${medatada.cacheCompress}, schema: ${contract.controllerName}FastSchema })`;

        return decoracotrs;
    }

    private generateController(contract: IContract): void {
        const telemetry = Config.get<boolean>('app.telemetry');
        const hasCacheModule = Module.hasModule('cache');
        const hasOpenAPIModule = Module.hasModule('openapi');
        const controllerName = `${contract.controllerName}Controller`;
        const serviceName = `${contract.controllerName}Service`;
        const controllerFileNameGenerated = `${contract.controllerName.toLowerCase()}.controller.ts`;
        const controllerFileName = `${contract.controllerName.toLowerCase()}.controller.ts`;

        const hasCache =
            hasCacheModule &&
            contract.cache !== undefined &&
            contract.cache !== null;
        const authRouter = contract.auth === true;
        const rootOnlyRouter = contract.rootOnly === true;
        const cacheKeyPrefix = hasCache
            ? contract.cache.key || `${contract.controllerName.toLowerCase()}:`
            : '';
        const cacheTtl = hasCache ? contract.cache.ttl || 300 : 0;
        const cacheCompress =
            hasCache && contract.cache.compress ? 'true' : 'false';
        const controllerPath = contract.controllerCustomPath
            ? contract.controllerCustomPath
            : contract.controllerName.toLowerCase();

        let importsFromModel = [];

        contract.services.map((service) => {
            //importsFromModel.push(service.request);
            //importsFromModel.push(service.response);
        });

        importsFromModel = [...new Set(importsFromModel)];

        let extraImports = [];
        let openAPIControllerDecorators = [];
        let openAPIControllerMethods = {};

        if (hasCache)
            extraImports.push(
                `import { Cache, CacheService } from "@cmmv/cache";`,
            );

        if (authRouter) extraImports.push(`import { Auth } from "@cmmv/auth";`);

        if (hasOpenAPIModule) {
            extraImports.push(`import { ApiTags } from "@cmmv/openapi";`);

            if (contract.options.tags)
                openAPIControllerDecorators.push(
                    `@ApiTags(${typeof contract.options.tags === 'string' ? '"' + contract.options.tags + '"' : '"' + contract.options.tags.join(',') + '"'})`,
                );
        }

        let controllerTemplateGenerated = `/**
    **********************************************
    This script was generated automatically by CMMV.
    It is recommended not to modify this file manually,
    as it may be overwritten by the application.
    **********************************************
**/
import { Application } from "@cmmv/core";
import { Telemetry } from "@cmmv/core";${extraImports.length > 0 ? '\n' + extraImports.join('\n') : ''}

import {
   Controller, Get, Post, Put, Delete,
   Queries, Param, Body, Req, RouterSchema
} from "@cmmv/http";

import {
   ${contract.controllerName},
   ${contract.controllerName}FastSchema, ${importsFromModel.join(', \n   ')}
} from "${this.getImportPath(contract, 'models', contract.controllerName.toLowerCase() + '.model', '@models')}";

import {
   ${serviceName}
} from "${this.getImportPath(contract, 'services', contract.controllerName.toLowerCase() + '.service', '@services')}";

@Controller('${controllerPath}')${openAPIControllerDecorators.length > 0 ? '\n' + openAPIControllerDecorators.join('\n') : ''}
export class ${controllerName}Generated {
    constructor(private readonly ${serviceName.toLowerCase()}: ${serviceName}) {}

    @Get({
        contract: Application.getContract("${contract.contractName}"),
        schema: RouterSchema.GetAll,
        summary: "Returns ${contract.controllerName} records by filter",
        exposeFilters: true
    })${this.getControllerDecorators({ authRouter, rootOnlyRouter, hasCache, contract }, { cacheKeyPrefix, cacheTtl, cacheCompress }, 'get')}
    async getAll(@Queries() queries: any, @Req() req) {
        return this.${serviceName.toLowerCase()}.getAll(queries, req);
    }

    @Get(':id', {
        contract: Application.getContract("${contract.contractName}"),
        schema: RouterSchema.GetByID,
        summary: "Returns ${contract.controllerName} record by ID"
    })${this.getControllerDecorators({ authRouter, rootOnlyRouter, hasCache: false, contract }, { cacheKeyPrefix, cacheTtl, cacheCompress }, 'get')}
    async getById(@Param('id') id: string, @Req() req) {
        ${
            hasCache
                ? `const cacheData = await CacheService.get(\`${cacheKeyPrefix}\$\{id\}\`);
        return (cacheData) ? cacheData : this.${serviceName.toLowerCase()}.getById(id, req);`
                : `return this.${serviceName.toLowerCase()}.getById(id, req);`
        }
    }

    @Get(':id/raw', {
        contract: Application.getContract("${contract.contractName}"),
        schema: RouterSchema.Raw,
        summary: "Return ${contract.controllerName} record by raw ID"
    })${this.getControllerDecorators({ authRouter, rootOnlyRouter, hasCache: false, contract }, { cacheKeyPrefix, cacheTtl, cacheCompress }, 'get')}
    async getByIdRaw(@Param('id') id: string, @Req() req) {
        const result = await this.${serviceName.toLowerCase()}.getById(id, req);
        return ${contract.controllerName}FastSchema(result.data);
    }

    @Post({
        contract: Application.getContract("${contract.contractName}"),
        schema: RouterSchema.Insert,
        summary: "Insert new ${contract.controllerName}"
    })${this.getControllerDecorators({ authRouter, rootOnlyRouter, hasCache: false, contract }, { cacheKeyPrefix, cacheTtl, cacheCompress }, 'insert')}
    async insert(@Body() item: ${contract.controllerName}, @Req() req) {
        const result = await this.${serviceName.toLowerCase()}.insert(item, req);${hasCache ? `\n        await CacheService.del("${cacheKeyPrefix}getAll");` : ''}
        return result;
    }

    @Put(':id', {
        contract: Application.getContract("${contract.contractName}"),
        schema: RouterSchema.Update,
        summary: "Update ${contract.controllerName} by ID"
    })${this.getControllerDecorators({ authRouter, rootOnlyRouter, hasCache: false, contract }, { cacheKeyPrefix, cacheTtl, cacheCompress }, 'update')}
    async update(@Param('id') id: string, @Body() item: ${contract.controllerName}, @Req() req) {
        const result = await this.${serviceName.toLowerCase()}.update(id, item, req);${hasCache ? `\n        await CacheService.del(\`${cacheKeyPrefix}\${id}\`);\n        await CacheService.del("${cacheKeyPrefix}getAll");` : ''}
        return result;
    }

    @Delete(':id', {
        contract: Application.getContract("${contract.contractName}"),
        schema: RouterSchema.Delete,
        summary: "Delete ${contract.controllerName} by ID"
    })${this.getControllerDecorators({ authRouter, rootOnlyRouter, hasCache: false, contract }, { cacheKeyPrefix, cacheTtl, cacheCompress }, 'delete')}
    async delete(@Param('id') id: string, @Req() req) {
        const result = await this.${serviceName.toLowerCase()}.delete(id, req);${hasCache ? `\n        await CacheService.del(\`${cacheKeyPrefix}\${id}\`);\n        await CacheService.del("${cacheKeyPrefix}getAll");` : ''}
        return result;
    }
${contract.services
    .filter((service) => service.createBoilerplate === true)
    .map((service) => {
        return `    @${this.getMethodFormated(service.method)}("${service.path}")${this.getControllerDecorators({ authRouter: service.auth, rootOnlyRouter: service.rootOnly, hasCache: service.cache, contract }, service.cache, service.method.toLowerCase())}
    async ${service.functionName}(@Body() payload: ${service.request}, @Req() req): Promise<${service.response}> {
        return this.${serviceName.toLowerCase()}.${service.functionName}(payload);
    }`;
    })
    .join('\n\n')}}`;

        if (!telemetry)
            controllerTemplateGenerated = this.removeTelemetry(
                controllerTemplateGenerated,
            );

        const outputDir = this.getRootPath(contract, 'controllers');
        const outputGeneratedDir = this.getGeneratedPath(
            contract,
            'controllers',
        );

        const outputFilePath = path.join(
            outputGeneratedDir,
            controllerFileNameGenerated,
        );

        fs.writeFileSync(
            outputFilePath,
            this.removeExtraSpaces(controllerTemplateGenerated),
            'utf8',
        );

        const controllerTemplate = `import {
   Controller
} from "@cmmv/http";

import {
    ${controllerName}Generated
} from "@generated/controllers${contract.subPath}/${contract.controllerName.toLowerCase()}.controller"; ${this.importServices(importsFromModel, contract)}

@Controller('${controllerPath}')
export class ${controllerName} extends ${controllerName}Generated {}`;

        const outputFilePathFinal = path.join(outputDir, controllerFileName);

        if (!fs.existsSync(outputFilePathFinal)) {
            fs.writeFileSync(
                outputFilePathFinal,
                this.removeExtraSpaces(controllerTemplate),
                'utf8',
            );
        }
    }

    private generateModule(
        controllers: Array<{ name: string; subPath: string }>,
        providers: Array<{ name: string; subPath: string }>,
    ): void {
        Application.appModule.controllers = [
            ...Application.appModule.controllers,
            ...controllers.map(({ name, subPath }) => {
                return {
                    name,
                    path: `@controllers${subPath}/${name.replace('Controller', '').toLowerCase()}.controller`,
                };
            }),
        ];

        Application.appModule.providers = [
            ...Application.appModule.providers,
            ...providers.map(({ name, subPath }) => {
                return {
                    name,
                    path: `@services${subPath}/${name.replace('Service', '').toLowerCase()}.service`,
                };
            }),
        ];
    }

    private getMethodFormated(raw: string): string {
        switch (raw.toLocaleLowerCase()) {
            case 'get':
                return 'Get';
            case 'post':
                return 'Post';
            case 'put':
                return 'Put';
            case 'patch':
                return 'Patch';
            case 'delete':
                return 'Delete';
        }
    }

    private importServices(importsFromModel, contract: IContract): string {
        return importsFromModel.length
            ? `\n\nimport {
   ${importsFromModel.join(', \n   ')}
} from "${this.getImportPath(contract, 'models', contract.controllerName.toLowerCase() + '.model', '@models')}";`
            : '';
    }
}
