import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import * as fs from 'node:fs';
import * as path from 'node:path';
import { RepositoryTranspile } from '../lib/repository.transpiler';
import { Config, Scope, IContract, CONTROLLER_NAME_METADATA } from '@cmmv/core';

// Mock das dependências externas
vi.mock('node:fs', () => ({
    writeFileSync: vi.fn(),
    existsSync: vi.fn().mockReturnValue(true),
    mkdirSync: vi.fn(),
}));

vi.mock('node:path', () => ({
    join: vi.fn((...args) => args.join('/')),
    resolve: vi.fn((...args) => args.join('/')),
    dirname: vi.fn((path) => path.split('/').slice(0, -1).join('/')),
}));

vi.mock('@cmmv/core', () => {
    return {
        AbstractTranspile: class MockAbstractTranspile {
            constructor() {}
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
            removeExtraSpaces(text: string) {
                return text;
            }
            removeTelemetry(text: string) {
                return text;
            }
        },
        Config: {
            get: vi.fn(),
        },
        Scope: {
            getArray: vi.fn(),
        },
        ITranspile: Symbol('ITranspile'),
        IContract: Symbol('IContract'),
        CONTROLLER_NAME_METADATA: Symbol('CONTROLLER_NAME_METADATA'),
    };
});

describe('RepositoryTranspile', () => {
    let repositoryTranspile: RepositoryTranspile;
    let mockContract: IContract;

    beforeEach(() => {
        vi.resetAllMocks();

        repositoryTranspile = new RepositoryTranspile();

        // Configurar mock de Config.get com valores padrão
        vi.mocked(Config.get).mockImplementation((key) => {
            if (key === 'repository.type') return 'mongodb';
            if (key === 'app.telemetry') return true;
            if (key === 'db') return 'mongodb';
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
        } as unknown as IContract;

        // Configurar Reflect.getMetadata para retornar o nome do controlador
        Reflect.getMetadata = vi.fn().mockReturnValue('Test');

        // Configurar Scope.getArray para retornar um array com o mock de contrato
        vi.mocked(Scope.getArray).mockReturnValue([mockContract]);
    });

    afterEach(() => {
        vi.resetAllMocks();
    });

    describe('run', () => {
        it('should run the transpile process', () => {
            // Spy nos métodos privados
            const generateEntitiesSpy = vi.spyOn(
                repositoryTranspile as any,
                'generateEntities',
            );
            const generateServicesSpy = vi.spyOn(
                repositoryTranspile as any,
                'generateServices',
            );

            repositoryTranspile.run();

            // Verificar se Scope.getArray foi chamado para obter contratos
            expect(Scope.getArray).toHaveBeenCalledWith('__contracts');

            // Verificar se os métodos de geração foram chamados
            expect(generateEntitiesSpy).toHaveBeenCalledWith(mockContract);
            expect(generateServicesSpy).toHaveBeenCalledWith(mockContract);
        });

        it('should not generate entities if flag is false', () => {
            // Modificar o contrato para não gerar entidades
            mockContract.generateEntities = false;

            const generateEntitiesSpy = vi.spyOn(
                repositoryTranspile as any,
                'generateEntities',
            );
            const generateServicesSpy = vi.spyOn(
                repositoryTranspile as any,
                'generateServices',
            );

            repositoryTranspile.run();

            expect(generateEntitiesSpy).not.toHaveBeenCalled();
            expect(generateServicesSpy).toHaveBeenCalledWith(mockContract);
        });

        it('should not generate controller if flag is false', () => {
            // Modificar o contrato para não gerar controller
            mockContract.generateController = false;

            const generateEntitiesSpy = vi.spyOn(
                repositoryTranspile as any,
                'generateEntities',
            );
            const generateServicesSpy = vi.spyOn(
                repositoryTranspile as any,
                'generateServices',
            );

            repositoryTranspile.run();

            expect(generateEntitiesSpy).toHaveBeenCalledWith(mockContract);
            expect(generateServicesSpy).not.toHaveBeenCalled();
        });
    });

    describe('generateEntities', () => {
        it('should generate entity file with correct content', () => {
            // Chamar o método privado diretamente
            (repositoryTranspile as any).generateEntities(mockContract);

            // Verificar se writeFileSync foi chamado
            expect(fs.writeFileSync).toHaveBeenCalled();

            // Capturar os argumentos da chamada
            const callArgs = vi.mocked(fs.writeFileSync).mock.calls[0];

            // Verificar o conteúdo pelo segundo parâmetro, que é a string do arquivo
            const fileContent = callArgs[1] as string;

            // Verificar conteúdo esperado
            expect(fileContent).toContain('@Entity("test_collection")');
            expect(fileContent).toContain('@ObjectIdColumn()');
            expect(fileContent).toContain('_id: ObjectId');
            expect(fileContent).toContain(
                'export class TestEntity implements ITest',
            );
        });

        it('should use correct path based on moduleContract flag', () => {
            // Testar com moduleContract = true
            mockContract.options.moduleContract = true;

            // Espionar os métodos que geram os caminhos
            const getGeneratedPathSpy = vi
                .spyOn(repositoryTranspile as any, 'getGeneratedPath')
                .mockReturnValue('generated/path');
            const getRootPathSpy = vi
                .spyOn(repositoryTranspile as any, 'getRootPath')
                .mockReturnValue('root/path');

            (repositoryTranspile as any).generateEntities(mockContract);

            // Verificar se getGeneratedPath foi chamado para contrato de módulo
            expect(getGeneratedPathSpy).toHaveBeenCalled();
            expect(getRootPathSpy).not.toHaveBeenCalled();

            // Redefinir mocks
            vi.clearAllMocks();

            // Testar com moduleContract = false
            mockContract.options.moduleContract = false;

            (repositoryTranspile as any).generateEntities(mockContract);

            // Verificar se getRootPath foi chamado para contrato padrão
            expect(getRootPathSpy).toHaveBeenCalled();
            expect(getGeneratedPathSpy).not.toHaveBeenCalled();
        });
    });

    describe('generateServices', () => {
        it('should generate service file with correct content', () => {
            // Chamar o método privado diretamente
            (repositoryTranspile as any).generateServices(mockContract);

            // Verificar se writeFileSync foi chamado
            expect(fs.writeFileSync).toHaveBeenCalled();

            // Capturar os argumentos da chamada
            const callArgs = vi.mocked(fs.writeFileSync).mock.calls[0];

            // Verificar o conteúdo pelo segundo parâmetro, que é a string do arquivo
            const fileContent = callArgs[1] as string;

            // Verificar conteúdo esperado
            expect(fileContent).toContain(
                'export class TestServiceGenerated extends AbstractRepositoryService',
            );
            expect(fileContent).toContain(
                'protected schema = new RepositorySchema',
            );
            expect(fileContent).toContain(
                'async customFunction(payload: CustomRequest): Promise<CustomResponse>',
            );
        });

        it('should use telemetry based on config', () => {
            // Spy no método removeTelemetry
            const removeTelemetrySpy = vi.spyOn(
                repositoryTranspile as any,
                'removeTelemetry',
            );

            // Testar com telemetry = false
            vi.mocked(Config.get).mockImplementation((key) => {
                if (key === 'app.telemetry') return false;
                if (key === 'repository.type') return 'mongodb';
                if (key === 'db') return 'mongodb';
                return null;
            });

            (repositoryTranspile as any).generateServices(mockContract);

            // Verificar se removeTelemetry foi chamado quando telemetry = false
            expect(removeTelemetrySpy).toHaveBeenCalled();
        });
    });

    describe('Helper methods', () => {
        it('should map proto types to TypeORM types correctly', () => {
            const field = { protoType: 'string', protoRepeated: false };

            // Testar mapeamento de string para varchar
            const result = (repositoryTranspile as any).mapToTypeORMType(
                'string',
                field,
            );
            expect(result).toBe('varchar');

            // Testar mapeamento de int32 para int
            const result2 = (repositoryTranspile as any).mapToTypeORMType(
                'int32',
                field,
            );
            expect(result2).toBe('int');

            // Testar campo repetido para simple-array
            field.protoRepeated = true;
            const result3 = (repositoryTranspile as any).mapToTypeORMType(
                'string',
                field,
            );
            expect(result3).toBe('simple-array');
        });

        it('should map proto types to TS types correctly', () => {
            const field = { protoType: 'string', protoRepeated: false };

            // Testar mapeamento de string para string
            const result = (repositoryTranspile as any).mapToTsType(
                'string',
                field,
            );
            expect(result).toBe('string');

            // Testar mapeamento de int32 para number
            const result2 = (repositoryTranspile as any).mapToTsType(
                'int32',
                field,
            );
            expect(result2).toBe('number');

            // Testar campo repetido para array
            field.protoRepeated = true;
            const result3 = (repositoryTranspile as any).mapToTsType(
                'string',
                field,
            );
            expect(result3).toBe('string[]');
        });

        it('should generate indexes correctly', () => {
            const fields = [
                { propertyKey: 'name', index: true },
                { propertyKey: 'email', unique: true },
            ];

            const indexes = (repositoryTranspile as any).generateIndexes(
                'User',
                fields,
                mockContract,
            );

            expect(indexes).toContain('@Index("idx_user_name"');
            expect(indexes).toContain('@Index("idx_user_email"');
            expect(indexes).toContain('{ unique: true }');

            // Verificar índice de fake delete
            expect(indexes).toContain('@Index("idx_user_deleted"');
        });

        it('should generate column options correctly', () => {
            const field = {
                propertyKey: 'name',
                protoType: 'string',
                nullable: false,
                defaultValue: 'Default',
            };

            const options = (repositoryTranspile as any).generateColumnOptions(
                field,
            );

            expect(options).toContain('type: "varchar"');
            expect(options).toContain('default: Default');
            expect(options).toContain('nullable: false');
        });
    });
});
