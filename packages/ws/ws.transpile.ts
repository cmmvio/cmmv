import * as fs from 'node:fs';
import * as path from 'node:path';

import {
    AbstractTranspile,
    Application,
    Config,
    ITranspile,
    Scope,
    IContract,
} from '@cmmv/core';

export class WSTranspile extends AbstractTranspile implements ITranspile {
    run(): void {
        const contracts = Scope.getArray<any>('__contracts');

        contracts?.forEach((contract: any) => {
            if (contract.generateController) this.generateGateway(contract);
        });
    }

    private generateGateway(contract: IContract) {
        const gatewayName = `${contract.controllerName}Gateway`;
        const serviceName = `${contract.controllerName}Service`;
        const gatewayFileName = `${contract.controllerName.toLowerCase()}.gateway.ts`;

        const hasCache =
            contract.cache !== undefined && contract.cache !== null;
        const cacheKeyPrefix = hasCache
            ? contract.cache?.key || `${contract.controllerName.toLowerCase()}:`
            : '';
        const cacheTtl = hasCache ? contract.cache.ttl || 300 : 0;
        const cacheCompress =
            hasCache && contract.cache.compress ? 'true' : 'false';

        const protoPath = path.basename(contract.protoPath);

        const serviceTemplate = `/**                                                                               
    **********************************************
    This script was generated automatically by CMMV.
    It is recommended not to modify this file manually, 
    as it may be overwritten by the application.
    **********************************************
**/
    
import { Rpc, Message, Data, Socket, RpcUtils } from "@cmmv/ws";
import { plainToClass } from 'class-transformer';
import { ${contract.controllerName}Entity } from "${this.getImportPath(contract, 'entities', contract.controllerName.toLowerCase() + '.entity')}";${hasCache ? `\nimport { Cache, CacheService } from "@cmmv/cache";` : ''}

import { 
    Add${contract.controllerName}Request, 
    Update${contract.controllerName}Request,   
    Delete${contract.controllerName}Request 
} from "${this.getImportPath(contract, 'protos', contract.controllerName.toLowerCase())}.d";

import { ${serviceName} } from "${this.getImportPath(contract, 'services', contract.controllerName.toLowerCase() + '.service')}";

@Rpc("${contract.controllerName.toLowerCase()}")
export class ${gatewayName} {
    constructor(private readonly ${serviceName.toLowerCase()}: ${serviceName}) {}

    @Message("GetAll${contract.controllerName}Request")${hasCache ? `@Cache("${cacheKeyPrefix}getAll", { ttl: ${cacheTtl}, compress: ${cacheCompress} })` : ''}
    async getAll(@Socket() socket){
        try{
            const items = await this.${serviceName.toLowerCase()}.getAll();
            const response = await RpcUtils.pack(
                "${contract.controllerName.toLowerCase()}", 
                "GetAll${contract.controllerName}Response", 
                items
            );

            if(response)
                socket.send(response);
        }
        catch(e){}
    }

    @Message("Add${contract.controllerName}Request")
    async add(@Data() data: Add${contract.controllerName}Request, @Socket() socket){
        try{
            const entity = plainToClass(${contract.controllerName}Entity, data.item);
            const result = await this.${serviceName.toLowerCase()}.add(entity);
            const response = await RpcUtils.pack(
                "${contract.controllerName.toLowerCase()}", 
                "Add${contract.controllerName}Response", 
                { item: result, id: ${Config.get('repository.type') === 'mongodb' ? `result._id` : `result.id`} }
            );

            ${hasCache ? `CacheService.set(\`${cacheKeyPrefix}\${${Config.get('repository.type') === 'mongodb' ? `result._id` : `result.id`}}\`, JSON.stringify(result), ${cacheTtl});` : ''}
            ${hasCache ? `CacheService.del("${cacheKeyPrefix}getAll");` : ''}

            if(response)
                socket.send(response);
        }
        catch(e){}
    }

    @Message("Update${contract.controllerName}Request")
    async update(@Data() data: Update${contract.controllerName}Request, @Socket() socket){
        try{
            const entity = plainToClass(${contract.controllerName}Entity, data.item);
            const result = await this.${serviceName.toLowerCase()}.update(data.id, entity);
            const response = await RpcUtils.pack(
                "${contract.controllerName.toLowerCase()}", 
                "Update${contract.controllerName}Response", 
                { 
                    success: result.success, 
                    affected: result.affected 
                }
            );
            ${hasCache ? `CacheService.set(\`${cacheKeyPrefix}\${${Config.get('repository.type') === 'mongodb' ? `result._id` : `result.id`}}\`, JSON.stringify(result), ${cacheTtl});` : ''}
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
            ${hasCache ? `CacheService.del(\`${cacheKeyPrefix}\${data.id}\`);` : ''}
            ${hasCache ? `CacheService.del("${cacheKeyPrefix}getAll");` : ''}
            
            if(response)
                socket.send(response);
        }
        catch(e){}
    }
}`;

        Application.appModule.providers.push({
            name: gatewayName,
            path: `./gateways${contract.subPath}/${contract.controllerName.toLowerCase()}.gateway`,
        });

        const outputDir = this.getRootPath(contract, 'gateways');
        const outputFilePath = path.join(outputDir, gatewayFileName);
        fs.writeFileSync(
            outputFilePath,
            this.removeExtraSpaces(serviceTemplate),
            'utf8',
        );
    }
}
