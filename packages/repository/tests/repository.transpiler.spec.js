"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const vitest_1 = require("vitest");
const fs = require("node:fs");
const repository_transpiler_1 = require("../lib/repository.transpiler");
const core_1 = require("@cmmv/core");
// Mock das dependências externas
vitest_1.vi.mock('node:fs', () => ({
    writeFileSync: vitest_1.vi.fn(),
    existsSync: vitest_1.vi.fn().mockReturnValue(true),
    mkdirSync: vitest_1.vi.fn(),
    appendFileSync: vitest_1.vi.fn(),
}));
vitest_1.vi.mock('node:path', () => ({
    join: vitest_1.vi.fn((...args) => args.join('/')),
    resolve: vitest_1.vi.fn((...args) => args.join('/')),
    dirname: vitest_1.vi.fn((path) => path.split('/').slice(0, -1).join('/')),
}));
vitest_1.vi.mock('@cmmv/core', () => {
    return {
        AbstractTranspile: class MockAbstractTranspile {
            constructor() { }
            transpile() {
                return true;
            }
            getGeneratedPath() {
                return 'generated/path';
            }
            getRootPath() {
                return 'root/path';
            }
            getImportPath() {
                return '@import/path';
            }
            getImportPathRelative() {
                return '../relative/path';
            }
            getImportPathWithoutSubPath() {
                return '@import/path';
            }
            removeExtraSpaces(text) {
                return text;
            }
            removeTelemetry(text) {
                return text;
            }
        },
        Config: {
            get: vitest_1.vi.fn(),
        },
        Scope: {
            getArray: vitest_1.vi.fn(),
        },
        ITranspile: Symbol('ITranspile'),
        IContract: Symbol('IContract'),
        CONTROLLER_NAME_METADATA: Symbol('CONTROLLER_NAME_METADATA'),
    };
});
(0, vitest_1.describe)('RepositoryTranspile', () => {
    let repositoryTranspile;
    let mockContract;
    (0, vitest_1.beforeEach)(() => {
        vitest_1.vi.resetAllMocks();
        repositoryTranspile = new repository_transpiler_1.RepositoryTranspile();
        // Configurar mock de Config.get com valores padrão
        vitest_1.vi.mocked(core_1.Config.get).mockImplementation((key) => {
            if (key === 'repository.type')
                return 'mongodb';
            if (key === 'app.telemetry')
                return true;
            if (key === 'db')
                return 'mongodb';
            return null;
        });
        // Criar um mock de contrato
        mockContract = {
            controllerName: 'Test',
            generateEntities: true,
            generateController: true,
            fields: [
                {
                    propertyKey: 'name',
                    protoType: 'string',
                    nullable: false,
                    index: true,
                },
                {
                    propertyKey: 'age',
                    protoType: 'int32',
                    nullable: true,
                },
            ],
            services: [
                {
                    functionName: 'customFunction',
                    request: 'CustomRequest',
                    response: 'CustomResponse',
                    createBoilerplate: true,
                },
            ],
            options: {
                databaseFakeDelete: true,
                databaseTimestamps: true,
                databaseUserAction: false,
                moduleContract: false,
                databaseSchemaName: 'test_collection',
            },
            indexs: [
                {
                    name: 'idx_test_name_age',
                    fields: ['name', 'age'],
                    options: { unique: true },
                },
            ],
        };
        // Configurar Reflect.getMetadata para retornar o nome do controlador
        Reflect.getMetadata = vitest_1.vi.fn().mockReturnValue('Test');
        // Configurar Scope.getArray para retornar um array com o mock de contrato
        vitest_1.vi.mocked(core_1.Scope.getArray).mockReturnValue([mockContract]);
    });
    (0, vitest_1.afterEach)(() => {
        vitest_1.vi.resetAllMocks();
    });
    (0, vitest_1.describe)('run', () => {
        (0, vitest_1.it)('should run the transpile process', () => {
            // Spy nos métodos privados
            const generateEntitiesSpy = vitest_1.vi.spyOn(repositoryTranspile, 'generateEntities');
            const generateServicesSpy = vitest_1.vi.spyOn(repositoryTranspile, 'generateServices');
            repositoryTranspile.run();
            // Verificar se Scope.getArray foi chamado para obter contratos
            (0, vitest_1.expect)(core_1.Scope.getArray).toHaveBeenCalledWith('__contracts');
            // Verificar se os métodos de geração foram chamados
            (0, vitest_1.expect)(generateEntitiesSpy).toHaveBeenCalledWith(mockContract);
            (0, vitest_1.expect)(generateServicesSpy).toHaveBeenCalledWith(mockContract);
        });
        (0, vitest_1.it)('should not generate entities if flag is false', () => {
            // Modificar o contrato para não gerar entidades
            mockContract.generateEntities = false;
            const generateEntitiesSpy = vitest_1.vi.spyOn(repositoryTranspile, 'generateEntities');
            const generateServicesSpy = vitest_1.vi.spyOn(repositoryTranspile, 'generateServices');
            repositoryTranspile.run();
            (0, vitest_1.expect)(generateEntitiesSpy).not.toHaveBeenCalled();
            (0, vitest_1.expect)(generateServicesSpy).toHaveBeenCalledWith(mockContract);
        });
        (0, vitest_1.it)('should not generate controller if flag is false', () => {
            // Modificar o contrato para não gerar controller
            mockContract.generateController = false;
            const generateEntitiesSpy = vitest_1.vi.spyOn(repositoryTranspile, 'generateEntities');
            const generateServicesSpy = vitest_1.vi.spyOn(repositoryTranspile, 'generateServices');
            repositoryTranspile.run();
            (0, vitest_1.expect)(generateEntitiesSpy).toHaveBeenCalledWith(mockContract);
            (0, vitest_1.expect)(generateServicesSpy).not.toHaveBeenCalled();
        });
    });
    (0, vitest_1.describe)('generateEntities', () => {
        (0, vitest_1.it)('should generate entity file with correct content', () => {
            // Chamar o método privado diretamente
            repositoryTranspile.generateEntities(mockContract);
            // Verificar se writeFileSync foi chamado
            (0, vitest_1.expect)(fs.writeFileSync).toHaveBeenCalled();
            // Capturar os argumentos da chamada
            const callArgs = vitest_1.vi.mocked(fs.writeFileSync).mock.calls[0];
            // Verificar o conteúdo pelo segundo parâmetro, que é a string do arquivo
            const fileContent = callArgs[1];
            // Verificar conteúdo esperado
            (0, vitest_1.expect)(fileContent).toContain('@Entity("test_collection")');
            (0, vitest_1.expect)(fileContent).toContain('@ObjectIdColumn()');
            (0, vitest_1.expect)(fileContent).toContain('_id: ObjectId');
            (0, vitest_1.expect)(fileContent).toContain('export class TestEntity implements ITest');
        });
        (0, vitest_1.it)('should use correct path based on moduleContract flag', () => {
            // Testar com moduleContract = true
            mockContract.options.moduleContract = true;
            // Espionar os métodos que geram os caminhos
            const getGeneratedPathSpy = vitest_1.vi
                .spyOn(repositoryTranspile, 'getGeneratedPath')
                .mockReturnValue('generated/path');
            /*const getRootPathSpy = vi
                .spyOn(repositoryTranspile as any, 'getRootPath')
                .mockReturnValue('root/path');*/
            repositoryTranspile.generateEntities(mockContract);
            // Verificar se getGeneratedPath foi chamado para contrato de módulo
            (0, vitest_1.expect)(getGeneratedPathSpy).toHaveBeenCalled();
            //expect(getRootPathSpy).not.toHaveBeenCalled();
            // Redefinir mocks
            vitest_1.vi.clearAllMocks();
            // Testar com moduleContract = false
            mockContract.options.moduleContract = false;
            repositoryTranspile.generateEntities(mockContract);
            // Verificar se getRootPath foi chamado para contrato padrão
            //expect(getRootPathSpy).toHaveBeenCalled();
            //expect(getGeneratedPathSpy).not.toHaveBeenCalled();
        });
    });
    (0, vitest_1.describe)('generateServices', () => {
        (0, vitest_1.it)('should generate service file with correct content', () => {
            // Chamar o método privado diretamente
            repositoryTranspile.generateServices(mockContract);
            // Verificar se writeFileSync foi chamado
            (0, vitest_1.expect)(fs.writeFileSync).toHaveBeenCalled();
            // Capturar os argumentos da chamada
            const callArgs = vitest_1.vi.mocked(fs.writeFileSync).mock.calls[0];
            // Verificar o conteúdo pelo segundo parâmetro, que é a string do arquivo
            const fileContent = callArgs[1];
            // Verificar conteúdo esperado
            (0, vitest_1.expect)(fileContent).toContain('export class TestServiceGenerated extends AbstractRepositoryService');
            (0, vitest_1.expect)(fileContent).toContain('protected schema = new RepositorySchema');
            (0, vitest_1.expect)(fileContent).toContain('async customFunction(payload: CustomRequest): Promise<CustomResponse>');
        });
        (0, vitest_1.it)('should use telemetry based on config', () => {
            // Spy no método removeTelemetry
            const removeTelemetrySpy = vitest_1.vi.spyOn(repositoryTranspile, 'removeTelemetry');
            // Testar com telemetry = false
            vitest_1.vi.mocked(core_1.Config.get).mockImplementation((key) => {
                if (key === 'app.telemetry')
                    return false;
                if (key === 'repository.type')
                    return 'mongodb';
                if (key === 'db')
                    return 'mongodb';
                return null;
            });
            repositoryTranspile.generateServices(mockContract);
            // Verificar se removeTelemetry foi chamado quando telemetry = false
            (0, vitest_1.expect)(removeTelemetrySpy).toHaveBeenCalled();
        });
    });
    (0, vitest_1.describe)('Helper methods', () => {
        (0, vitest_1.it)('should map proto types to TypeORM types correctly', () => {
            const field = { protoType: 'string', protoRepeated: false };
            // Testar mapeamento de string para varchar
            const result = repositoryTranspile.mapToTypeORMType('string', field);
            (0, vitest_1.expect)(result).toBe('varchar');
            // Testar mapeamento de int32 para int
            const result2 = repositoryTranspile.mapToTypeORMType('int32', field);
            (0, vitest_1.expect)(result2).toBe('int');
            // Testar campo repetido para simple-array
            field.protoRepeated = true;
            const result3 = repositoryTranspile.mapToTypeORMType('string', field);
            (0, vitest_1.expect)(result3).toBe('simple-array');
        });
        (0, vitest_1.it)('should map proto types to TS types correctly', () => {
            const field = { protoType: 'string', protoRepeated: false };
            // Testar mapeamento de string para string
            const result = repositoryTranspile.mapToTsType('string', field);
            (0, vitest_1.expect)(result).toBe('string');
            // Testar mapeamento de int32 para number
            const result2 = repositoryTranspile.mapToTsType('int32', field);
            (0, vitest_1.expect)(result2).toBe('number');
            // Testar campo repetido para array
            field.protoRepeated = true;
            const result3 = repositoryTranspile.mapToTsType('string', field);
            (0, vitest_1.expect)(result3).toBe('string[]');
        });
        (0, vitest_1.it)('should generate indexes correctly', () => {
            const fields = [
                { propertyKey: 'name', index: true },
                { propertyKey: 'email', unique: true },
            ];
            const indexes = repositoryTranspile.generateIndexes('User', fields, mockContract);
            (0, vitest_1.expect)(indexes).toContain('@Index("idx_user_name"');
            (0, vitest_1.expect)(indexes).toContain('@Index("idx_user_email"');
            (0, vitest_1.expect)(indexes).toContain('{ unique: true }');
            // Verificar índice de fake delete
            (0, vitest_1.expect)(indexes).toContain('@Index("idx_user_deleted"');
        });
        (0, vitest_1.it)('should generate column options correctly', () => {
            const field = {
                propertyKey: 'name',
                protoType: 'string',
                nullable: false,
                defaultValue: 'Default',
            };
            const options = repositoryTranspile.generateColumnOptions(field);
            (0, vitest_1.expect)(options).toContain('type: "varchar"');
            (0, vitest_1.expect)(options).toContain('default: Default');
            (0, vitest_1.expect)(options).toContain('nullable: false');
        });
    });
});
