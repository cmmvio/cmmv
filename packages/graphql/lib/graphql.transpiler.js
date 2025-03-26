"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.GraphQLTranspile = void 0;
const fs = require("node:fs");
const path = require("node:path");
const node_process_1 = require("node:process");
const fg = require("fast-glob");
const type_graphql_1 = require("type-graphql");
const core_1 = require("@cmmv/core");
const auth_checker_1 = require("./auth-checker");
class GraphQLTranspile extends core_1.AbstractTranspile {
    constructor() {
        super(...arguments);
        this.resolvers = new Map();
    }
    async run() {
        const contracts = core_1.Scope.getArray('__contracts');
        const sourceDir = core_1.Config.get('app.sourceDir', 'src');
        const generateResolvers = core_1.Config.get('graphql.generateResolvers', true);
        const resolversDir = path.join((0, node_process_1.cwd)(), sourceDir, 'resolvers');
        const resolversGeneratedDir = path.join((0, node_process_1.cwd)(), '.generated', 'resolvers');
        const schemaFilename = path.join((0, node_process_1.cwd)(), '.generated', 'schema.graphql');
        contracts?.forEach((contract) => {
            if (contract.generateEntities &&
                contract.generateController &&
                generateResolvers)
                this.generateResolvers(contract);
        });
        const resolversFiles = await fg([
            `${resolversDir}/**/*.resolver.ts`,
            `${resolversGeneratedDir}/**/*.resolver.ts`,
        ]);
        let resolvers = await Promise.all(resolversFiles.map(async (file) => {
            const resolverModule = await Promise.resolve(`${file}`).then(s => require(s));
            const resolverContructor = Object.values(resolverModule)[0];
            this.resolvers.set(
            //@ts-ignore
            resolverContructor.name, resolverContructor);
            return resolverContructor;
        }));
        const modulesResolvers = core_1.Application.getResolvers();
        resolvers.push(...modulesResolvers);
        if (Array.isArray(resolvers) && resolvers.length > 0) {
            await (0, type_graphql_1.buildSchema)({
                //@ts-ignore
                resolvers,
                authChecker: auth_checker_1.authChecker,
                emitSchemaFile: schemaFilename,
            });
        }
    }
    generateResolvers(contract) {
        const entityName = contract.controllerName;
        const resolverName = `${contract.controllerName}Resolver`;
        const modelName = `${contract.controllerName}.Model`;
        const serviceName = `${contract.controllerName}Service`;
        const resolverFileName = `${contract.controllerName.toLowerCase()}.resolver.ts`;
        let resolvers = [];
        const authRouter = contract.auth === true;
        const rootOnlyRouter = contract.rootOnly === true;
        const findOptions = resolvers.length > 0
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
            ?.map((field) => this.generateClassField(field))
            .filter((item) => item)
            .join('\n\n')}
}

@ArgsType()
class Update${entityName}Input {
    @Field(() => ID)
    id: string;

${contract.fields
            ?.map((field) => this.generateClassField(field))
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
        const outputDir = this.getGeneratedPath(contract, 'resolvers');
        const outputFilePath = path.join(outputDir, resolverFileName);
        fs.writeFileSync(outputFilePath, resolverTemplate, 'utf8');
    }
    generateClassImports(contract) {
        let importStatements = [];
        const importEntitiesList = new Array();
        contract.fields?.forEach((field) => {
            if (field.link && field.link.length > 0) {
                field.link.map((link) => {
                    if (link.contract) {
                        const contractInstance = new link.contract();
                        const controllerName = Reflect.getMetadata(core_1.CONTROLLER_NAME_METADATA, contractInstance.constructor);
                        const entityName = controllerName;
                        const entityFileName = `${entityName.toLowerCase()}.model`;
                        importEntitiesList.push({
                            entityName: `${entityName}`,
                            path: this.getImportPathRelative(contractInstance, contract, 'models', entityFileName, '@models'),
                        });
                    }
                });
            }
        });
        if (importEntitiesList.length > 0) {
            importEntitiesList.map((importEntity) => {
                importStatements.push(`import {
    ${importEntity.entityName}
} from "${importEntity.path}"; \n`);
            });
        }
        importStatements = [...new Set(importStatements)];
        return importStatements.length > 0 ? importStatements.join('\n') : '';
    }
    getControllerDecorators({ authRouter, rootOnlyRouter = false, contract }, authRole = 'get') {
        let decoracotrs = '';
        if (authRouter === true && !rootOnlyRouter)
            decoracotrs += `\n    @Authorized("${contract.controllerName.toLowerCase()}:${authRole}")`;
        else if (authRouter === true && rootOnlyRouter)
            decoracotrs += `\n    @Authorized({ rootOnly: true })`;
        return decoracotrs;
    }
    generateClassField(field) {
        const decorators = [];
        let optional = field.nullable ? '?' : '';
        const defaultValue = field.defaultValue !== undefined
            ? typeof field.defaultValue === 'string'
                ? `"${field.defaultValue}"`
                : field.defaultValue
            : null;
        const fieldType = field.modelName
            ? field.modelName
            : this.mapToTsTypeUpper(field.protoType);
        const apiType = field.protoRepeated || field.array
            ? `[${fieldType}]`
            : `${fieldType}`;
        //GraphQL
        if (!field.exclude && !field.readOnly) {
            if (defaultValue) {
                decorators.push(`    @Field(() => ${apiType}, {
        nullable: ${field.nullable === true ? 'true' : 'false'},
        defaultValue: ${defaultValue}
    })`);
            }
            else {
                decorators.push(`    @Field(() => ${apiType}, {
        nullable: ${field.nullable === true ? 'true' : 'false'}
    })`);
            }
            return `${decorators.length > 0 ? decorators.join('\n') + '\n' : ''}    ${field.propertyKey}${optional}: ${fieldType}`;
        }
        return null;
    }
    mapToTsType(protoType) {
        const typeMapping = {
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
    mapToTsTypeUpper(protoType) {
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
exports.GraphQLTranspile = GraphQLTranspile;
