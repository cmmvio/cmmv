import * as fs from 'fs';
import * as path from 'path';

import {
    AbstractTranspile,
    Config,
    ITranspile,
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
        const isModuleContract = contract.options?.moduleContract === true;
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
} from "@cmmv/repository";

import {
    I${entityName}
} from "${this.getImportPath(contract, 'models', modelName.toLowerCase(), '@models')}";${this.generateEntitiesImport(contract, extraEntitiesImport)}

@Entity("${schemaName}")
${this.generateIndexes(entityName, contract.fields, contract)}
export class ${entityName}Entity implements I${entityName} {
    ${Config.get('repository.type') === 'mongodb' ? '@ObjectIdColumn()' : '@PrimaryGeneratedColumn("uuid")'}
    ${Config.get('repository.type') === 'mongodb' ? '_id: ObjectId' : 'id: string'};

${contract.fields.map((field: any) => this.generateField(field)).join('\n\n')}${extraFields}
}`;

        const outputDir = isModuleContract
            ? this.getGeneratedPath(contract, 'entities')
            : this.getRootPath(contract, 'entities');
        const outputFilePath = path.join(outputDir, entityFileName);
        fs.writeFileSync(outputFilePath, entityTemplate, 'utf8');
    }

    private generateService(contract: IContract): void {
        const telemetry = Config.get<boolean>('app.telemetry');
        const serviceName = `${contract.controllerName}Service`;
        const modelName = `${contract.controllerName}`;
        const modelInterfaceName = `I${modelName}`;
        const entityName = `${contract.controllerName}Entity`;
        const serviceFileNameGenerated = `${contract.controllerName.toLowerCase()}.service.ts`;

        let importsFromModel = [];

        contract.services
            .filter((service) => service.createBoilerplate === true)
            .map((service) => {
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

import {
    AbstractRepositoryService,
    RepositorySchema
} from "@cmmv/repository";

import {
    ${modelName}${importsFromModel.join(', \n   ')}
} from "${this.getImportPath(contract, 'models', modelName.toLowerCase(), '@models')}.model";

import {
    ${entityName}
} from "${this.getImportPath(contract, 'entities', modelName.toLowerCase(), '@entities')}.entity";

export class ${serviceName}Generated extends AbstractRepositoryService {
    protected schema = new RepositorySchema(${entityName}, ${modelName});

    async getAll(queries?: any, req?: any) {
        return await this.schema.getAll(queries, req);
    }

    async getById(id: string, req?: any) {
        return await this.schema.getById(id);
    }

    async insert(payload: Partial<${modelName}>, req?: any) {
        const newItem: any = this.fromPartial(${modelName}, payload, req);
        const validatedData = await this.validate<${modelName}>(newItem);
        return await this.schema.insert(validatedData);
    }

    async update(id: string, payload: Partial<${modelName}>, req?: any) {
        const updateItem: any = this.fromPartial(${modelName}, payload, req);
        const validatedData = await this.validate<${modelName}>(updateItem, true);
        return await this.schema.update(id, validatedData);
    }

    async delete(id: string, req?: any) {
        return await this.schema.delete(id);
    }
${contract.services
    .filter((service) => service.createBoilerplate === true)
    .map((service) => {
        return `\n    async ${service.functionName}(payload: ${service.request}): Promise<${service.response}> {
        throw new Error("Function ${service.functionName} not implemented");
    }`;
    })
    .join('\n\n')}}`;

        if (!telemetry)
            serviceTemplateGenerated = this.removeTelemetry(
                serviceTemplateGenerated,
            );

        const outputDir = this.getGeneratedPath(contract, 'services');
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
            .filter((field) => field.index || field.unique)
            .map((field) => {
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
                contract.indexs.map((index) => {
                    return `@Index("${index.name}", ${JSON.stringify(index.fields)}${index.options ? `, ${JSON.stringify(index.options)}` : ''})`;
                }),
            ];
        }

        return indexDecorators.join('\n');
    }

    private generateField(field: any): string {
        let tsType = this.mapToTsType(field.protoType, field);
        const columnOptions = this.generateColumnOptions(field);
        let decorators = [
            `@Column({
        ${columnOptions}
    })`,
        ];
        let optional = field.nullable ? '?' : '';

        if (field.link) {
            decorators = [];

            field.link.map((link) => {
                const contractInstance = new link.contract();
                const controllerName = Reflect.getMetadata(
                    CONTROLLER_NAME_METADATA,
                    contractInstance.constructor,
                );
                const entityName = controllerName;
                const isMongoDB = Config.get('repository.type') === 'mongodb';
                const linkType = isMongoDB ? 'string' : 'varchar';
                const linkField =
                    link.field === '_id' && !isMongoDB ? 'id' : link.field;

                decorators.push(
                    `@ManyToOne(() => ${entityName}Entity, (${link.entityName}) => ${link.entityName}.${linkField}, { nullable: ${link?.entityNullable === true || false ? 'true' : 'false'} })
    @Column({
        type: "${field.protoRepeated ? 'simple-array' : linkType}",
        nullable: true
    })`,
                );
            });

            tsType =
                `${field.entityType}${field.protoRepeated ? '[]' : ''} | string${field.protoRepeated ? '[]' : ''}${Config.get('repository.type') === 'mongodb' ? ' | ObjectId' + (field.protoRepeated ? '[]' : '') : ''} | null` ||
                'object';
        }

        return `    ${decorators.join(' ')}\n    ${field.propertyKey}${optional}: ${tsType};`;
    }

    private generateColumnOptions(field: any): string {
        const isMongoDB = Config.get('repository.type') === 'mongodb';
        const typeField = this.mapToTypeORMType(field.protoType, field);
        const options = [];
        options.push(`type: "${typeField}"`);

        if (
            field.defaultValue !== undefined &&
            (isMongoDB || typeField !== 'simple-array')
        ) {
            options.push(
                `        default: ${typeof field.defaultValue === 'object' ? JSON.stringify(field.defaultValue) : field.defaultValue}`,
            );
        }

        options.push(
            `        nullable: ${field.nullable === true ? 'true' : 'false'}`,
        );

        return options.join(', \n');
    }

    private mapToTsType(protoType: string, field: any): string {
        const typeMapping: { [key: string]: string } = {
            string: 'string',
            bool: 'boolean',
            int32: 'number',
            int: 'number',
            float: 'number',
            double: 'number',
            any: 'any',
        };

        return (
            (typeMapping[protoType] || 'string') +
            (field.protoRepeated ? '[]' : '')
        );
    }

    private mapToTypeORMType(type: string, field: any): string {
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

        return field.protoRepeated
            ? 'simple-array'
            : typeMapping[type] || 'varchar';
    }

    private generateTypeORMImports(contract: IContract) {
        let extraImport = [];

        if (contract.options?.databaseTimestamps)
            extraImport.push('CreateDateColumn', 'UpdateDateColumn');

        if (contract.options?.databaseUserAction) extraImport.push('ManyToOne');

        contract.fields.map((field) => {
            if (field.link && field.link.length > 0)
                extraImport.push('ManyToOne');
        });

        extraImport = [...new Set(extraImport)];

        return `Entity, ${Config.get('repository.type') === 'mongodb' ? 'ObjectIdColumn' : 'PrimaryGeneratedColumn'},
    Column, Index, ${Config.get('repository.type') === 'mongodb' ? 'ObjectId,' : ''} ${extraImport.length > 0 ? `\n\t${extraImport.join(', \n    ')}` : ''}`;
    }

    private generateExtraFields(contract: IContract) {
        let extraFields = '';
        const isSQLite = Config.get('repository.type') === 'sqlite';

        if (contract.options?.databaseTimestamps) {
            extraFields += `
    @CreateDateColumn({
        type: "${isSQLite ? 'datetime' : 'timestamp'}",
        nullable: false
    })
    createdAt: Date;

    @UpdateDateColumn({
        type: "${isSQLite ? 'datetime' : 'timestamp'}",
        nullable: true
    })
    updatedAt: Date;`;
        }

        if (contract.options?.databaseUserAction) {
            if (extraFields) extraFields += '\n';

            extraFields += `
        @ManyToOne(() => UserEntity, { nullable: true })
        ${Config.get('repository.type') === 'mongodb' ? '@ObjectIdColumn({ nullable: true })' : '@Column({ type: "varchar", nullable: true })'}
        userCreator: ${Config.get('repository.type') === 'mongodb' ? 'ObjectId' : 'string'};

        @ManyToOne(() => UserEntity, { nullable: true })
        ${Config.get('repository.type') === 'mongodb' ? '@ObjectIdColumn({ nullable: true })' : '@Column({ type: "varchar", nullable: true })'}
        userLastUpdate: ${Config.get('repository.type') === 'mongodb' ? 'ObjectId' : 'string'};`;
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
                field.link.map((link) => {
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
                            '@entities',
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
                    '@entities',
                ),
            });
        }

        if (importEntitiesList.length > 0) {
            importEntitiesList.map((importEntity) => {
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
            ? '\n' +
                  extraImports
                      .map((value) => {
                          return `\nimport { ${value.name} } from "${value.path}";`;
                      })
                      .join('')
            : '';
    }
}
