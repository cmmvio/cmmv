import * as fs from 'node:fs';
import * as path from 'node:path';

import {
    AbstractTranspile,
    Application,
    Config,
    ITranspile,
    Scope,
    IContract,
    Module,
} from '@cmmv/core';

export class WSTranspile extends AbstractTranspile implements ITranspile {
    run(): void {
        const contracts = Scope.getArray<any>('__contracts');
        const generateGateways = Config.get<boolean>(
            'rpc.generateGateways',
            true,
        );

        contracts?.forEach((contract: any) => {
            if (contract.generateController && generateGateways) {
                this.generateGateway(contract);
            }
        });
    }

    private generateGateway(contract: IContract) {
        const generateBoilerplates = contract.generateBoilerplates === true;
        const hasCacheModule = Module.hasModule('cache');
        const gatewayName = `${contract.controllerName}Gateway`;
        const serviceName = `${contract.controllerName}Service`;
        const gatewayFileNameGenerated = `${contract.controllerName.toLowerCase()}.gateway.ts`;
        const gatewayFileName = `${contract.controllerName.toLowerCase()}.gateway.ts`;

        const hasCache =
            hasCacheModule &&
            contract.cache !== undefined &&
            contract.cache !== null;
        const cacheKeyPrefix = hasCache
            ? contract.cache?.key || `${contract.controllerName.toLowerCase()}:`
            : '';
        const cacheTtl = hasCache ? contract.cache.ttl || 300 : 0;
        const cacheCompress =
            hasCache && contract.cache.compress ? 'true' : 'false';

        const protoPath = path.basename(contract.protoPath);

        const gatewayTemplateGenerated = `/**
    **********************************************
    This script was generated automatically by CMMV.
    It is recommended not to modify this file manually,
    as it may be overwritten by the application.
    **********************************************
**/

import { Rpc, Message, Data, Socket, RpcUtils } from "@cmmv/ws";${hasCache ? `\nimport { Cache, CacheService } from "@cmmv/cache";` : ''}

import {
    Add${contract.controllerName}Request,
    Update${contract.controllerName}Request,
    Delete${contract.controllerName}Request
} from "${this.getImportPath(contract, 'protos', contract.controllerName.toLowerCase())}.d";

import {
    ${contract.controllerName}
} from "${this.getImportPath(contract, 'models', contract.controllerName.toLowerCase() + '.model', '@models')}";

import {
    ${serviceName}
} from "${this.getImportPath(contract, 'services', contract.controllerName.toLowerCase() + '.service', '@services')}";

@Rpc("${contract.controllerName.toLowerCase()}")
export class ${gatewayName}Generated {
    constructor(private readonly ${serviceName.toLowerCase()}: ${serviceName}) {}

    @Message("GetAll${contract.controllerName}Request")
    async getAll(@Socket() socket){
        try{
            const items = await this.${serviceName.toLowerCase()}.getAll();

            const response = await RpcUtils.pack(
                "${contract.controllerName.toLowerCase()}",
                "GetAll${contract.controllerName}Response",
                items.data
            );

            if(response)
                socket.send(response);
        }
        catch(e){}
    }

    @Message("Add${contract.controllerName}Request")
    async insert(@Data() data: Add${contract.controllerName}Request, @Socket() socket){
        try{
            const ${contract.controllerName.toLocaleLowerCase()} = ${contract.controllerName}.fromPartial(data.item);
            const result = await this.${serviceName.toLowerCase()}.insert(${contract.controllerName.toLocaleLowerCase()});
            const response = await RpcUtils.pack(
                "${contract.controllerName.toLowerCase()}",
                "Add${contract.controllerName}Response",
                { item: result, id: ${Config.get('repository.type') === 'mongodb' ? `result._id` : `result.id`} }
            );

            ${hasCache ? `\n            CacheService.set(\`${cacheKeyPrefix}\${${Config.get('repository.type') === 'mongodb' ? `result._id` : `result.id`}}\`, JSON.stringify(result), ${cacheTtl});` : ''}
            ${hasCache ? `CacheService.del("${cacheKeyPrefix}getAll");` : ''}

            if(response)
                socket.send(response);
        }
        catch(e){}
    }

    @Message("Update${contract.controllerName}Request")
    async update(@Data() data: Update${contract.controllerName}Request, @Socket() socket){
        try{
            const result = await this.${serviceName.toLowerCase()}.update(data.id, data.item);
            const response = await RpcUtils.pack(
                "${contract.controllerName.toLowerCase()}",
                "Update${contract.controllerName}Response",
                {
                    success: result.success,
                    affected: result.affected
                }
            );
            ${hasCache ? `\n            CacheService.set(\`${cacheKeyPrefix}\${data.id}\`, JSON.stringify(result), ${cacheTtl});` : ''}
            ${hasCache ? `CacheService.del("${cacheKeyPrefix}getAll");` : ''}

            if(response)
                socket.send(response);
        }
        catch(e){}
    }

    @Message("Delete${contract.controllerName}Request")
    async delete(@Data() data: Delete${contract.controllerName}Request, @Socket() socket){
        try{
            const result = await this.${serviceName.toLowerCase()}.delete(data.id);
            const response = await RpcUtils.pack(
                "${contract.controllerName.toLowerCase()}",
                "Delete${contract.controllerName}Response",
                {
                    success: result.success,
                    affected: result.affected
                }
            );
            ${hasCache ? `\n            CacheService.del(\`${cacheKeyPrefix}\${data.id}\`);` : ''}
            ${hasCache ? `CacheService.del("${cacheKeyPrefix}getAll");` : ''}

            if(response)
                socket.send(response);
        }
        catch(e){}
    }
}`;

        Application.appModule.providers.push({
            name: gatewayName,
            path: `@gateways${contract.subPath}/${contract.controllerName.toLowerCase()}.gateway`,
        });

        const outputDirGenerated = this.getGeneratedPath(contract, 'gateways');
        const outputFilePath = path.join(
            outputDirGenerated,
            gatewayFileNameGenerated,
        );
        fs.writeFileSync(
            outputFilePath,
            this.removeExtraSpaces(gatewayTemplateGenerated),
            'utf8',
        );

        //Service
        if (generateBoilerplates) {
            const gatewayTemplate = `import { Rpc } from "@cmmv/ws";

import {
    ${gatewayName}Generated
} from "${this.getImportPath(contract, 'gateway', contract.controllerName.toLowerCase() + '.gateway', '@generated/gateways')}";

@Rpc("${contract.controllerName.toLowerCase()}")
export class ${gatewayName} extends ${gatewayName}Generated {
${contract.services
    .filter((service) => service.createBoilerplate === true)
    .map((service) => {
        return `    override async ${service.functionName}(payload: ${service.request}): Promise<${service.response}> {
        throw new Error("Function ${service.functionName} not implemented");
    }`;
    })
    .join('\n\n')}
}`;

            const outputDir = this.getRootPath(contract, 'gateways');
            const outputFileGenerated = path.join(
                outputDirGenerated,
                gatewayFileName,
            );
            const outputFilePathFinal = path.join(outputDir, gatewayFileName);

            if (!fs.existsSync(outputFilePathFinal)) {
                fs.writeFileSync(
                    outputFilePathFinal,
                    this.removeExtraSpaces(gatewayTemplate),
                    'utf8',
                );
            }
        } else {
            const outputDir = this.getRootPath(contract, 'gateways', false);
            const outputFilePathFinal = path.join(outputDir, gatewayFileName);

            if (fs.existsSync(outputFilePathFinal))
                fs.unlinkSync(outputFilePathFinal);

            fs.appendFileSync(
                outputFilePath,
                this.removeExtraSpaces(`

@Rpc("${contract.controllerName.toLowerCase()}")
export class ${gatewayName} extends ${gatewayName}Generated {
${contract.services
    .filter((service) => service.createBoilerplate === true)
    .map((service) => {
        return `    override async ${service.functionName}(payload: ${service.request}): Promise<${service.response}> {
        throw new Error("Function ${service.functionName} not implemented");
    }`;
    })
    .join('\n\n')}
}`),
                'utf-8',
            );
        }
    }
}
