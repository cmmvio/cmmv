import * as fs from 'fs';
import * as path from 'path';

import {
    AbstractTranspile,
    Config,
    ITranspile,
    Logger,
    Scope,
    IContract,
    CONTROLLER_NAME_METADATA,
} from '@cmmv/core';

export class RepositoryTranspile
    extends AbstractTranspile
    implements ITranspile
{
    run(): void {
        const contracts = Scope.getArray<any>('__contracts');

        contracts?.forEach((contract: IContract) => {
            if (contract.generateEntities) this.generateEntity(contract);
            if (contract.generateController) this.generateService(contract);
        });
    }

    private generateEntity(contract: IContract): void {
        const entityName = contract.controllerName;
        const modelName = `${entityName}.Model`;
        const entityFileName = `${entityName.toLowerCase()}.entity.ts`;
        const schemaName = contract.options?.databaseSchemaName
            ? contract.options?.databaseSchemaName
            : entityName.toLowerCase();

        const extraFields = this.generateExtraFields(contract);
        const extraEntitiesImport = this.generateExtraImport(contract);

        const entityTemplate = `/**                                                                               
    **********************************************
    This script was generated automatically by CMMV.
    It is recommended not to modify this file manually, 
    as it may be overwritten by the application.
    **********************************************
**/
        
import { 
    ${this.generateTypeORMImports(contract)}
} from "typeorm";

import { I${entityName} } from "${this.getImportPath(contract, 'models', modelName.toLowerCase())}";${this.generateEntitiesImport(contract, extraEntitiesImport)}

@Entity("${schemaName}")
${this.generateIndexes(entityName, contract.fields, contract)}
export class ${entityName}Entity implements I${entityName} {
    ${Config.get('repository.type') === 'mongodb' ? '@ObjectIdColumn()' : "@PrimaryGeneratedColumn('uuid')"}
    ${Config.get('repository.type') === 'mongodb' ? '_id: ObjectId' : 'id: string'};

${contract.fields.map((field: any) => this.generateField(field)).join('\n\n')}${extraFields}
}`;

        const outputDir = this.getRootPath(contract, 'entities');
        const outputFilePath = path.join(outputDir, entityFileName);
        fs.writeFileSync(outputFilePath, entityTemplate, 'utf8');
    }

    private generateService(contract: IContract): void {
        const telemetry = Config.get<boolean>('app.telemetry');
        const serviceName = `${contract.controllerName}Service`;
        const modelName = `${contract.controllerName}`;
        const modelInterfaceName = `I${modelName}`;
        const entityName = `${contract.controllerName}Entity`;
        const serviceFileNameGenerated = `${contract.controllerName.toLowerCase()}.service.generated.ts`;

        let importsFromModel = [];

        contract.services
            .filter(service => service.createBoilerplate === true)
            .map(service => {
                importsFromModel.push(service.request);
                importsFromModel.push(service.response);
            });

        importsFromModel = [...new Set(importsFromModel)];

        let serviceTemplateGenerated = `/**                                                                               
    **********************************************
    This script was generated automatically by CMMV.
    It is recommended not to modify this file manually, 
    as it may be overwritten by the application.
    **********************************************
**/
${Config.get('repository.type') === 'mongodb' ? "\nimport { ObjectId } from 'mongodb';" : ''}
import { validate } from 'class-validator';
import { plainToInstance } from 'class-transformer';

import { 
    Telemetry, AbstractService, 
    Logger 
} from "@cmmv/core";

import { Repository } from '@cmmv/repository';

import { 
   ${modelName}, 
   ${modelInterfaceName},${importsFromModel.join(', \n   ')}
} from "${this.getImportPath(contract, 'models', modelName.toLowerCase())}.model";

import { ${entityName} } from "${this.getImportPath(contract, 'entities', modelName.toLowerCase())}.entity";

export class ${serviceName}Generated extends AbstractService {
    protected logger: Logger = new Logger("${serviceName}Generated");

    async getAll(queries?: any, req?: any): Promise<${modelName}[] | null> {
        try{
            Telemetry.start('${serviceName}::GetAll', req?.requestId);
            let result = await Repository.findAll(${entityName}, queries);
            ${Config.get('repository.type') === 'mongodb' ? 'result = this.fixIds(result)' : ''}
            Telemetry.end('${serviceName}::GetAll', req?.requestId);

            return result && result.length > 0 ? result.map((item) => {
                return plainToInstance(${modelName}, item, {
                    exposeUnsetFields: false,
                    enableImplicitConversion: true,
                    excludeExtraneousValues: true
                });
            }) : null;
        }
        catch(e){
            this.logger.error(e);
            return null;
        }
    }

    async getById(id: string, req?: any): Promise<${modelName} | null> {
        try{
            Telemetry.start('${serviceName}::GetById', req?.requestId);
            let item = await Repository.findBy(${entityName}, { ${Config.get('repository.type') === 'mongodb' ? '_id: new ObjectId(id)' : 'id'} });
            ${Config.get('repository.type') === 'mongodb' ? 'item = this.fixIds(item)' : ''}
            Telemetry.end('${serviceName}::GetById', req?.requestId);

            if (!item) 
                throw new Error('Item not found');
            
            return ${modelName}.fromEntity(item);
        }
        catch(e){
            return null;
        }
    }

    async add(item: ${modelInterfaceName}, req?: any): Promise<${modelName}> {
        return new Promise(async (resolve, reject) => {
            try{
                Telemetry.start('${serviceName}::Add', req?.requestId);
                        
                let newItem: any = plainToInstance(${modelName}, item, { 
                    exposeUnsetFields: false,
                    enableImplicitConversion: true,
                    excludeExtraneousValues: true
                });                

                const errors = await validate(newItem, { 
                    forbidUnknownValues: false,
                    stopAtFirstError: true, 
                    skipMissingProperties: true
                });

                const userId: string = req.user.id;

                if(typeof userId === "string")
                    newItem.userCreator = ${Config.get('repository.type') === 'mongodb' ? 'new ObjectId(userId)' : 'userId'};

                if (errors.length > 0) {
                    Telemetry.end('TaskService::Add', req?.requestId);
                    reject({ success: false, message: Object.values(errors[0].constraints).join(', ') });
                } 
                else {      
                    newItem = this.removeUndefined(newItem);
                    delete newItem._id;

                    const result: any = await Repository.insert<${entityName}>(${entityName}, newItem);
                    
                    if(result.success){
                        ${Config.get('repository.type') === 'mongodb' ? 'let dataFixed = this.fixIds(result.data)' : ''}
                        Telemetry.end('TaskService::Add', req?.requestId);
                        resolve(${modelName}.fromEntity(dataFixed)); 
                    }    
                    else {
                        Telemetry.end('TaskService::Add', req?.requestId);
                        reject(result);
                    }           
                }
            }
            catch(e){ 
                Telemetry.end('TaskService::Add', req?.requestId);
                reject({ success: false, message: e.message });
            }
        });
    }

    async update(id: string, item: ${modelInterfaceName}, req?: any): Promise<{ success: boolean, affected: number }> {
        return new Promise(async (resolve, reject) => {
            try{
                Telemetry.start('${serviceName}::Update', req?.requestId);

                let updateItem: any = plainToInstance(${modelName}, item, { 
                    exposeUnsetFields: false,
                    enableImplicitConversion: true,
                    excludeExtraneousValues: true
                });

                const errors = await validate(updateItem, { 
                    forbidUnknownValues: false,
                    skipMissingProperties: true,
                    stopAtFirstError: true
                });
           
                if (errors.length > 0) {
                    Telemetry.end('TaskService::Add', req?.requestId);
                    reject(errors);
                } 
                else {  
                    updateItem = this.removeUndefined(updateItem);
                    delete updateItem._id;
                    const result = await Repository.update(${entityName}, ${Config.get('repository.type') === 'mongodb' ? 'new ObjectId(id)' : 'id'}, updateItem);                    
                    Telemetry.end('TaskService::Add', req?.requestId);
                    resolve({ success: result > 0, affected: result });       
                }                
            }
            catch(e){
                Telemetry.end('${serviceName}::Update', req?.requestId);
                reject({ success: false, affected: 0 });
            }
        });
    }

    async delete(id: string, req?: any): Promise<{ success: boolean, affected: number }> {
        try{
            Telemetry.start('${serviceName}::Delete', req?.requestId);
            const result = await Repository.delete(${entityName}, ${Config.get('repository.type') === 'mongodb' ? 'new ObjectId(id)' : 'id'});
            Telemetry.end('${serviceName}::Delete', req?.requestId);
            return { success: result > 0, affected: result };
        }
        catch(e){
            Telemetry.end('${serviceName}::Delete', req?.requestId);
            return { success: false, affected: 0 };
        }
    }

${contract.services
    .filter(service => service.createBoilerplate === true)
    .map(service => {
        return `    async ${service.functionName}(payload: ${service.request}): Promise<${service.response}> {
        throw new Error("Function ${service.functionName} not implemented");
    }`;
    })
    .join('\n\n')}
}`;

        if (!telemetry)
            serviceTemplateGenerated = this.removeTelemetry(
                serviceTemplateGenerated,
            );

        const outputDir = this.getRootPath(contract, 'services');
        const outputFilePath = path.join(outputDir, serviceFileNameGenerated);
        fs.writeFileSync(
            outputFilePath,
            this.removeExtraSpaces(serviceTemplateGenerated),
            'utf8',
        );
    }

    private generateIndexes(
        entityName: string,
        fields: any[],
        contract: IContract,
    ): string {
        let indexDecorators: any = fields
            .filter(field => field.index || field.unique)
            .map(field => {
                const indexName = `idx_${entityName.toLowerCase()}_${field.propertyKey}`;
                const columns = `["${field.propertyKey}"]`;
                const uniqueOption = field.unique ? `{ unique: true }` : '';
                return `@Index("${indexName}", ${columns}${uniqueOption ? `, ${uniqueOption}` : ''})`;
            });

        if (
            contract.indexs &&
            Array.isArray(contract.indexs) &&
            contract.indexs.length > 0
        ) {
            indexDecorators = [
                ...indexDecorators,
                contract.indexs.map(index => {
                    return `@Index("${index.name}", ${JSON.stringify(index.fields)}${index.options ? `, ${JSON.stringify(index.options)}` : ''})`;
                }),
            ];
        }

        return indexDecorators.join('\n');
    }

    private generateField(field: any): string {
        let tsType = this.mapToTsType(field.protoType);
        const columnOptions = this.generateColumnOptions(field);
        let decorators = [`@Column({ ${columnOptions} })`];
        let optional = field.nullable ? '?' : '';

        if (field.link) {
            decorators = [];

            field.link.map(link => {
                const contractInstance = new link.contract();
                const controllerName = Reflect.getMetadata(
                    CONTROLLER_NAME_METADATA,
                    contractInstance.constructor,
                );
                const entityName = controllerName;

                decorators.push(
                    `@ManyToOne(() => ${entityName}Entity, (${link.entityName}) => ${link.entityName}.${link.field}, { nullable: ${link?.entityNullable === true || false ? 'true' : 'false'} })`,
                );
            });

            tsType =
                `${field.entityType}${field.protoRepeated ? '[]' : ''}` ||
                'object';
        }

        return `    ${decorators.join(' ')}\n    ${field.propertyKey}${optional}: ${tsType};`;
    }

    private generateColumnOptions(field: any): string {
        const options = [];
        options.push(`type: '${this.mapToTypeORMType(field.protoType)}'`);

        if (field.defaultValue !== undefined)
            options.push(
                `default: ${typeof field.defaultValue === 'object' ? JSON.stringify(field.defaultValue) : field.defaultValue}`,
            );
        if (field.nullable && field.nullable === true)
            options.push(`nullable: true`);

        return options.join(', ');
    }

    private mapToTsType(protoType: string): string {
        const typeMapping: { [key: string]: string } = {
            string: 'string',
            bool: 'boolean',
            int32: 'number',
            float: 'number',
            double: 'number',
            any: 'any',
        };

        return typeMapping[protoType] || 'string';
    }

    private mapToTypeORMType(type: string): string {
        const typeMapping: { [key: string]: string } = {
            string: 'varchar',
            boolean: 'boolean',
            bool: 'boolean',
            int: 'int',
            int32: 'int',
            int64: 'bigint',
            float: 'float',
            double: 'double',
            bytes: 'bytea',
            date: 'date',
            timestamp: 'timestamp',
            text: 'text',
            json: 'json',
            jsonb: 'jsonb',
            uuid: 'uuid',
            time: 'time',
            simpleArray: 'simple-array',
            simpleJson: 'simple-json',
            bigint: 'bigint',
            uint32: 'int',
            uint64: 'bigint',
            sint32: 'int',
            sint64: 'bigint',
            fixed32: 'int',
            fixed64: 'bigint',
            sfixed32: 'int',
            sfixed64: 'bigint',
            any: 'simple-json',
        };

        return typeMapping[type] || 'varchar';
    }

    private generateTypeORMImports(contract: IContract) {
        let extraImport = [];

        if (contract.options?.databaseTimestamps)
            extraImport.push('CreateDateColumn', 'UpdateDateColumn');

        if (contract.options?.databaseUserAction)
            extraImport.push('ManyToOne', 'BeforeInsert');

        contract.fields.map(field => {
            if (field.link && field.link.length > 0)
                extraImport.push('ManyToOne');
        });

        extraImport = [...new Set(extraImport)];

        return `Entity, ${Config.get('repository.type') === 'mongodb' ? 'ObjectIdColumn' : 'PrimaryGeneratedColumn'}, 
    Column, Index, ${Config.get('repository.type') === 'mongodb' ? 'ObjectId,' : ''} ${extraImport.length > 0 ? `\n\t${extraImport.join(', ')}` : ''}`;
    }

    private generateExtraFields(contract: IContract) {
        let extraFields = '';

        if (contract.options?.databaseTimestamps) {
            extraFields += `
    @CreateDateColumn({ type: 'timestamp', default: () => 'CURRENT_TIMESTAMP' })
    createdAt: Date;

    @UpdateDateColumn({ type: 'timestamp', default: () => 'CURRENT_TIMESTAMP', onUpdate: 'CURRENT_TIMESTAMP' })
    updatedAt: Date;`;
        }

        if (contract.options?.databaseUserAction) {
            if (extraFields) extraFields += '\n';

            extraFields += `
    @ManyToOne(() => UserEntity, { nullable: false })
    ${Config.get('repository.type') === 'mongodb' ? '@ObjectIdColumn({ nullable: false })' : "@Column({ type: 'varchar', nullable: false })"}
    userCreator: ${Config.get('repository.type') === 'mongodb' ? 'ObjectId' : 'string'};

    @ManyToOne(() => UserEntity, { nullable: true })
    ${Config.get('repository.type') === 'mongodb' ? '@ObjectIdColumn({ nullable: true })' : "@Column({ type: 'varchar', nullable: true })"}
    userLastUpdate: ${Config.get('repository.type') === 'mongodb' ? 'ObjectId' : 'string'};
    
    @BeforeInsert()
    checkUserCreator() {
        if (!this.userCreator) 
            throw new Error("userCreator is required");
    }`;
        }

        return extraFields ? `\n${extraFields}` : '';
    }

    private generateExtraImport(contract: IContract) {
        let imports: Array<{ name: string; path: string }> = [];
        const importEntitiesList = new Array<{
            entityName: string;
            path: string;
        }>();

        contract.fields?.forEach((field: any) => {
            if (field.link && field.link.length > 0) {
                field.link.map(link => {
                    const contractInstance = new link.contract();
                    const controllerName = Reflect.getMetadata(
                        CONTROLLER_NAME_METADATA,
                        contractInstance.constructor,
                    );
                    const entityName = controllerName;
                    const entityFileName = `${entityName.toLowerCase()}.entity`;

                    importEntitiesList.push({
                        entityName: `${entityName}Entity`,
                        path: this.getImportPathRelative(
                            contractInstance,
                            contract,
                            'entities',
                            entityFileName,
                        ),
                    });
                });
            }
        });

        if (contract.options?.databaseUserAction) {
            imports.push({
                name: 'UserEntity',
                path: this.getImportPathWithoutSubPath(
                    contract,
                    'entities',
                    'auth/user.entity',
                ),
            });
        }

        if (importEntitiesList.length > 0) {
            importEntitiesList.map(importEntity => {
                imports.push({
                    name: importEntity.entityName,
                    path: importEntity.path,
                });
            });
        }

        return imports;
    }

    private generateEntitiesImport(
        contract: IContract,
        extraImports: Array<{ name: string; path: string }>,
    ) {
        return extraImports.length > 0
            ? extraImports
                  .map(value => {
                      return `\nimport { ${value.name} } from "${value.path}";`;
                  })
                  .join('')
            : '';
    }
}
