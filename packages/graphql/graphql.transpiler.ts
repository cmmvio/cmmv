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
} from '@cmmv/core';

import { authChecker } from './auth-checker';

export class GraphQLTranspile extends AbstractTranspile implements ITranspile {
    public resolvers = new Map<string, any>();

    async run(): Promise<void> {
        const contracts = Scope.getArray<any>('__contracts');
        const sourceDir = Config.get<string>('app.sourceDir', 'src');
        const resolversDir = path.join(cwd(), sourceDir, 'resolvers');
        const resolversGeneratedDir = path.join(
            cwd(),
            '.generated',
            'resolvers',
        );
        const schemaFilename = path.join(cwd(), '.generated', 'schema.graphql');

        contracts?.forEach((contract: IContract) => {
            if (contract.generateEntities && contract.generateController)
                this.generateResolvers(contract);
        });

        const resolversFiles = await fg([
            `${resolversDir}/**/*.resolver.ts`,
            `${resolversGeneratedDir}/**/*.resolver.ts`,
        ]);

        let resolvers = await Promise.all(
            resolversFiles.map(async (file) => {
                const resolverModule = await import(file);
                const resolverContructor = Object.values(resolverModule)[0];
                this.resolvers.set(
                    //@ts-ignore
                    resolverContructor.name,
                    resolverContructor,
                );
                return resolverContructor;
            }),
        );

        const modulesResolvers = Application.getResolvers();
        resolvers.push(...modulesResolvers);

        if (Array.isArray(resolvers) && resolvers.length > 0) {
            await buildSchema({
                //@ts-ignore
                resolvers,
                authChecker,
                emitSchemaFile: schemaFilename,
            });
        }
    }

    private generateResolvers(contract: IContract): void {
        const entityName = contract.controllerName;
        const resolverName = `${contract.controllerName}Resolver`;
        const modelName = `${contract.controllerName}.Model`;
        const serviceName = `${contract.controllerName}Service`;
        const resolverFileName = `${contract.controllerName.toLowerCase()}.resolver.ts`;
        const isModuleContract = contract.options?.moduleContract === true;
        let resolvers = [];

        const authRouter = contract.auth === true;
        const rootOnlyRouter = contract.rootOnly === true;

        const findOptions =
            resolvers.length > 0
                ? `, { resolvers: ["${resolvers.join('","')}"] }`
                : '';

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

import {
    I${entityName}, ${entityName}
} from "${this.getImportPath(contract, 'models', modelName.toLowerCase(), '@models')}";

${this.generateClassImports(contract)}
import {
   ${serviceName}
} from "${this.getImportPath(contract, 'services', contract.controllerName.toLowerCase() + '.service', '@services')}";

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
        description: "List of user records for the current page.",
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

    constructor() {
        this.${serviceName.toLowerCase()} = new ${serviceName}();
    }

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

    @Mutation(returns => ${entityName})${this.getControllerDecorators({ authRouter, rootOnlyRouter, contract }, 'insert')}
    async create${entityName}(@Args() create${entityName}Data: Create${entityName}Input): Promise<${entityName}> {
        return (await this.${serviceName.toLowerCase()}.insert(create${entityName}Data as Partial<${entityName}>)).data;
    }

    @Mutation(returns => Boolean)${this.getControllerDecorators({ authRouter, rootOnlyRouter, contract }, 'update')}
    async update${entityName}(@Args() update${entityName}Data: Update${entityName}Input): Promise<Boolean> {
        return (await this.${serviceName.toLowerCase()}.update(update${entityName}Data.id, update${entityName}Data as Partial<${entityName}>)).success;
    }

    @Mutation(returns => Boolean)${this.getControllerDecorators({ authRouter, rootOnlyRouter, contract }, 'delete')}
    async delete${entityName}(@Arg('id') id: string): Promise<boolean> {
        return (await this.${serviceName.toLowerCase()}.delete(id)).success;
    }
}`;

        const outputDir = isModuleContract
            ? this.getGeneratedPath(contract, 'resolvers')
            : this.getRootPath(contract, 'resolvers');
        const outputFilePath = path.join(outputDir, resolverFileName);
        fs.writeFileSync(outputFilePath, resolverTemplate, 'utf8');
    }

    private generateClassImports(contract: IContract): string {
        let importStatements: string[] = [];

        const importEntitiesList = new Array<{
            entityName: string;
            path: string;
        }>();

        contract.fields?.forEach((field: any) => {
            if (field.link && field.link.length > 0) {
                field.link.map((link) => {
                    if (link.contract) {
                        const contractInstance = new link.contract();
                        const controllerName = Reflect.getMetadata(
                            CONTROLLER_NAME_METADATA,
                            contractInstance.constructor,
                        );
                        const entityName = controllerName;
                        const entityFileName = `${entityName.toLowerCase()}.model`;

                        importEntitiesList.push({
                            entityName: `${entityName}`,
                            path: this.getImportPathRelative(
                                contractInstance,
                                contract,
                                'models',
                                entityFileName,
                                '@models',
                            ),
                        });
                    }
                });
            }
        });

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
        const decorators: string[] = [];
        let optional = field.nullable ? '?' : '';

        const defaultValue =
            field.defaultValue !== undefined
                ? typeof field.defaultValue === 'string'
                    ? `"${field.defaultValue}"`
                    : field.defaultValue
                : null;

        const fieldType = field.modelName
            ? field.modelName
            : this.mapToTsTypeUpper(field.protoType);

        const apiType =
            field.protoRepeated || field.array
                ? `[${fieldType}]`
                : `${fieldType}`;

        //GraphQL
        if (!field.exclude && !field.readOnly) {
            if (defaultValue) {
                decorators.push(`    @Field(() => ${apiType}, {
        nullable: ${field.nullable === true ? 'true' : 'false'},
        defaultValue: ${defaultValue}
    })`);
            } else {
                decorators.push(`    @Field(() => ${apiType}, {
        nullable: ${field.nullable === true ? 'true' : 'false'}
    })`);
            }

            return `${decorators.length > 0 ? decorators.join('\n') + '\n' : ''}    ${field.propertyKey}${optional}: ${fieldType}`;
        }

        return null;
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
}
