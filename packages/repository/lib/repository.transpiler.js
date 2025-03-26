"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.RepositoryTranspile = void 0;
const fs = require("node:fs");
const path = require("node:path");
const core_1 = require("@cmmv/core");
class RepositoryTranspile extends core_1.AbstractTranspile {
    /**
     * Run the transpile process
     */
    run() {
        const contracts = core_1.Scope.getArray('__contracts');
        contracts?.forEach((contract) => {
            if (contract.generateEntities)
                this.generateEntities(contract);
            if (contract.generateController)
                this.generateServices(contract);
        });
    }
    /**
     * Generate the entities
     * @param contract - The contract to generate the entities for
     */
    generateEntities(contract) {
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
} from "@cmmv/repository";

import {
    I${entityName}
} from "${this.getImportPath(contract, 'models', modelName.toLowerCase(), '@models')}";${this.generateEntitiesImport(contract, extraEntitiesImport)}

@Entity("${schemaName}")
${this.generateIndexes(entityName, contract.fields, contract)}
export class ${entityName}Entity implements I${entityName} {
    ${core_1.Config.get('repository.type') === 'mongodb' ? '@ObjectIdColumn()' : '@PrimaryGeneratedColumn("uuid")'}
    ${core_1.Config.get('repository.type') === 'mongodb' ? '_id: ObjectId' : 'id: string'};

${contract.fields.map((field) => this.generateField(field, contract)).join('\n\n')}${extraFields}
}`;
        const outputDir = this.getGeneratedPath(contract, 'entities');
        const outputFilePath = path.join(outputDir, entityFileName);
        fs.writeFileSync(outputFilePath, entityTemplate, 'utf8');
    }
    /**
     * Generate the services
     * @param contract - The contract to generate the services for
     */
    generateServices(contract) {
        const generateBoilerplates = contract.generateBoilerplates === true;
        const telemetry = core_1.Config.get('app.telemetry');
        const serviceName = `${contract.controllerName}Service`;
        const modelName = `${contract.controllerName}`;
        const entityName = `${contract.controllerName}Entity`;
        const serviceFileNameGenerated = `${contract.controllerName.toLowerCase()}.service.ts`;
        let importsFromModel = [];
        let resolvers = [];
        contract.fields.map((field) => {
            if (field.resolver)
                resolvers.push(field.resolver);
        });
        contract.services
            .filter((service) => service.createBoilerplate === true)
            .map((service) => {
            importsFromModel.push(service.request);
            importsFromModel.push(service.response);
        });
        const findOptions = resolvers.length > 0
            ? `, { resolvers: ["${resolvers.join('","')}"] }`
            : '';
        importsFromModel = [...new Set(importsFromModel)];
        let serviceTemplateGenerated = `/**
    **********************************************
    This script was generated automatically by CMMV.
    It is recommended not to modify this file manually,
    as it may be overwritten by the application.
    **********************************************
**/

import {
    Service
} from "@cmmv/core";

import {
    AbstractRepositoryService,
    RepositorySchema
} from "@cmmv/repository";

import {
    IReponseResult,
    IOperationResult
} from "@cmmv/http";

import {
    ${modelName}${importsFromModel.join(', \n   ')}
} from "${this.getImportPath(contract, 'models', modelName.toLowerCase(), '@models')}.model";

import {
    ${entityName}
} from "${this.getImportPath(contract, 'entities', modelName.toLowerCase(), '@entities')}.entity";

export class ${serviceName}Generated extends AbstractRepositoryService {
    protected schema = new RepositorySchema(
        ${entityName},
        ${modelName},
        ${contract.options?.databaseFakeDelete ? 'true' : 'false'},
        ${contract.options?.databaseTimestamps ? 'true' : 'false'},
        ${contract.options?.databaseUserAction ? 'true' : 'false'}
    );

    async getAll(queries?: any, req?: any): Promise<IReponseResult<${modelName}>> {
        return await this.schema.getAll(queries, req${findOptions});
    }

    async getIn(inArr: Array<string>): Promise<IReponseResult<${modelName}>> {
        return await this.schema.getIn(inArr${findOptions});
    }

    async getById(id: string): Promise<IReponseResult<${modelName}>> {
        return await this.schema.getById(id${findOptions});
    }

    async insert(payload: Partial<${modelName}>, req?: any): Promise<IOperationResult<${modelName}>> {
        const newItem: any = this.fromPartial(${modelName}, payload, req);
        const validatedData = await this.validate<${modelName}>(newItem);
        return await this.schema.insert(validatedData);
    }

    async update(id: string, payload: Partial<${modelName}>, req?: any): Promise<IOperationResult> {
        const updateItem: any = this.fromPartial(${modelName}, payload, req);
        const validatedData = await this.validate<${modelName}>(updateItem, true);
        return await this.schema.update(id, validatedData);
    }

    async delete(id: string): Promise<IOperationResult> {
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
        if (!telemetry) {
            serviceTemplateGenerated = this.removeTelemetry(serviceTemplateGenerated);
        }
        const outputDir = this.getGeneratedPath(contract, 'services');
        const outputFilePath = path.join(outputDir, serviceFileNameGenerated);
        fs.writeFileSync(outputFilePath, this.removeExtraSpaces(serviceTemplateGenerated), 'utf8');
        if (!generateBoilerplates) {
            fs.appendFileSync(outputFilePath, this.removeExtraSpaces(`

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
}`), 'utf8');
        }
    }
    /**
     * Generate the indexes
     * @param entityName - The name of the entity
     * @param fields - The fields of the entity
     * @param contract - The contract to generate the indexes for
     */
    generateIndexes(entityName, fields, contract) {
        let indexDecorators = fields
            .filter((field) => field.index || field.unique)
            .map((field) => {
            const indexName = `idx_${entityName.toLowerCase()}_${field.propertyKey}`;
            const columns = `["${field.propertyKey}"]`;
            const uniqueOption = field.unique ? `{ unique: true }` : '';
            return `@Index("${indexName}", ${columns}${uniqueOption ? `, ${uniqueOption}` : ''})`;
        });
        if (contract.indexs &&
            Array.isArray(contract.indexs) &&
            contract.indexs.length > 0) {
            indexDecorators = [
                ...indexDecorators,
                ...contract.indexs.map((index) => {
                    return `@Index("${index.name}", ${JSON.stringify(index.fields)}${index.options ? `, ${JSON.stringify(index.options)}` : ''})`;
                }),
            ];
        }
        if (contract.options?.databaseFakeDelete)
            indexDecorators.push(`@Index("idx_${entityName.toLowerCase()}_deleted", ["deleted"])`);
        return indexDecorators.join('\n');
    }
    /**
     * Generate the field
     * @param field - The field to generate
     * @returns The field
     */
    generateField(field, contract) {
        let tsType = this.mapToTsType(field.protoType, field);
        const columnOptions = this.generateColumnOptions(field);
        let decorators = [
            `@Column({
        ${columnOptions}
    })`,
        ];
        let optional = field.nullable ? '?' : '';
        let linkedField = '';
        if (field.link) {
            decorators = [];
            field.link.map((link) => {
                if (link.contract) {
                    const contractInstance = new link.contract();
                    const controllerName = Reflect.getMetadata(core_1.CONTROLLER_NAME_METADATA, contractInstance.constructor);
                    const entityName = controllerName;
                    const isMongoDB = core_1.Config.get('repository.type') === 'mongodb';
                    const linkType = isMongoDB ? 'string' : 'varchar';
                    const linkField = link.field === '_id' && !isMongoDB ? 'id' : link.field;
                    if (link.createRelationship !== false && !link.array) {
                        decorators.push(`@ManyToOne(() => ${entityName}Entity, (${link.entityName}) => ${link.entityName}.${linkField}, { nullable: ${link?.entityNullable === true || false ? 'true' : 'false'} })
    @Column({
        type: "varchar",
        nullable: true
    })`);
                        tsType = `${entityName}Entity | string | null`;
                        const entityContract = contract.controllerName;
                        linkedField = `\n\n    @RelationId((${entityContract.toLocaleLowerCase()}: ${entityContract}Entity) => ${entityContract.toLocaleLowerCase()}.${field.propertyKey})\n    ${field.propertyKey}Id: string;`;
                    }
                    else if (link.createRelationship !== false &&
                        link.array) {
                        decorators.push(`@OneToMany(() => ${entityName}Entity, (${link.entityName}) => ${link.entityName}.${linkField}, { nullable: ${link?.entityNullable === true || false ? 'true' : 'false'} })
    @Column({
        type: "varchar",
        nullable: true
    })`);
                        tsType = `${entityName}Entity[] | string[] | null`;
                    }
                    else {
                        decorators.push(`@Column({
            type: "${field.protoRepeated ? 'simple-array' : linkType}",
            nullable: true
        })`);
                        tsType = `${entityName}Entity[] | string[] | null`;
                    }
                }
            });
            if (!field.link) {
                tsType =
                    `${field.entityType}${field.protoRepeated ? '[]' : ''} | string${field.protoRepeated ? '[]' : ''}${core_1.Config.get('repository.type') === 'mongodb' ? ' | ObjectId' + (field.protoRepeated ? '[]' : '') : ''} | null` ||
                        'object';
            }
        }
        return `    ${decorators.join(' ')}\n    ${field.propertyKey}${optional}: ${tsType};${linkedField}`;
    }
    /**
     * Generate the column options
     * @param field - The field to generate the column options for
     * @returns The column options
     */
    generateColumnOptions(field) {
        const isMongoDB = core_1.Config.get('repository.type') === 'mongodb';
        const typeField = this.mapToTypeORMType(field.protoType, field);
        const options = [];
        options.push(`type: "${typeField}"`);
        if (field.defaultValue !== undefined &&
            (isMongoDB || typeField !== 'simple-array')) {
            options.push(`        default: ${typeof field.defaultValue === 'object' ? JSON.stringify(field.defaultValue) : field.defaultValue}`);
        }
        options.push(`        nullable: ${field.nullable === true ? 'true' : 'false'}`);
        return options.join(', \n');
    }
    /**
     * Map the proto type to the ts type
     * @param protoType - The proto type
     * @param field - The field to map the proto type to
     * @returns The ts type
     */
    mapToTsType(protoType, field) {
        const typeMapping = {
            string: 'string',
            bool: 'boolean',
            boolean: 'boolean',
            int32: 'number',
            int64: 'number',
            uint32: 'number',
            uint64: 'number',
            sint32: 'number',
            sint64: 'number',
            fixed32: 'number',
            fixed64: 'number',
            int: 'number',
            float: 'number',
            double: 'number',
            any: 'any',
            text: 'string',
            timestamp: 'string',
            date: 'Date',
            time: 'Date',
            bytes: 'string',
            json: 'object | string',
            jsonb: 'object | string',
        };
        return ((typeMapping[protoType] || 'string') +
            (field.protoRepeated ? '[]' : ''));
    }
    /**
     * Map the proto type to the typeorm type
     * @param type - The type
     * @param field - The field to map the proto type to
     * @returns The typeorm type
     */
    mapToTypeORMType(type, field) {
        const typeMapping = {
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
    /**
     * Generate the typeorm imports
     * @param contract - The contract to generate the typeorm imports for
     * @returns The typeorm imports
     */
    generateTypeORMImports(contract) {
        let extraImport = [];
        if (contract.options?.databaseTimestamps)
            extraImport.push('CreateDateColumn', 'UpdateDateColumn');
        if (contract.options?.databaseUserAction)
            extraImport.push('ManyToOne');
        contract.fields.map((field) => {
            if (field.link && field.link.length > 0)
                extraImport.push('ManyToOne', 'OneToMany', 'RelationId');
        });
        extraImport = [...new Set(extraImport)];
        return `Entity, ${core_1.Config.get('repository.type') === 'mongodb' ? 'ObjectIdColumn' : 'PrimaryGeneratedColumn'},
    Column, Index, ${core_1.Config.get('repository.type') === 'mongodb' ? 'ObjectId,' : ''} ${extraImport.length > 0 ? `\n\t${extraImport.join(', \n    ')}` : ''}`;
    }
    /**
     * Generate the extra fields
     * @param contract - The contract to generate the extra fields for
     * @returns The extra fields
     */
    generateExtraFields(contract) {
        let extraFields = '';
        const isSQLite = core_1.Config.get('repository.type') === 'sqlite';
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
            if (extraFields)
                extraFields += '\n';
            extraFields += `
    @ManyToOne(() => UserEntity, { nullable: true })
    ${core_1.Config.get('repository.type') === 'mongodb' ? '@ObjectIdColumn({ nullable: true })' : '@Column({ type: "varchar", nullable: true })'}
    userCreator: ${core_1.Config.get('repository.type') === 'mongodb' ? 'ObjectId' : 'string'};

    @ManyToOne(() => UserEntity, { nullable: true })
    ${core_1.Config.get('repository.type') === 'mongodb' ? '@ObjectIdColumn({ nullable: true })' : '@Column({ type: "varchar", nullable: true })'}
    userLastUpdate: ${core_1.Config.get('repository.type') === 'mongodb' ? 'ObjectId' : 'string'};`;
        }
        if (contract.options?.databaseFakeDelete) {
            extraFields += `
    @Column({
        type: "boolean",
        default: false
    })
    deleted: boolean;

    @Column({
        type: "${isSQLite ? 'datetime' : 'timestamp'}",
        nullable: true
    })
    deletedAt: Date;
    `;
        }
        return extraFields ? `\n${extraFields}` : '';
    }
    /**
     * Generate the extra import
     * @param contract - The contract to generate the extra import for
     */
    generateExtraImport(contract) {
        let imports = [];
        const importEntitiesList = new Array();
        contract.fields?.forEach((field) => {
            if (field.link && field.link.length > 0) {
                field.link.map((link) => {
                    if (link.contract) {
                        const contractInstance = new link.contract();
                        const controllerName = Reflect.getMetadata(core_1.CONTROLLER_NAME_METADATA, contractInstance.constructor);
                        const entityName = controllerName;
                        const entityFileName = `${entityName.toLowerCase()}.entity`;
                        importEntitiesList.push({
                            entityName: `${entityName}Entity`,
                            path: this.getImportPathRelative(contractInstance, contract, 'entities', entityFileName, '@entities'),
                        });
                    }
                });
            }
        });
        if (contract.options?.databaseUserAction) {
            imports.push({
                name: 'UserEntity',
                path: this.getImportPathWithoutSubPath(contract, 'entities', 'auth/user.entity', '@entities'),
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
    /**
     * Generate the entities import
     * @param contract - The contract to generate the entities import for
     * @param extraImports - The extra imports to generate
     * @returns The entities import
     */
    generateEntitiesImport(contract, extraImports) {
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
exports.RepositoryTranspile = RepositoryTranspile;
