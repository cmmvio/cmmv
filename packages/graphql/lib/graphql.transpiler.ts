import * as fs from 'node:fs';
import * as path from 'node:path';
import { cwd } from 'node:process';
import * as fg from 'fast-glob';

import { buildSchema } from 'type-graphql';

import {
    Application,
    AbstractTranspile,
    Config,
    ITranspile,
    Scope,
    IContract,
    CONTROLLER_NAME_METADATA,
    SUB_PATH_METADATA,
} from '@cmmv/core';

import { authChecker } from './auth-checker';
import GraphQLJSON from 'graphql-type-json';

export class GraphQLTranspile extends AbstractTranspile implements ITranspile {
    public resolvers = new Map<string, any>();

    async run(): Promise<void> {
        try {
            if (!Reflect || !Reflect.metadata) {
                console.warn(
                    'reflect-metadata may not be properly configured. This is required for GraphQL decorators.',
                );
            }

            const contracts = Scope.getArray<any>('__contracts');
            const sourceDir = Config.get<string>('app.sourceDir', 'src');
            const generateResolvers = Config.get<boolean>(
                'graphql.generateResolvers',
                true,
            );
            const resolversDir = path.join(cwd(), sourceDir, 'resolvers');
            const resolversGeneratedDir = path.join(
                cwd(),
                '.generated',
                'resolvers',
            );
            const schemaFilename = path.join(
                cwd(),
                '.generated',
                'schema.graphql',
            );

            if (contracts && generateResolvers) {
                for (const contract of contracts) {
                    if (
                        contract.generateEntities &&
                        contract.generateController
                    ) {
                        await this.generateResolvers(contract);
                    }
                }
            }

            const allResolvers = [];

            const resolversFiles = await fg([
                `${resolversDir}/**/*.resolver.ts`,
                `${resolversGeneratedDir}/**/*.resolver.ts`,
            ]);

            for (const file of resolversFiles) {
                try {
                    const resolverModule = await import(file);
                    const exportedClasses = Object.values(resolverModule);

                    for (const exportedClass of exportedClasses) {
                        if (
                            typeof exportedClass === 'function' &&
                            exportedClass.prototype
                        ) {
                            allResolvers.push(exportedClass);
                            this.resolvers.set(
                                exportedClass.name,
                                exportedClass,
                            );
                        }
                    }
                } catch (error) {
                    console.error(
                        `Error importing resolver from ${file}:`,
                        error,
                    );
                }
            }

            const modulesResolvers = Application.getResolvers();
            allResolvers.push(...modulesResolvers);

            if (allResolvers.length > 0) {
                try {
                    const nonEmptyResolvers =
                        allResolvers.length > 0
                            ? allResolvers
                            : [class EmptyResolver {}];

                    const resolversArray = nonEmptyResolvers as [
                        Function,
                        ...Function[],
                    ];

                    await buildSchema({
                        resolvers: resolversArray,
                        authChecker,
                        emitSchemaFile: schemaFilename,
                        skipCheck: false,
                        orphanedTypes: [],
                    });
                } catch (error) {
                    console.error('Error building GraphQL schema:', error);
                    throw error;
                }
            } else {
                console.warn(
                    'No GraphQL resolvers found. Schema not generated.',
                );
            }
        } catch (error) {
            console.error('Error in GraphQL transpiler setup:', error);
            throw error;
        }
    }

    private async generateResolvers(contract: IContract): Promise<void> {
        const entityName = contract.controllerName;
        const resolverName = `${contract.controllerName}Resolver`;
        const modelName = `${contract.controllerName}.Model`;
        const serviceName = `${contract.controllerName}Service`;
        const resolverFileName = `${contract.controllerName.toLowerCase()}.resolver.ts`;

        const authRouter = contract.auth === true;
        const rootOnlyRouter = contract.rootOnly === true;
        const customServices = this.prepareCustomServices(contract);
        const argsClassesCode = this.generateCustomArgsClasses(contract);

        const resolverTemplate = `/**
    **********************************************
    This script was generated automatically by CMMV.
    It is recommended not to modify this file manually,
    as it may be overwritten by the application.
    **********************************************
**/

import {
    Resolver, Query, Mutation,
    Authorized, Arg, Args,
    ID, Int, Float, Ctx,
    Field, ArgsType, ObjectType,
    PaginationArgs, GraphQLContext,
    PaginationResponse
} from "@cmmv/graphql";

import GraphQLJSON from 'graphql-type-json';

import {
    I${entityName}, ${entityName}
} from "${this.getImportPath(contract, 'models', modelName.toLowerCase(), '@models')}";

import { Application } from "@cmmv/core";

${this.generateClassImports(contract)}
import {
   ${serviceName}
} from "${this.getImportPath(contract, 'services', contract.controllerName.toLowerCase() + '.service', '@services')}";

${customServices.imports}

${argsClassesCode}

@ArgsType()
class Create${entityName}Input {
${contract.fields
    ?.map((field: any) => this.generateClassField(field))
    .filter((item) => item)
    .join('\n\n')}
}

@ArgsType()
class Update${entityName}Input {
    @Field(() => ID)
    id: string;

${contract.fields
    ?.map((field: any) => this.generateClassField(field))
    .filter((item) => item)
    .join('\n\n')}
}

@ObjectType()
class Pagination${entityName}Return {
    @Field(() => Int, {
        description: "Total number of records available in the dataset.",
        nullable: false
    })
    count!: number;

    @Field(() => [${entityName}], {
        description: "List of records for the current page.",
        nullable: false
    })
    data?: ${entityName}[];

    @Field(() => PaginationResponse, {
        description: "Pagination metadata, including page information.",
        nullable: false
    })
    pagination!: PaginationResponse;
}

@Resolver(of => ${entityName})
export class ${resolverName}Generated {
    private readonly ${serviceName.toLowerCase()}: ${serviceName};
${customServices.properties}

    constructor() {
        this.${serviceName.toLowerCase()} = Application.resolveProvider(${serviceName});
${customServices.initializations}
    }

    // CRUD standard queries
    @Query(returns => Pagination${entityName}Return)${this.getControllerDecorators({ authRouter, rootOnlyRouter, contract }, 'get')}
    async ${entityName.toLocaleLowerCase()}Find(
        @Args() queries: PaginationArgs,
        @Ctx() ctx: GraphQLContext
    ) {
        return await this.${serviceName.toLowerCase()}.getAll(queries, ctx.req);
    }

    @Query(returns => ${entityName})${this.getControllerDecorators({ authRouter, rootOnlyRouter, contract }, 'get')}
    async ${entityName.toLocaleLowerCase()}ById(@Arg("id") id: string) {
        return (await this.${serviceName.toLowerCase()}.getById(id)).data;
    }

    // CRUD standard mutations
    @Mutation(returns => ${entityName})${this.getControllerDecorators({ authRouter, rootOnlyRouter, contract }, 'insert')}
    async create${entityName}(@Args() create${entityName}Data: Create${entityName}Input): Promise<${entityName}> {
        return (await this.${serviceName.toLowerCase()}.insert(create${entityName}Data as unknown as Partial<${entityName}>)).data;
    }

    @Mutation(returns => Boolean)${this.getControllerDecorators({ authRouter, rootOnlyRouter, contract }, 'update')}
    async update${entityName}(@Args() update${entityName}Data: Update${entityName}Input): Promise<Boolean> {
        return (await this.${serviceName.toLowerCase()}.update(update${entityName}Data.id, update${entityName}Data as unknown as Partial<${entityName}>)).success;
    }

    @Mutation(returns => Boolean)${this.getControllerDecorators({ authRouter, rootOnlyRouter, contract }, 'delete')}
    async delete${entityName}(@Arg('id') id: string): Promise<boolean> {
        return (await this.${serviceName.toLowerCase()}.delete(id)).success;
    }

    // Custom methods
${this.generateCustomMethods(contract, customServices.serviceMethodMap, serviceName, entityName, authRouter, rootOnlyRouter)}
}
`;

        const outputDir = this.getGeneratedPath(contract, 'resolvers');

        if (!fs.existsSync(outputDir))
            fs.mkdirSync(outputDir, { recursive: true });

        const outputFilePath = path.join(outputDir, resolverFileName);
        fs.writeFileSync(outputFilePath, resolverTemplate, 'utf8');

        await this.removeDuplicateArgsClasses(outputFilePath);
        await this.checkForMissingArgs(outputFilePath, contract);
        this.validateResolverSyntax(outputFilePath);
    }

    private determineReturnType(
        service,
        entityName,
        messages,
    ): { type: string; isArray: boolean; fullType: string } {
        let isArray = false;
        let type = '';
        let fullType = '';

        if (
            service.response?.startsWith('Array<') ||
            service.response?.endsWith('[]')
        ) {
            isArray = true;

            let baseType = service.response
                .replace('Array<', '')
                .replace('>', '')
                .replace('[]', '');

            if (this.findMessageByName(messages, baseType)) {
                type = `[${baseType}GraphQLDTO]`;
                fullType = `${baseType}GraphQLDTO[]`;
            } else if (baseType === entityName) {
                type = `[${entityName}]`;
                fullType = `${entityName}[]`;
            } else {
                type = this.mapTypeToGraphQL(baseType, true);
                fullType = type + '[]';
            }
        } else {
            if (this.findMessageByName(messages, service.response)) {
                type = `${service.response}GraphQLDTO`;
                fullType = type;
            } else if (service.response === entityName) {
                type = entityName;
                fullType = type;
            } else {
                type = this.mapTypeToGraphQL(service.response, false);
                fullType = type;
            }
        }

        return { type, isArray, fullType };
    }

    private findMessageByName(messages, name) {
        if (!messages || !name) return null;
        return messages.find((m) => m.name === name);
    }

    private mapTypeToGraphQL(type, isArray = false): string {
        if (!type) return 'Boolean';

        const typeMap = {
            string: 'String',
            String: 'String',
            number: 'Float',
            Number: 'Float',
            int: 'Int',
            Int: 'Int',
            float: 'Float',
            Float: 'Float',
            boolean: 'Boolean',
            Boolean: 'Boolean',
            date: 'Date',
            Date: 'Date',
            any: 'JSON',
            object: 'JSON',
            void: 'Boolean',
        };

        return typeMap[type] || 'JSON';
    }

    private generateDTOClasses(messages): string {
        if (!messages || messages.length === 0) {
            return '';
        }

        return messages
            .map((message) => {
                const properties = Object.entries(message.properties || {})
                    .map(([fieldName, field]: [string, any]) => {
                        let fieldType = this.mapTypeToGraphQL(field.type);
                        let isArray = false;
                        let actualType = this.mapToTsType(field.type);

                        if (field.type === 'simpleArray' || field.arrayType) {
                            isArray = true;

                            if (field.arrayType) {
                                fieldType = this.mapTypeToGraphQL(
                                    field.arrayType,
                                );
                                actualType = `${this.mapToTsType(field.arrayType)}[]`;
                            } else {
                                fieldType = 'String';
                                actualType = 'string[]';
                            }
                        }

                        const nullable =
                            field.required === false || field.nullable === true;

                        let fieldDecorator;

                        if (
                            fieldName === 'success' ||
                            field.type === 'boolean' ||
                            field.type === 'bool'
                        ) {
                            fieldDecorator = `@Field(() => Boolean, {
            description: "${message.name} ${fieldName} field",
            nullable: ${nullable}
        })`;
                            actualType = 'boolean';
                        } else if (isArray) {
                            fieldDecorator = `@Field(() => [${fieldType}], {
            description: "${message.name} ${fieldName} field",
            nullable: ${nullable}
        })`;
                        } else if (
                            field.type === 'any' ||
                            field.type === 'json' ||
                            field.type === 'jsonb'
                        ) {
                            fieldDecorator = `@Field(() => GraphQLJSON, {
            description: "${message.name} ${fieldName} field",
            nullable: ${nullable}
        })`;
                            actualType = 'any';
                        } else {
                            fieldDecorator = `@Field(() => ${fieldType}, {
            description: "${message.name} ${fieldName} field",
            nullable: ${nullable}
        })`;
                        }

                        return `${fieldDecorator}
    ${fieldName}${nullable ? '?' : '!'}: ${actualType};`;
                    })
                    .join('\n\n');

                return `@ObjectType("${message.name}", {
    description: "${message.name} GraphQL DTO"
})
export class ${message.name}GraphQLDTO {
${properties}
}`;
            })
            .join('\n\n');
    }

    private generateDTOImports(contract: IContract): string {
        if (!contract.messages || contract.messages.length === 0) {
            return '';
        }

        const usedDTOs = new Set<string>();
        if (contract.services) {
            contract.services.forEach((service) => {
                if (service.request && service.request !== 'void')
                    usedDTOs.add(service.request);
                if (service.response && service.response !== 'void') {
                    const responseType = service.response
                        .replace('Array<', '')
                        .replace('>', '')
                        .replace('[]', '');
                    usedDTOs.add(responseType);
                }
            });
        }

        const dtoNames = Array.from(usedDTOs).filter((dto) =>
            contract.messages.some((m) => m.name === dto),
        );

        if (dtoNames.length === 0) {
            return '';
        }

        return `// Import DTOs
import {
    ${dtoNames.map((name) => `${name}DTO`).join(',\n    ')}
} from "${this.getImportPath(contract, 'models', contract.controllerName.toLowerCase() + '.model', '@models')}";
`;
    }

    private generateClassImports(contract: IContract): string {
        let importStatements: string[] = [];

        const importEntitiesList = new Array<{
            entityName: string;
            path: string;
        }>();

        contract.fields?.forEach((field: any) => {
            if (field.link && field.link.length > 0) {
                field.link.forEach((link) => {
                    if (link.contract) {
                        try {
                            const contractInstance = new link.contract();
                            const controllerName = Reflect.getMetadata(
                                CONTROLLER_NAME_METADATA,
                                contractInstance.constructor,
                            );
                            const entityName = controllerName;
                            const entityFileName = `${entityName.toLowerCase()}.model`;
                            let importPath;

                            if (contractInstance.subPath) {
                                importPath = `@models${contractInstance.subPath}/${entityFileName}`;
                            } else if (contract.subPath) {
                                importPath = `@models${contract.subPath}/${entityFileName}`;
                            } else {
                                importPath = `@models/${entityFileName}`;
                            }

                            importEntitiesList.push({
                                entityName: `${entityName}`,
                                path: importPath,
                            });
                        } catch (error) {
                            console.error(
                                `Error processing link for contract ${contract.controllerName}:`,
                                error,
                            );
                        }
                    }
                });
            }
        });

        if (importEntitiesList.length > 0) {
            importEntitiesList.forEach((importEntity) => {
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

    private getControllerDecorators(
        { authRouter, rootOnlyRouter = false, contract },
        authRole = 'get',
    ) {
        let decoracotrs = '';

        if (authRouter === true && !rootOnlyRouter)
            decoracotrs += `\n    @Authorized("${contract.controllerName.toLowerCase()}:${authRole}")`;
        else if (authRouter === true && rootOnlyRouter)
            decoracotrs += `\n    @Authorized({ rootOnly: true })`;

        return decoracotrs;
    }

    private generateClassField(field: any): string {
        if (!field) return '';

        const nullable = field.nullable !== false;
        let graphqlType = this.mapToTsTypeUpper(field.protoType);
        let tsType = this.mapToTsType(field.protoType);

        return `    @Field(() => ${graphqlType}, {
                nullable: ${nullable}
            })
            ${field.propertyKey}: ${tsType}`;
    }

    private mapToTsType(protoType: string): string {
        const typeMapping: { [key: string]: string } = {
            string: 'string',
            boolean: 'boolean',
            bool: 'boolean',
            number: 'number',
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

    private mapToTsTypeUpper(protoType: string) {
        const type = this.mapToTsType(protoType);

        switch (type) {
            case 'any':
                return 'Any';
            case 'int':
            case 'int32':
            case 'float':
            case 'number':
                return 'Number';
            case 'string':
                return 'String';
            case 'boolean':
                return 'Boolean';
            case 'Uint8Array':
                return 'Uint8Array';
            case 'simpleArray':
                return 'Array<any>';
        }
    }

    private getGraphQLMethodType(httpMethod: string): string {
        const method = httpMethod.toUpperCase();
        if (['GET'].includes(method)) {
            return 'Query';
        }
        return 'Mutation';
    }

    private getContractSubPath(contract): string {
        if (contract.subPath) {
            return contract.subPath;
        }

        try {
            const subPath = Reflect.getMetadata(
                SUB_PATH_METADATA,
                contract.constructor,
            );
            return subPath || '';
        } catch {
            return '';
        }
    }

    private formatSubPath(subPath: string): string {
        if (!subPath) return '';

        return subPath.startsWith('/') ? subPath : `/${subPath}`;
    }

    private generateCustomDTOArgsClasses(contract: IContract): string {
        if (!contract.messages || contract.messages.length === 0) {
            return '';
        }

        const usedAsInputs = new Set<string>();

        if (contract.services) {
            contract.services.forEach((service) => {
                if (service.request && service.request !== 'void') {
                    usedAsInputs.add(service.request);
                }
            });
        }

        const inputDTOs = contract.messages.filter((message) =>
            usedAsInputs.has(message.name),
        );

        if (inputDTOs.length === 0) {
            return '';
        }

        return inputDTOs
            .map((message) => {
                const properties = Object.entries(message.properties || {})
                    .map(([fieldName, field]: [string, any]) => {
                        let fieldType = this.mapTypeToGraphQL(field.type);
                        let isArray = false;
                        let actualType = this.mapToTsType(field.type);

                        if (field.type === 'simpleArray' || field.arrayType) {
                            isArray = true;

                            if (field.arrayType) {
                                fieldType = this.mapTypeToGraphQL(
                                    field.arrayType,
                                );
                                actualType = `${this.mapToTsType(field.arrayType)}[]`;
                            } else {
                                fieldType = 'String';
                                actualType = 'string[]';
                            }
                        }

                        const nullable = field.required === false;

                        let fieldDecorator;
                        if (isArray) {
                            fieldDecorator = `@Field(() => [${fieldType}], {
            description: "${message.name} ${fieldName} field",
            nullable: ${nullable}
        })`;
                        } else if (
                            field.type === 'any' ||
                            field.type === 'json' ||
                            field.type === 'jsonb'
                        ) {
                            fieldDecorator = `@Field(() => GraphQLJSON, {
            description: "${message.name} ${fieldName} field",
            nullable: ${nullable}
        })`;
                            actualType = 'any';
                        } else {
                            fieldDecorator = `@Field(() => ${fieldType}, {
            description: "${message.name} ${fieldName} field",
            nullable: ${nullable}
        })`;
                        }

                        return `    ${fieldDecorator}
        ${fieldName}${nullable ? '?' : ''}: ${actualType};`;
                    })
                    .join('\n\n');

                return `@ArgsType()
export class ${message.name}Args {
${properties}
}`;
            })
            .join('\n\n');
    }

    private generateCustomArgsClasses(contract: IContract): string {
        if (!contract.services || contract.services.length === 0) {
            return '';
        }

        const argsClasses = new Set<string>();

        if (contract.services) {
            contract.services.forEach((service) => {
                let className = '';

                if (
                    service.request &&
                    service.request !== 'void' &&
                    service.request !== ''
                ) {
                    className = `${service.request}Args`;
                } else {
                    className = `${service.name}Args`;
                }

                if (
                    Array.from(argsClasses).some((c) =>
                        c.includes(`class ${className}`),
                    )
                )
                    return;

                const requestMessage = service.request
                    ? this.findMessageByName(contract.messages, service.request)
                    : null;

                if (!requestMessage) {
                    if (className === 'GroupGetInQueryArgs') {
                        argsClasses.add(`@ArgsType()
export class GroupGetInQueryArgs {
    @Field(() => [ID], { description: "Array of group IDs" })
    ids!: string[];
}`);
                    } else {
                        argsClasses.add(`@ArgsType()
export class ${className} {
    // Auto-generated empty args class for ${service.functionName}
}`);
                    }
                } else {
                    const fields = Object.entries(
                        requestMessage.properties || {},
                    )
                        .map(([fieldName, field]: [string, any]) => {
                            let graphqlType = this.mapTypeToGraphQL(field.type);
                            let tsType = this.mapToTsType(field.type);
                            const nullable = field.required === false;

                            const isArray =
                                field.type === 'simpleArray' ||
                                field.arrayType ||
                                (field.type &&
                                    (field.type.includes('[]') ||
                                        field.type.startsWith('Array<')));

                            if (
                                fieldName === 'id' ||
                                fieldName.endsWith('Id') ||
                                fieldName.includes('_id')
                            ) {
                                graphqlType = 'ID';
                            }

                            let fieldDecorator;
                            if (isArray) {
                                const elementType = field.arrayType
                                    ? this.mapTypeToGraphQL(field.arrayType)
                                    : fieldName === 'ids' ||
                                        fieldName.endsWith('Ids')
                                      ? 'ID'
                                      : 'String';

                                fieldDecorator = `@Field(() => [${elementType}], {
            description: "${className} ${fieldName} field",
            nullable: ${nullable}
        })`;

                                tsType = `${this.mapToTsType(field.arrayType || 'string')}[]`;
                            } else if (
                                field.type === 'any' ||
                                field.type === 'json' ||
                                field.type === 'jsonb'
                            ) {
                                fieldDecorator = `@Field(() => GraphQLJSON, {
            description: "${className} ${fieldName} field",
            nullable: ${nullable}
        })`;
                                tsType = 'any';
                            } else {
                                fieldDecorator = `@Field(() => ${graphqlType}, {
            description: "${className} ${fieldName} field",
            nullable: ${nullable}
        })`;
                            }

                            return `    ${fieldDecorator}
    ${fieldName}${nullable ? '?' : '!'}: ${tsType};`;
                        })
                        .join('\n\n');

                    argsClasses.add(`@ArgsType()
export class ${className} {
${fields}
}`);
                }
            });
        }

        this.ensureCommonArgsClasses(argsClasses);

        return Array.from(argsClasses).join('\n\n');
    }

    private ensureCommonArgsClasses(argsClasses: Set<string>): void {
        if (
            !Array.from(argsClasses).some((c) =>
                c.includes('class GroupGetInQueryArgs'),
            )
        ) {
            argsClasses.add(`@ArgsType()
export class GroupGetInQueryArgs {
    @Field(() => [ID], { description: "Array of group IDs" })
    ids!: string[];
}`);
        }
    }

    private async checkForMissingArgs(
        filePath: string,
        contract: IContract,
    ): Promise<void> {
        try {
            let content = fs.readFileSync(filePath, 'utf8');
            let wasUpdated = false;

            if (contract.services) {
                for (const service of contract.services) {
                    let argsClassName = '';

                    if (
                        service.request &&
                        service.request !== 'void' &&
                        service.request !== ''
                    ) {
                        argsClassName = `${service.request}Args`;
                    } else {
                        argsClassName = `${service.name}Args`;
                    }

                    if (!content.includes(`export class ${argsClassName}`)) {
                        const argsClass = `
@ArgsType()
export class ${argsClassName} {
    // Auto-added missing args class for ${service.functionName}
}`;

                        content = content.replace(
                            /(@Resolver\(of =>)/,
                            argsClass + '\n\n$1',
                        );
                        wasUpdated = true;
                    }
                }
            }

            const methodMatches = [
                ...content.matchAll(
                    /@(Query|Mutation)\([^)]*\)\s*[^@]*?async\s+([a-zA-Z0-9_]+)\s*\(\s*@Args\(\)\s+([a-zA-Z0-9_]+)Args:/g,
                ),
            ];

            for (const match of methodMatches) {
                const [fullMatch, , methodName, argsName] = match;

                if (!fullMatch.includes('@Args(() =>')) {
                    const updatedContent = fullMatch.replace(
                        `@Args() ${argsName}Args:`,
                        `@Args(() => ${argsName}Args) ${argsName}Args:`,
                    );

                    content = content.replace(fullMatch, updatedContent);
                    wasUpdated = true;
                }
            }

            if (wasUpdated) {
                fs.writeFileSync(filePath, content, 'utf8');
            }
        } catch (error) {
            console.error(
                `Error checking for missing Args in ${filePath}:`,
                error,
            );
        }
    }

    private async removeDuplicateArgsClasses(filePath: string): Promise<void> {
        try {
            let content = fs.readFileSync(filePath, 'utf8');
            let updated = false;

            const classMatches = [
                ...content.matchAll(
                    /@ArgsType\(\)\s*export\s+class\s+([a-zA-Z0-9_]+)/g,
                ),
            ];

            const classNames = new Set<string>();
            const duplicates = new Set<string>();

            classMatches.forEach((match) => {
                const className = match[1];
                if (classNames.has(className)) {
                    duplicates.add(className);
                } else {
                    classNames.add(className);
                }
            });

            if (duplicates.size > 0) {
                for (const className of duplicates) {
                    const pattern = new RegExp(
                        `@ArgsType\\(\\)\\s*export\\s+class\\s+${className}[\\s\\S]*?\\n}`,
                        'g',
                    );
                    const matches = [...content.matchAll(pattern)];

                    if (matches.length > 1) {
                        const firstMatch = matches[0][0];
                        const newContent = content.replace(firstMatch, '');

                        if (newContent !== content) {
                            content = newContent;
                            updated = true;
                        }
                    }
                }

                if (updated) {
                    fs.writeFileSync(filePath, content, 'utf8');
                }
            }
        } catch (error) {
            console.error(
                `Error removing duplicate Args classes in ${filePath}:`,
                error,
            );
        }
    }

    private validateResolverSyntax(filePath: string): void {
        try {
            let content = fs.readFileSync(filePath, 'utf8');
            let updated = false;

            if (!content.trim().endsWith('}')) {
                content += '\n}';
                updated = true;
            }

            const argsErrors = content.match(
                /@Args\(\) ([a-zA-Z0-9_]+)Args: ([a-zA-Z0-9_]+)Args/g,
            );
            if (argsErrors) {
                for (const match of argsErrors) {
                    const [_, varName, typeName] =
                        match.match(
                            /@Args\(\) ([a-zA-Z0-9_]+)Args: ([a-zA-Z0-9_]+)Args/,
                        ) || [];

                    if (varName && typeName && varName !== typeName) {
                        const fixed = match.replace(
                            `${varName}Args: ${typeName}Args`,
                            `${varName}Args: ${varName}Args`,
                        );
                        content = content.replace(match, fixed);
                        updated = true;
                    }
                }
            }

            const openBraces = (content.match(/\{/g) || []).length;
            const closeBraces = (content.match(/\}/g) || []).length;

            if (openBraces !== closeBraces) {
                if (openBraces > closeBraces) {
                    const diff = openBraces - closeBraces;
                    content += '\n' + '}'.repeat(diff);
                    updated = true;
                }
            }

            if (updated) {
                fs.writeFileSync(filePath, content, 'utf8');
            }
        } catch (error) {
            console.error(
                `Error validating resolver syntax in ${filePath}:`,
                error,
            );
        }
    }

    async validateGraphQLTypes(outputFilePath: string): Promise<void> {
        try {
            let fileContent = fs.readFileSync(outputFilePath, 'utf8');
            let needsUpdate = false;

            const classDuplicates = fileContent.match(
                /export class ([a-zA-Z0-9_]+)[\s\S]*?export class \1/g,
            );
            if (classDuplicates && classDuplicates.length > 0) {
                needsUpdate = true;
            }

            const argsWithDTO = fileContent.match(
                /@Args\(\)[^:]*:\s*[^A]*DTO/g,
            );
            if (argsWithDTO && argsWithDTO.length > 0) {
                fileContent = fileContent.replace(
                    /(@Args\(\)[^:]*:\s*)([^A]*DTO)/g,
                    (match, p1, p2) => {
                        const correctedType = p2.replace('DTO', 'Args');
                        return `${p1}${correctedType}`;
                    },
                );
                needsUpdate = true;
            }

            if (needsUpdate) {
                fs.writeFileSync(outputFilePath, fileContent, 'utf8');
            }
        } catch (error) {
            console.error(
                `Error validating generated GraphQL file: ${outputFilePath}`,
                error,
            );
        }
    }

    private prepareCustomServices(contract: IContract): {
        imports: string;
        properties: string;
        initializations: string;
        serviceMethodMap: Map<string, string>;
    } {
        const customServices = new Map<
            string,
            { module: string; name: string }
        >();
        const serviceMethodMap = new Map<string, string>();

        if (contract.services && contract.services.length > 0) {
            contract.services.forEach((service) => {
                if (service.module && service.serviceName) {
                    customServices.set(service.serviceName, {
                        module: service.module,
                        name: service.serviceName,
                    });

                    const serviceName = service.serviceName;
                    const varName =
                        serviceName.charAt(0).toLowerCase() +
                        serviceName.slice(1);
                    serviceMethodMap.set(service.functionName, varName);
                }
            });
        }

        let imports = '';
        if (customServices.size > 0) {
            imports = Array.from(customServices.entries())
                .map(([serviceName, info]) => {
                    return `import { ${info.name} } from "${info.module}";`;
                })
                .join('\n');
        }

        let properties = '';
        if (customServices.size > 0) {
            properties = Array.from(customServices.values())
                .map((info) => {
                    const varName =
                        info.name.charAt(0).toLowerCase() + info.name.slice(1);
                    return `    private readonly ${varName}: ${info.name};`;
                })
                .join('\n');
        }

        let initializations = '';
        if (customServices.size > 0) {
            initializations = Array.from(customServices.values())
                .map((info) => {
                    const varName =
                        info.name.charAt(0).toLowerCase() + info.name.slice(1);
                    return `        this.${varName} = Application.resolveProvider(${info.name});`;
                })
                .join('\n');
        }

        return { imports, properties, initializations, serviceMethodMap };
    }

    private generateCustomMethods(
        contract: IContract,
        serviceMethodMap: Map<string, string>,
        serviceName: string,
        entityName: string,
        authRouter: boolean,
        rootOnlyRouter: boolean,
    ): string {
        if (!contract.services || contract.services.length === 0) return '';

        const methods = contract.services
            .map((service) => {
                const methodType = this.getGraphQLMethodType(service.method);
                const authDecorator = this.getControllerDecorators(
                    {
                        authRouter: service.auth || authRouter,
                        rootOnlyRouter,
                        contract,
                    },
                    service.functionName,
                );

                const targetService =
                    serviceMethodMap.get(service.functionName) ||
                    (service.module && service.serviceName
                        ? service.serviceName.charAt(0).toLowerCase() +
                          service.serviceName.slice(1)
                        : serviceName.toLowerCase());

                let paramsCode = '';
                let serviceCallParams = 'ctx.req';
                let argsClassName = '';

                if (service.request && service.request !== 'void') {
                    argsClassName = `${service.request}Args`;
                } else if (service.request === '') {
                    argsClassName = `${service.name}Args`;
                } else {
                    argsClassName = `${service.name}Args`;
                }

                paramsCode = `@Args(() => ${argsClassName}) ${service.functionName}Args: ${argsClassName}, `;
                serviceCallParams = `${service.functionName}Args, ctx.req`;

                return `
    @${methodType}(returns => GraphQLJSON)${authDecorator}
    async ${service.functionName}(
        ${paramsCode}@Ctx() ctx: GraphQLContext
    ): Promise<any> {
        return await this.${targetService}.${service.functionName}(${serviceCallParams});
    }`;
            })
            .join('\n');

        return methods;
    }
}
