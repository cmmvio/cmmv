import * as fs from 'node:fs';
import * as path from 'node:path';

import {
    IContract,
    IContractField,
    IContractMessage,
    IContractService,
} from '../interfaces/contract.interface';

import { Logger } from './logger';

export class Compile {
    private static instance: Compile;
    private logger = new Logger('Compile');

    public static getInstance(): Compile {
        if (!Compile.instance) Compile.instance = new Compile();

        return Compile.instance;
    }

    public compileSchema(schema: any, outputPath: string): string {
        try {
            this.validateSchema(schema);
            const contractCode = this.generateContractCode(schema);
            const outputDir = path.dirname(outputPath);

            if (!fs.existsSync(outputDir))
                fs.mkdirSync(outputDir, { recursive: true });

            fs.writeFileSync(outputPath, contractCode);

            this.logger.log(
                `Contract successfully compiled and saved to ${outputPath}`,
            );
            return outputPath;
        } catch (error) {
            this.logger.error(`Error compiling contract: ${error.message}`);
            throw error;
        }
    }

    private validateSchema(schema: any): void {
        if (!schema.contractName)
            throw new Error('Schema must have a contractName property');

        if (!schema.controllerName)
            throw new Error('Schema must have a controllerName property');

        if (!schema.fields || !Array.isArray(schema.fields))
            throw new Error('Schema must have a fields array property');
    }

    private generateContractCode(schema: IContract): string {
        let code = this.generateImports(schema);
        code += this.generateContractDecorator(schema);
        code += this.generateContractClass(schema);
        return code;
    }

    private generateImports(schema: IContract): string {
        let imports = 'import {\n';
        imports += '    AbstractContract,\n';
        imports += '    Contract,\n';
        imports += '    ContractField,\n';

        if (schema.messages && schema.messages.length > 0)
            imports += '    ContractMessage,\n';

        if (schema.services && schema.services.length > 0)
            imports += '    ContractService,\n';

        imports += "} from '@cmmv/core';\n\n";

        if (schema.imports && schema.imports.length > 0) {
            schema.imports.forEach((importItem) => {
                if (importItem.includes('*')) {
                    const parts = importItem.split(' as ');
                    imports += `import * as ${parts[1]} from '${parts[0].trim()}';\n`;
                } else if (importItem.includes('{')) {
                    imports += `import ${importItem};\n`;
                } else {
                    imports += `import * as ${importItem} from '${importItem}';\n`;
                }
            });

            imports += '\n';
        }

        const linkedContracts = new Set<string>();

        schema.fields?.forEach((field) => {
            if (field.link && Array.isArray(field.link)) {
                field.link.forEach((link) => {
                    if (link.contract) {
                        linkedContracts.add(
                            link.contract.name || link.contract.toString(),
                        );
                    }
                });
            }
        });

        if (linkedContracts.size > 0) {
            linkedContracts.forEach((contract) => {
                imports += `import { ${contract} } from './${contract.replace('Contract', '').toLowerCase()}.contract';\n`;
            });
            imports += '\n';
        }

        return imports;
    }

    /**
     * Generate the Contract decorator
     */
    private generateContractDecorator(schema: IContract): string {
        let decorator = '@Contract({\n';

        if (schema.isPublic) decorator += `    isPublic: true,\n`;

        decorator += `    controllerName: '${schema.controllerName}',\n`;

        if (schema.protoPackage)
            decorator += `    protoPackage: '${schema.protoPackage}',\n`;

        if (schema.subPath) decorator += `    subPath: '${schema.subPath}',\n`;

        if (schema.generateController !== undefined)
            decorator += `    generateController: ${schema.generateController},\n`;

        if (schema.generateEntities !== undefined)
            decorator += `    generateEntities: ${schema.generateEntities},\n`;

        if (schema.auth !== undefined)
            decorator += `    auth: ${schema.auth},\n`;

        if (schema.rootOnly !== undefined)
            decorator += `    rootOnly: ${schema.rootOnly},\n`;

        if (schema.controllerCustomPath)
            decorator += `    controllerCustomPath: '${schema.controllerCustomPath}',\n`;

        if (schema.imports && schema.imports.length > 0) {
            decorator += '    imports: [';

            schema.imports.forEach((importItem, index) => {
                decorator += `'${importItem}'`;

                if (index < schema.imports.length - 1) decorator += ', ';
            });

            decorator += '],\n';
        }

        if (schema.indexs && schema.indexs.length > 0) {
            decorator += '    index: [\n';

            schema.indexs.forEach((index, i) => {
                decorator += '        {\n';
                decorator += `            name: '${index.name}',\n`;

                if (index.fields && index.fields.length > 0) {
                    decorator += '            fields: [';

                    index.fields.forEach((field: any, j: number) => {
                        if (typeof field === 'string')
                            decorator += `'${field}'`;
                        else decorator += `'${field.name}'`;

                        if (j < index.fields.length - 1) decorator += ', ';
                    });

                    decorator += '],\n';
                }

                decorator += '        }';

                if (i < schema.indexs.length - 1) decorator += ',\n';
                else decorator += '\n';
            });

            decorator += '    ],\n';
        }

        if (schema.cache) {
            decorator += '    cache: {\n';

            if (
                schema.cache.key !== undefined &&
                typeof schema.cache.key === 'string'
            )
                decorator += `        key: "${schema.cache.key}",\n`;

            if (
                schema.cache.ttl !== undefined &&
                typeof schema.cache.ttl === 'number'
            )
                decorator += `        ttl: ${schema.cache.ttl},\n`;

            if (
                schema.cache.compress !== undefined &&
                typeof schema.cache.compress === 'boolean'
            )
                decorator += `        compress: ${schema.cache.compress},\n`;

            decorator += '    },\n';
        }

        if (schema.options) {
            decorator += '    options: {\n';

            if (schema.options.tags) {
                if (Array.isArray(schema.options.tags)) {
                    decorator += '        tags: [';

                    schema.options.tags.forEach((tag, index) => {
                        decorator += `'${tag}'`;

                        if (index < schema.options.tags.length - 1)
                            decorator += ', ';
                    });

                    decorator += '],\n';
                } else {
                    decorator += `        tags: ['${schema.options.tags}'],\n`;
                }
            }

            if (schema.options.moduleContract !== undefined)
                decorator += `        moduleContract: ${schema.options.moduleContract},\n`;

            if (schema.options.databaseSchemaName)
                decorator += `        databaseSchemaName: '${schema.options.databaseSchemaName}',\n`;

            if (schema.options.databaseTimestamps !== undefined)
                decorator += `        databaseTimestamps: ${schema.options.databaseTimestamps},\n`;

            if (schema.options.databaseUserAction !== undefined)
                decorator += `        databaseUserAction: ${schema.options.databaseUserAction},\n`;

            if (schema.options.description)
                decorator += `        description: '${schema.options.description}',\n`;

            decorator += '    },\n';
        }

        decorator += '})\n';

        return decorator;
    }

    private generateContractClass(schema: IContract): string {
        const className = this.getContractClassName(schema.contractName);

        let classCode = `export class ${className} extends AbstractContract {\n`;

        if (schema.fields && schema.fields.length > 0) {
            schema.fields.forEach((field) => {
                classCode += this.generateContractField(field);
            });
        }

        if (schema.messages && schema.messages.length > 0) {
            classCode += '\n';
            schema.messages.forEach((message) => {
                classCode += this.generateContractMessage(message);
            });
        }

        if (schema.services && schema.services.length > 0) {
            classCode += '\n';
            schema.services.forEach((service) => {
                classCode += this.generateContractService(service);
            });
        }

        classCode += '}\n';

        return classCode;
    }

    private generateContractField(field: IContractField): string {
        let fieldCode = '    @ContractField({\n';

        fieldCode += `        protoType: '${field.protoType}',\n`;

        if (field.unique !== undefined)
            fieldCode += `        unique: ${field.unique},\n`;

        if (field.nullable !== undefined)
            fieldCode += `        nullable: ${field.nullable},\n`;

        if (field.defaultValue !== undefined) {
            if (typeof field.defaultValue === 'string')
                fieldCode += `        defaultValue: '${field.defaultValue}',\n`;
            else fieldCode += `        defaultValue: ${field.defaultValue},\n`;
        }

        if (field.readOnly !== undefined)
            fieldCode += `        readOnly: ${field.readOnly},\n`;

        if (field.index !== undefined)
            fieldCode += `        index: ${field.index},\n`;

        if (field.objectType)
            fieldCode += `        objectType: '${field.objectType}',\n`;

        if (field.entityType)
            fieldCode += `        entityType: '${field.entityType}',\n`;

        if (field.protoRepeated !== undefined)
            fieldCode += `        protoRepeated: ${field.protoRepeated},\n`;

        if (field.exclude !== undefined)
            fieldCode += `        exclude: ${field.exclude},\n`;

        if (field.toPlainOnly !== undefined)
            fieldCode += `        toPlainOnly: ${field.toPlainOnly},\n`;

        if (field.validations && field.validations.length > 0) {
            fieldCode += '        validations: [\n';

            field.validations.forEach((validation, index) => {
                fieldCode += '            {\n';

                if (validation.type)
                    fieldCode += `                type: '${validation.type}',\n`;

                if (validation.value !== undefined)
                    fieldCode += `                value: ${validation.value},\n`;

                if (validation.message)
                    fieldCode += `                message: '${validation.message}',\n`;

                fieldCode += '            }';

                if (index < field.validations.length - 1) fieldCode += ',\n';
                else fieldCode += '\n';
            });

            fieldCode += '        ],\n';
        }

        if (field.transform)
            fieldCode += `        transform: ${field.transform.toString()},\n`;

        if (field.afterValidation)
            fieldCode += `        afterValidation: ${field.afterValidation.toString()},\n`;

        if (field.resolver)
            fieldCode += `        resolver: '${field.resolver}',\n`;

        if (field.link && field.link.length > 0) {
            fieldCode += '        link: [\n';

            field.link.forEach((link, index) => {
                fieldCode += '            {\n';

                if (link.createRelationship !== undefined)
                    fieldCode += `                createRelationship: ${link.createRelationship},\n`;

                if (link.contract)
                    fieldCode += `                contract: ${this.getContractName(link.contract)},\n`;

                if (link.entityName)
                    fieldCode += `                entityName: '${link.entityName}',\n`;

                if (link.field)
                    fieldCode += `                field: '${link.field}',\n`;

                if (link.array !== undefined)
                    fieldCode += `                array: ${link.array},\n`;

                fieldCode += '            }';

                if (index < field.link.length - 1) fieldCode += ',\n';
                else fieldCode += '\n';
            });

            fieldCode += '        ],\n';
        }

        fieldCode += '    })\n';
        fieldCode += `    ${field.propertyKey}`;

        if (field.nullable || field.defaultValue !== undefined)
            fieldCode += '?';

        if (field.protoType === 'string') {
            fieldCode += ': string';
        } else if (field.protoType === 'bool') {
            fieldCode += ': boolean';
        } else if (
            field.protoType === 'int32' ||
            field.protoType === 'int64' ||
            field.protoType === 'float' ||
            field.protoType === 'double'
        ) {
            fieldCode += ': number';
        } else if (field.protoRepeated) {
            let elementType = 'any';
            if (field.protoType === 'string') elementType = 'string';
            if (field.protoType === 'bool') elementType = 'boolean';
            if (
                field.protoType === 'int32' ||
                field.protoType === 'int64' ||
                field.protoType === 'float' ||
                field.protoType === 'double'
            ) {
                elementType = 'number';
            }

            fieldCode += `: Array<${elementType}>`;
        } else {
            fieldCode += ': any';
        }

        fieldCode += ';\n\n';

        return fieldCode;
    }

    private generateContractMessage(message: IContractMessage): string {
        let messageCode = `    @ContractMessage({\n`;
        messageCode += `        name: '${message.name}',\n`;

        if (message.properties) {
            messageCode += '        properties: {\n';

            Object.entries(message.properties).forEach(
                ([propKey, prop], index, array) => {
                    messageCode += `            '${propKey}': {\n`;

                    if (prop.type)
                        messageCode += `                type: '${prop.type}',\n`;

                    if (prop.paramType)
                        messageCode += `                paramType: '${prop.paramType}',\n`;

                    if (
                        prop.required !== undefined &&
                        typeof prop.required === 'boolean'
                    )
                        messageCode += `                required: ${prop.required},\n`;

                    if (prop.arrayType)
                        messageCode += `                arrayType: '${prop.arrayType}',\n`;

                    messageCode += '            }';

                    if (index < Object.entries(array).length - 1)
                        messageCode += ',\n';
                    else messageCode += '\n';
                },
            );

            messageCode += '        },\n';
        }

        messageCode += '    })\n';
        messageCode += `    ${message.propertyKey || message.name}: {\n`;

        if (message.properties) {
            Object.entries(message.properties).forEach(([propKey, prop]) => {
                let typeAnnotation = 'any';

                if (prop.type === 'string') {
                    typeAnnotation = 'string';
                } else if (prop.type === 'bool') {
                    typeAnnotation = 'boolean';
                } else if (
                    prop.type === 'int' ||
                    prop.type === 'int32' ||
                    prop.type === 'int64' ||
                    prop.type === 'float' ||
                    prop.type === 'double'
                ) {
                    typeAnnotation = 'number';
                } else if (prop.type === 'simpleArray') {
                    let elementType = 'any';
                    if (prop.arrayType === 'string') elementType = 'string';
                    if (prop.arrayType === 'boolean') elementType = 'boolean';
                    if (prop.arrayType === 'number') elementType = 'number';

                    typeAnnotation = `${elementType}[]`;
                }

                messageCode += `        ${propKey}${prop.required === false ? '?' : ''}: ${typeAnnotation};\n`;
            });
        }

        messageCode += '    };\n\n';

        return messageCode;
    }

    private generateContractService(service: IContractService): string {
        let serviceCode = `    @ContractService({\n`;
        serviceCode += `        name: '${service.name}',\n`;
        serviceCode += `        path: '${service.path}',\n`;
        serviceCode += `        method: '${service.method}',\n`;

        if (service.auth !== undefined && typeof service.auth === 'boolean')
            serviceCode += `        auth: ${service.auth},\n`;

        if (
            service.rootOnly !== undefined &&
            typeof service.rootOnly === 'boolean'
        )
            serviceCode += `        rootOnly: ${service.rootOnly},\n`;

        if (service.functionName)
            serviceCode += `        functionName: '${service.functionName}',\n`;

        if (service.request !== undefined)
            serviceCode += `        request: '${service.request}',\n`;

        if (service.response)
            serviceCode += `        response: '${service.response}',\n`;

        if (
            service.createBoilerplate !== undefined &&
            typeof service.createBoilerplate === 'boolean'
        )
            serviceCode += `        createBoilerplate: ${service.createBoilerplate},\n`;

        if (service.cache) {
            serviceCode += '        cache: {\n';

            if (
                service.cache.key !== undefined &&
                typeof service.cache.key === 'string'
            )
                serviceCode += `            key: '${service.cache.key}',\n`;

            if (
                service.cache.ttl !== undefined &&
                typeof service.cache.ttl === 'number'
            )
                serviceCode += `            ttl: ${service.cache.ttl},\n`;

            if (
                service.cache.compress !== undefined &&
                typeof service.cache.compress === 'boolean'
            )
                serviceCode += `            compress: ${service.cache.compress},\n`;

            serviceCode += '        },\n';
        }

        serviceCode += '    })\n';
        serviceCode += `    ${service.propertyKey || service.name}: Function;\n\n`;

        return serviceCode;
    }

    private getContractClassName(contractName: string): string {
        if (contractName.endsWith('Contract')) {
            return contractName;
        }
        return `${contractName}Contract`;
    }

    private getContractName(contract: any): string {
        if (typeof contract === 'string') {
            return contract;
        }
        if (contract.name) {
            return contract.name;
        }
        return contract.toString();
    }
}
