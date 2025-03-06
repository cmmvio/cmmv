import * as fs from 'fs';
import * as path from 'path';

import { AbstractTranspile, Config, ITranspile, Scope } from '../lib';

import { IContract } from '../interfaces/contract.interface';
import { CONTROLLER_NAME_METADATA } from '../decorators';

export class ApplicationTranspile
    extends AbstractTranspile
    implements ITranspile
{
    run(): void {
        const contracts = Scope.getArray<any>('__contracts');
        contracts?.forEach((contract: any) => this.generateModel(contract));
    }

    private generateModel(contract: IContract): void {
        const modelName = `${contract.controllerName}`;
        const modelInterfaceName = `I${modelName}`;
        const modelFileName = `${modelName.toLowerCase()}.model.ts`;
        const isModuleContract = contract.options?.moduleContract === true;
        const outputDir = isModuleContract
            ? this.getGeneratedPath(contract, 'models')
            : this.getRootPath(contract, 'models');

        const outputFilePath = path.join(outputDir, modelFileName);
        let includeId = '';

        if (
            modelInterfaceName !== 'IWsCall' &&
            modelInterfaceName !== 'IWsError'
        )
            includeId = `${Config.get('repository.type') === 'mongodb' ? '    _id?: ObjectId' : '    id?: any'};\n`;

        const modelTemplate = `/**
    **********************************************
    This script was generated automatically by CMMV.
    It is recommended not to modify this file manually,
    as it may be overwritten by the application.
    **********************************************
**/

${this.generateClassImports(contract, modelInterfaceName, outputFilePath)}

export interface ${modelInterfaceName} {
${includeId}${contract.fields
            ?.map((field: any) => {
                let optional = field.nullable ? '?' : '';

                if (field.link && field.link.length > 0) {
                    return `    ${field.propertyKey}${optional}: object | string | string[]${Config.get('repository.type') === 'mongodb' ? ' | ObjectId' : ''};`;
                } else {
                    const fieldType = field.objectType
                        ? field.objectType
                        : this.mapToTsType(field.protoType);

                    return `    ${field.propertyKey}${optional}: ${fieldType};`;
                }
            })
            .join('\n')}
}

//Model
export class ${modelName} implements ${modelInterfaceName} {
${includeId === '_id' ? '    @Expose()\n    @IsOptional()\n' + includeId + '\n' : ''}    @Expose({ toClassOnly: true })
    @IsOptional()
    id: string;

${contract.fields?.map((field: any) => this.generateClassField(field)).join('\n\n')}

    constructor(partial: Partial<${modelName}>) {
        Object.assign(this, partial);
    }

    public serialize(){
        return instanceToPlain(this);
    }

    public static fromPartial(partial: Partial<${modelName}>): ${modelName}{
        return plainToInstance(${modelName}, partial, {
            exposeUnsetFields: false,
            enableImplicitConversion: true,
            excludeExtraneousValues: true
        })
    }

    public static fromEntity(entity: any) : any {
        return plainToInstance(this, entity, {
            exposeUnsetFields: false,
            enableImplicitConversion: true,
            excludeExtraneousValues: true
        })
    }

    public toString(){
        return ${modelName}FastSchema(this);
    }
}

// Schema
export const ${modelName}FastSchemaStructure = {
    title: "${modelName} Schema",
    type: "object",
    properties: {
        id: {
            type: "string",
            nullable: false
        },
${contract.fields?.map((field: any) => `        ${field.propertyKey}: ${this.generateJsonSchemaField(field)}`).join(',\n')}
    },
    required: ["id", ${contract.fields
        .filter((field: any) =>
            field.nullable ? field.nullable !== true : true,
        )
        .map((field: any) => `"${field.propertyKey}"`)
        .join(', ')}]
};

export const ${modelName}FastSchema = fastJson(${modelName}FastSchemaStructure);

${this.generateDTOs(contract)}
`;

        fs.writeFileSync(
            outputFilePath,
            this.removeExtraSpaces(modelTemplate),
            'utf8',
        );
    }

    private generateClassImports(
        contract: IContract,
        modelInterfaceName: string,
        outputFilePath?: string,
    ): string {
        let importStatements: string[] = [
            `import { fastJson } from "@cmmv/core";`,
        ];

        if (contract.imports && contract.imports.length > 0) {
            for (const module of contract.imports) {
                importStatements.push(
                    `import * as ${module} from "${module}";`,
                );
            }
        }

        if (
            modelInterfaceName !== 'IWsCall' &&
            modelInterfaceName !== 'IWsError'
        ) {
            if (Config.get('repository.type') === 'mongodb') {
                importStatements.push(
                    `import { ObjectId } from "@cmmv/repository";`,
                );
            }
        }

        const hasExclude = contract.fields?.some(
            (field: any) => field.exclude || field.toClassOnly,
        );

        const hasTransform = contract.fields?.some(
            (field: any) => field.transform,
        );

        const hasType = contract.fields?.some(
            (field: any) => field.protoType === 'date',
        );

        const imports = ['Expose', 'instanceToPlain', 'plainToInstance'];

        if (hasExclude || hasTransform || hasType) {
            if (hasExclude) imports.push('Exclude');
            if (hasTransform) imports.push('Transform');
            if (hasType) imports.push('Type');
        }

        importStatements.push(
            `
import {
    ${imports.join(', ')}
} from "@cmmv/core";\n`,
        );

        const validationImports = new Set<string>(['IsOptional']);

        const importEntitiesList = new Array<{
            entityName: string;
            path: string;
        }>();

        contract.fields?.forEach((field: any) => {
            if (field.validations) {
                field.validations?.forEach((validation: any) => {
                    const validationName = Array.isArray(validation.type)
                        ? validation.type[0]
                        : validation.type;
                    validationImports.add(validationName);
                });
            }

            if (field.nullable === false) validationImports.add('IsNotEmpty');

            if (field.link && field.link.length > 0) {
                //validationImports.add('ValidateNested');

                field.link.map((link) => {
                    const contractInstance = new link.contract();
                    const controllerName = Reflect.getMetadata(
                        CONTROLLER_NAME_METADATA,
                        contractInstance.constructor,
                    );
                    const entityName = controllerName;
                    const entityFileName = `${entityName.toLowerCase()}.model`;

                    importEntitiesList.push({
                        entityName: `${entityName}, ${entityName}FastSchemaStructure`,
                        path: this.getImportPathRelative(
                            contractInstance,
                            contract,
                            'models',
                            entityFileName,
                            '@models',
                        ),
                    });
                });
            }
        });

        if (validationImports.size > 0) {
            importStatements.push(
                `
import {
    ${Array.from(validationImports).join(', ')}
} from "@cmmv/core"; \n`,
            );
        }

        if (importEntitiesList.length > 0) {
            importEntitiesList.map((importEntity) => {
                importStatements.push(
                    `import {
    ${importEntity.entityName}
} from "${importEntity.path}"; \n`,
                );
            });
        }

        importStatements = [...new Set(importStatements)];
        return importStatements.length > 0 ? importStatements.join('\n') : '';
    }

    private generateClassField(field: any): string {
        const decorators: string[] = [];

        if (field.exclude) {
            decorators.push(
                `    @Exclude(${field.toClassOnly ? `{ toClassOnly: true }` : ''}${field.toPlainOnly ? `{ toPlainOnly: true }` : ''})`,
            );
        } else {
            decorators.push(`    @Expose()`);
        }

        if (field.nullable === false) decorators.push(`    @IsNotEmpty()`);

        if (field.transform) {
            const cleanedTransform = field.transform
                .toString()
                .replace(/_([a-zA-Z]+)/g, ' $1');

            decorators.push(
                `    //@ts-ignore\n    @Transform(${cleanedTransform}, { toClassOnly: true })`,
            );
        }

        if (field.toPlain) {
            const cleanedToPlain = field.toPlain
                .toString()
                .replace(/_([a-zA-Z]+)/g, ' $1');

            decorators.push(
                `    //@ts-ignore\n    @Transform(${cleanedToPlain}, { toPlainOnly: true })`,
            );
        }

        if (field.protoType === 'date') {
            decorators.push(`    @Type(() => Date)`);
        }

        if (field.validations) {
            field.validations?.forEach((validation: any) => {
                const validationName = Array.isArray(validation.type)
                    ? validation.type[0]
                    : validation.type;

                const validationParams = Array.isArray(validation.type)
                    ? validation.type
                          .slice(1)
                          .map((param) => JSON.stringify(param))
                          .join(', ')
                    : validation.value !== undefined
                      ? validation.value
                      : '';

                const options = [];

                if (validation.message)
                    options.push(`message: "${validation.message}"`);

                if (validation.context) {
                    const contextString = JSON.stringify(
                        validation.context,
                    ).replace(/"([^"]+)":/g, '$1:');
                    options.push(`context: ${contextString}`);
                }

                let optionsString =
                    options.length > 0 ? `{ ${options.join(', ')} }` : '';

                if (validationParams && optionsString)
                    optionsString = ', ' + optionsString;

                decorators.push(
                    `    @${validationName}(${validationParams}${
                        optionsString ? optionsString : ''
                    })`,
                );
            });
        }

        let defaultValueString = ';';
        let optional = field.nullable ? '?' : '';

        if (field.defaultValue !== undefined) {
            const defaultValue =
                typeof field.defaultValue === 'string'
                    ? `"${field.defaultValue}"`
                    : field.defaultValue;

            defaultValueString = field.objectType
                ? ` = ${field.defaultValue};`
                : ` = ${defaultValue};`;
        }

        if (field.link && field.link.length > 0) {
            //decorators.push('    @ValidateNested()');
            return `${decorators.length > 0 ? decorators.join('\n') + '\n' : ''}    ${field.propertyKey}${optional}: ${field.entityType.replace('Entity', '')}${field.protoRepeated ? '[]' : ''} | string${field.protoRepeated ? '[]' : ''}${Config.get('repository.type') === 'mongodb' ? ' | ObjectId' + (field.protoRepeated ? '[]' : '') : ''} | null;`;
        } else {
            const fieldType = field.objectType
                ? field.objectType
                : this.mapToTsType(field.protoType);

            return `${decorators.length > 0 ? decorators.join('\n') + '\n' : ''}    ${field.propertyKey}${optional}: ${fieldType}${defaultValueString}`;
        }
    }

    private mapToTsType(protoType: string): string {
        const typeMapping: { [key: string]: string } = {
            string: 'string',
            boolean: 'boolean',
            bool: 'boolean',
            int: 'number',
            int32: 'number',
            int64: 'number',
            float: 'number',
            double: 'number',
            bytes: 'Uint8Array',
            date: 'string',
            timestamp: 'string',
            text: 'string',
            json: 'any',
            jsonb: 'any',
            uuid: 'string',
            time: 'string',
            simpleArray: 'string[]',
            simpleJson: 'any',
            bigint: 'bigint',
            uint32: 'number',
            uint64: 'number',
            sint32: 'number',
            sint64: 'number',
            fixed32: 'number',
            fixed64: 'number',
            sfixed32: 'number',
            sfixed64: 'number',
            any: 'any',
        };

        return typeMapping[protoType] || 'any';
    }

    private generateJsonSchemaField(field: any): string {
        const parts = [
            `type: "${
                field.protoRepeated
                    ? 'array'
                    : this.mapToJsonSchemaType(
                          field.objectType ? field.objectType : field.protoType,
                      )
            }"`,
            `    nullable: ${field.nullable === true ? 'true' : 'false'}`,
        ];

        if (field.defaultValue !== undefined && !field.protoRepeated) {
            const defaultValue =
                typeof field.defaultValue === 'object'
                    ? JSON.stringify(field.defaultValue)
                    : field.defaultValue;
            parts.push(`    default: ${defaultValue}`);
        }

        if (field.description) {
            parts.push(`description: "${field.description}"`);
        }

        if (field.protoRepeated || field.protoType === 'array') {
            const itemType = this.mapToJsonSchemaType(
                field.items?.protoType || field.protoType,
            );

            if (field.link && field.link.length > 0) {
                field.link.map((link) => {
                    parts.push(
                        `    items: ${field.entityType.replace('Entity', '')}FastSchemaStructure`,
                    );
                });
            } else {
                parts.push(`    items: {
                type: "${itemType}"
            }`);
            }
        }

        return `{
            ${parts.join(',\n        ')}
        }`;
    }

    private mapToJsonSchemaType(protoType: string): string {
        const typeMapping: { [key: string]: string } = {
            string: 'string',
            boolean: 'boolean',
            bool: 'boolean',
            int: 'integer',
            int32: 'integer',
            int64: 'integer',
            float: 'number',
            double: 'number',
            bytes: 'string',
            date: 'string',
            timestamp: 'string',
            text: 'string',
            json: 'object',
            jsonb: 'object',
            object: 'object',
            uuid: 'string',
            time: 'string',
            simpleArray: 'array',
            simpleJson: 'object',
            bigint: 'integer',
            uint32: 'integer',
            uint64: 'integer',
            sint32: 'integer',
            sint64: 'integer',
            fixed32: 'integer',
            fixed64: 'integer',
            sfixed32: 'integer',
            sfixed64: 'integer',
            any: 'any',
        };

        return typeMapping[protoType] || 'any';
    }

    private generateDTOs(contract: IContract) {
        let result = '';

        if (Object.keys(contract.messages).length > 0) {
            result += '// DTOs\n';

            for (let key in contract.messages) {
                result += `export interface ${contract.messages[key].name} {
${Object.entries(contract.messages[key].properties)
    .map(([fieldName, field]: [string, any]) => {
        const fieldType = this.mapToTsType(field.type);
        return `    ${fieldName}${field.required ? '' : '?'}: ${fieldType}${field.default ? ' = ' + JSON.stringify(field.default) : ''};`;
    })
    .join('\n')}
}\n\n`;

                result += `export class ${contract.messages[key].name}DTO implements ${contract.messages[key].name} {
${Object.entries(contract.messages[key].properties)
    .map(([fieldName, field]: [string, any]) => {
        const fieldType = this.mapToTsType(field.type);
        return `    ${fieldName}${field.required ? '' : '?'}: ${fieldType}${field.default ? ' = ' + JSON.stringify(field.default) : ''};`;
    })
    .join('\n')}

    constructor(partial: Partial<${contract.messages[key].name}DTO>) {
        Object.assign(this, partial);
    }

    public serialize(){
        return instanceToPlain(this);
    }

    public static fromPartial(partial: Partial<${contract.messages[key].name}DTO>): ${contract.messages[key].name}DTO{
        return plainToInstance(${contract.messages[key].name}DTO, partial, {
            exposeUnsetFields: false,
            enableImplicitConversion: true,
            excludeExtraneousValues: true
        })
    }

    public static fromEntity(entity: any): ${contract.messages[key].name}DTO {
        return plainToInstance(${contract.messages[key].name}DTO, entity, {
            exposeUnsetFields: false,
            enableImplicitConversion: true,
            excludeExtraneousValues: true
        })
    }
}\n\n`;
            }
        }

        return result;
    }
}
