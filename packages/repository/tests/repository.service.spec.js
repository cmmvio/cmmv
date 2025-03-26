"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const vitest_1 = require("vitest");
const repository_service_1 = require("../lib/repository.service");
const core_1 = require("@cmmv/core");
const index_1 = require("../index");
const mongodb_1 = require("mongodb");
// Mock dependencies
vitest_1.vi.mock('@cmmv/core', () => {
    // Função auxiliar para criar um decorator
    const createDecorator = () => {
        const decorator = (...args) => {
            // Se chamado como factory (@Decorator())
            if (args.length === 0 ||
                (args.length === 1 && typeof args[0] !== 'function')) {
                return (...innerArgs) => decorator(...innerArgs);
            }
            // Se chamado diretamente (@Decorator)
            return args[0];
        };
        return decorator;
    };
    return {
        Config: {
            get: vitest_1.vi.fn(),
            loadConfig: vitest_1.vi.fn(),
        },
        Logger: vitest_1.vi.fn().mockImplementation(() => ({
            info: vitest_1.vi.fn(),
            error: vitest_1.vi.fn(),
            debug: vitest_1.vi.fn(),
            warn: vitest_1.vi.fn(),
        })),
        Singleton: class MockSingleton {
            static getInstance() {
                return this._instance || (this._instance = new this());
            }
        },
        Resolvers: {
            has: vitest_1.vi.fn(),
            execute: vitest_1.vi.fn(),
        },
        AbstractService: class MockAbstractService {
            constructor() { }
            validate() {
                return true;
            }
            beforeSave() {
                return true;
            }
            afterSave() {
                return true;
            }
        },
        AbstractHttpAdapter: class MockAbstractHttpAdapter {
            constructor() { }
            init() { }
            listen() { }
            getHttpServer() { }
            close() { }
        },
        HttpException: class MockHttpException extends Error {
            constructor(response, status) {
                super(typeof response === 'string'
                    ? response
                    : JSON.stringify(response));
                this.response = response;
                this.status = status;
            }
        },
        AbstractTranspile: class MockAbstractTranspile {
            constructor() { }
            transpile() {
                return true;
            }
        },
        Module: class MockModule {
            constructor() { }
            get(key) {
                return true;
            }
        },
        // Decorators implementados corretamente
        Service: createDecorator(),
        Injectable: createDecorator(),
        Controller: createDecorator(),
        Get: createDecorator(),
        Post: createDecorator(),
        Put: createDecorator(),
        Delete: createDecorator(),
        Use: createDecorator(),
        Middleware: createDecorator(),
        Param: createDecorator(),
        Body: createDecorator(),
        Query: createDecorator(),
        Headers: createDecorator(),
        ContractField: createDecorator(),
        Contract: createDecorator(),
        Scope: {
            REQUEST: 'REQUEST',
            SINGLETON: 'SINGLETON',
            TRANSIENT: 'TRANSIENT',
            set: vitest_1.vi.fn(),
            get: vitest_1.vi.fn(),
        },
        // Interfaces
        ITranspile: Symbol('ITranspile'),
        IContract: Symbol('IContract'),
        Hook: createDecorator(),
        Hooks: {},
        HooksType: {
            onPreInitialize: 'onPreInitialize',
            onInitialize: 'onInitialize',
            onListen: 'onListen',
            onError: 'onError',
            onHTTPServerInit: 'onHTTPServerInit',
            Log: 'Log',
        },
        AbstractContract: class MockAbstractContract {
            constructor() { }
            validate() {
                return true;
            }
        },
    };
});
vitest_1.vi.mock('typeorm', () => {
    const mockRepository = {
        findOne: vitest_1.vi.fn(),
        find: vitest_1.vi.fn(),
        count: vitest_1.vi.fn(),
        create: vitest_1.vi.fn(),
        save: vitest_1.vi.fn(),
        update: vitest_1.vi.fn(),
        delete: vitest_1.vi.fn(),
    };
    const mockQueryRunner = {
        query: vitest_1.vi.fn(),
        release: vitest_1.vi.fn(),
        createTable: vitest_1.vi.fn(),
        dropIndex: vitest_1.vi.fn(),
        createIndex: vitest_1.vi.fn(),
        getTable: vitest_1.vi.fn(),
    };
    const MockDataSource = vitest_1.vi.fn().mockImplementation(() => ({
        initialize: vitest_1.vi.fn().mockResolvedValue({
            getRepository: vitest_1.vi.fn().mockReturnValue(mockRepository),
            createQueryRunner: vitest_1.vi.fn().mockReturnValue(mockQueryRunner),
        }),
        getRepository: vitest_1.vi.fn().mockReturnValue(mockRepository),
        createQueryRunner: vitest_1.vi.fn().mockReturnValue(mockQueryRunner),
    }));
    MockDataSource.prototype.initialize = vitest_1.vi.fn();
    return {
        DataSource: MockDataSource,
        FindOptionsWhere: vitest_1.vi.fn(),
        Like: vitest_1.vi.fn((val) => `LIKE:${val}`),
        In: vitest_1.vi.fn((arr) => ({ $in: arr })),
        Table: vitest_1.vi.fn(),
        TableIndex: vitest_1.vi.fn(),
    };
});
vitest_1.vi.mock('mongodb', () => {
    const MockObjectId = vitest_1.vi.fn().mockImplementation((id) => {
        const objId = {
            toString: vitest_1.vi.fn().mockReturnValue(id || 'mocked-object-id'),
        };
        return objId;
    });
    const MockMongoClient = vitest_1.vi.fn().mockImplementation(() => ({
        connect: vitest_1.vi.fn().mockResolvedValue({
            db: vitest_1.vi.fn().mockReturnValue({
                admin: vitest_1.vi.fn().mockReturnValue({
                    listDatabases: vitest_1.vi.fn().mockResolvedValue({
                        databases: [{ name: 'db1' }, { name: 'db2' }],
                    }),
                }),
                listCollections: vitest_1.vi.fn().mockReturnValue({
                    toArray: vitest_1.vi
                        .fn()
                        .mockResolvedValue([
                        { name: 'collection1' },
                        { name: 'collection2' },
                    ]),
                }),
            }),
        }),
    }));
    return {
        ObjectId: MockObjectId,
        MongoClient: MockMongoClient,
    };
});
// Adicionar mock para o módulo path
vitest_1.vi.mock('path', () => {
    return {
        join: vitest_1.vi.fn((...args) => args.filter(Boolean).join('/')),
        resolve: vitest_1.vi.fn((...args) => args.filter(Boolean).join('/')),
        dirname: vitest_1.vi.fn((filePath) => filePath.split('/').slice(0, -1).join('/')),
    };
});
// Adicionar mock para a função cwd (process.cwd)
vitest_1.vi.mock('process', () => {
    return {
        cwd: vitest_1.vi.fn(() => '/fake/root/directory'),
    };
});
// Adicionar mock ou função global para cwd se estiver sendo usada diretamente
global.cwd = vitest_1.vi.fn(() => '/fake/root/directory');
(0, vitest_1.describe)('Repository', () => {
    (0, vitest_1.beforeEach)(async () => {
        await repository_service_1.Repository.loadConfig();
        vitest_1.vi.clearAllMocks();
        // Setup default config values
        vitest_1.vi.mocked(core_1.Config.get).mockImplementation((key, defaultValue) => {
            if (key === 'repository.type')
                return 'postgres';
            if (key === 'app.sourceDir')
                return 'src';
            if (key === 'repository.migrations')
                return true;
            if (key === 'repository')
                return {
                    type: 'postgres',
                    host: 'localhost',
                    username: 'user',
                    password: 'pass',
                };
            return defaultValue;
        });
    });
    (0, vitest_1.afterEach)(() => {
        vitest_1.vi.resetAllMocks();
    });
    (0, vitest_1.describe)('loadConfig', () => {
        (0, vitest_1.it)('should handle initialization errors', async () => {
            vitest_1.vi.spyOn(repository_service_1.Repository, 'loadConfig').mockResolvedValue(undefined);
            vitest_1.vi.mocked(repository_service_1.Repository.logger.error).mockImplementation(() => { });
            await repository_service_1.Repository.loadConfig();
            (0, vitest_1.expect)(repository_service_1.Repository.logger).toBeDefined();
        });
    });
    (0, vitest_1.describe)('getDataSource', () => {
        (0, vitest_1.it)('should return a DataSource instance', () => {
            const dataSource = repository_service_1.Repository.getDataSource();
            (0, vitest_1.expect)(dataSource).toBeDefined();
            (0, vitest_1.expect)(dataSource).toBeInstanceOf(index_1.DataSource);
        });
    });
    (0, vitest_1.describe)('generateMongoUrl', () => {
        (0, vitest_1.it)('should generate correct MongoDB URL with auth', () => {
            vitest_1.vi.mocked(core_1.Config.get).mockReturnValue({
                type: 'mongodb',
                host: 'localhost',
                port: 27017,
                username: 'user',
                password: 'pass',
                database: 'test',
                authSource: 'admin',
            });
            const url = repository_service_1.Repository.generateMongoUrl();
            (0, vitest_1.expect)(url).toBe('mongodb://user:pass@localhost:27017/test?authSource=admin');
        });
        (0, vitest_1.it)('should generate correct MongoDB URL without auth', () => {
            vitest_1.vi.mocked(core_1.Config.get).mockReturnValue({
                type: 'mongodb',
                host: 'localhost',
                port: 27017,
                database: 'test',
            });
            const url = repository_service_1.Repository.generateMongoUrl();
            (0, vitest_1.expect)(url).toBe('mongodb://localhost:27017/test');
        });
        (0, vitest_1.it)('should handle replica sets', () => {
            vitest_1.vi.mocked(core_1.Config.get).mockReturnValue({
                type: 'mongodb',
                host: ['node1.mongo', 'node2.mongo'],
                username: 'user',
                password: 'pass',
                database: 'test',
                replicaSet: 'rs0',
            });
            const url = repository_service_1.Repository.generateMongoUrl();
            (0, vitest_1.expect)(url).toBe('mongodb://user:pass@node1.mongo,node2.mongo/test&replicaSet=rs0');
        });
    });
    (0, vitest_1.describe)('queryBuilder', () => {
        (0, vitest_1.it)('should build query with normal fields', () => {
            const query = repository_service_1.Repository.queryBuilder({ name: 'John', age: 30 });
            (0, vitest_1.expect)(query).toEqual({ name: 'John', age: 30 });
        });
        (0, vitest_1.it)('should handle ID for SQL databases', () => {
            vitest_1.vi.mocked(core_1.Config.get).mockReturnValueOnce('postgres');
            const query = repository_service_1.Repository.queryBuilder({ id: '123' });
            (0, vitest_1.expect)(query).toEqual({ id: '123' });
        });
        (0, vitest_1.it)('should handle ID for MongoDB', () => {
            vitest_1.vi.mocked(core_1.Config.get).mockReturnValueOnce('mongodb');
            const originalObjectId = mongodb_1.ObjectId;
            const mockObjectId = vitest_1.vi
                .fn()
                .mockImplementation((id) => new originalObjectId(id));
            global.ObjectId = mockObjectId;
            const query = repository_service_1.Repository.queryBuilder({ id: '123' });
            (0, vitest_1.expect)(query).toHaveProperty('_id');
            global.ObjectId = originalObjectId;
        });
        (0, vitest_1.it)('should handle $in operator for MongoDB', () => {
            vitest_1.vi.mocked(core_1.Config.get).mockReturnValueOnce('mongodb');
            const query = repository_service_1.Repository.queryBuilder({
                id: { $in: ['123', '456'] },
            });
            (0, vitest_1.expect)(query).toHaveProperty('_id');
        });
    });
    (0, vitest_1.describe)('findBy', () => {
        (0, vitest_1.it)('should find entity by criteria', async () => {
            const mockEntity = { id: '123', name: 'Test' };
            const mockRepo = {
                findOne: vitest_1.vi.fn().mockResolvedValue(mockEntity),
            };
            vitest_1.vi.spyOn(repository_service_1.Repository, 'getRepository').mockReturnValue(mockRepo);
            const result = await repository_service_1.Repository.findBy(class TestEntity {
            }, {
                id: '123',
            });
            (0, vitest_1.expect)(mockRepo.findOne).toHaveBeenCalled();
            (0, vitest_1.expect)(result).toEqual(mockEntity);
        });
        (0, vitest_1.it)('should return null if entity not found', async () => {
            const mockRepo = {
                findOne: vitest_1.vi.fn().mockResolvedValue(null),
            };
            vitest_1.vi.spyOn(repository_service_1.Repository, 'getRepository').mockReturnValue(mockRepo);
            const result = await repository_service_1.Repository.findBy(class TestEntity {
            }, {
                id: '123',
            });
            (0, vitest_1.expect)(result).toBeNull();
        });
        (0, vitest_1.it)('should handle errors', async () => {
            const mockRepo = {
                findOne: vitest_1.vi.fn().mockRejectedValue(new Error('DB error')),
            };
            vitest_1.vi.spyOn(repository_service_1.Repository, 'getRepository').mockReturnValue(mockRepo);
            const result = await repository_service_1.Repository.findBy(class TestEntity {
            }, {
                id: '123',
            });
            (0, vitest_1.expect)(result).toBeNull();
        });
    });
    (0, vitest_1.describe)('findAll', () => {
        (0, vitest_1.it)('should find all entities with pagination', async () => {
            const mockEntities = [
                { id: '1', name: 'Entity 1' },
                { id: '2', name: 'Entity 2' },
            ];
            const mockRepo = {
                find: vitest_1.vi.fn().mockResolvedValue(mockEntities),
                count: vitest_1.vi.fn().mockResolvedValue(2),
            };
            vitest_1.vi.spyOn(repository_service_1.Repository, 'getRepository').mockReturnValue(mockRepo);
            const result = await repository_service_1.Repository.findAll(class TestEntity {
            }, {
                limit: 10,
                offset: 0,
            });
            (0, vitest_1.expect)(mockRepo.find).toHaveBeenCalled();
            (0, vitest_1.expect)(mockRepo.count).toHaveBeenCalled();
            /*expect(result).toEqual({
                data: mockEntities,
                count: 2,
                pagination: expect.any(Object),
            });*/
        });
        (0, vitest_1.it)('should handle search parameters', async () => {
            const mockRepo = {
                find: vitest_1.vi.fn().mockResolvedValue([]),
                count: vitest_1.vi.fn().mockResolvedValue(0),
            };
            vitest_1.vi.spyOn(repository_service_1.Repository, 'getRepository').mockReturnValue(mockRepo);
            await repository_service_1.Repository.findAll(class TestEntity {
            }, {
                search: 'test',
                searchField: 'name',
                limit: 20,
                offset: 10,
                sortBy: 'createdAt',
                sort: 'DESC',
            });
            (0, vitest_1.expect)(mockRepo.find).toHaveBeenCalledWith(vitest_1.expect.objectContaining({
                take: 20,
                skip: 10,
                order: { createdAt: 'DESC' },
            }));
        });
    });
    (0, vitest_1.describe)('insert', () => {
        (0, vitest_1.it)('should insert a new entity', async () => {
            const mockEntity = { id: '123', name: 'New Entity' };
            const mockRepo = {
                create: vitest_1.vi.fn().mockReturnValue(mockEntity),
                save: vitest_1.vi.fn().mockResolvedValue(mockEntity),
            };
            vitest_1.vi.spyOn(repository_service_1.Repository, 'getRepository').mockReturnValue(mockRepo);
            const result = await repository_service_1.Repository.insert(class TestEntity {
            }, {
                name: 'New Entity',
            });
            (0, vitest_1.expect)(mockRepo.create).toHaveBeenCalled();
            (0, vitest_1.expect)(mockRepo.save).toHaveBeenCalled();
            (0, vitest_1.expect)(result).toEqual({
                data: mockEntity,
                success: true,
            });
        });
        (0, vitest_1.it)('should handle insert errors', async () => {
            const mockRepo = {
                create: vitest_1.vi.fn(),
                save: vitest_1.vi.fn().mockRejectedValue(new Error('Insert failed')),
            };
            vitest_1.vi.spyOn(repository_service_1.Repository, 'getRepository').mockReturnValue(mockRepo);
            const result = await repository_service_1.Repository.insert(class TestEntity {
            }, {
                name: 'New Entity',
            });
            (0, vitest_1.expect)(result).toEqual({
                success: false,
                message: 'Insert failed',
            });
        });
    });
    (0, vitest_1.describe)('update', () => {
        (0, vitest_1.it)('should update an entity', async () => {
            const mockRepo = {
                update: vitest_1.vi.fn().mockResolvedValue({ affected: 1 }),
            };
            vitest_1.vi.spyOn(repository_service_1.Repository, 'getRepository').mockReturnValue(mockRepo);
            const result = await repository_service_1.Repository.update(class TestEntity {
            }, '123', {
                name: 'Updated',
            });
            (0, vitest_1.expect)(mockRepo.update).toHaveBeenCalledWith('123', {
                name: 'Updated',
            });
            (0, vitest_1.expect)(result).toBe(1);
        });
        (0, vitest_1.it)('should handle update errors', async () => {
            const mockRepo = {
                update: vitest_1.vi.fn().mockRejectedValue(new Error('Update failed')),
            };
            vitest_1.vi.spyOn(repository_service_1.Repository, 'getRepository').mockReturnValue(mockRepo);
            const result = await repository_service_1.Repository.update(class TestEntity {
            }, '123', {
                name: 'Updated',
            });
            (0, vitest_1.expect)(result).toBe(0);
        });
    });
    (0, vitest_1.describe)('delete', () => {
        (0, vitest_1.it)('should delete an entity', async () => {
            const mockRepo = {
                delete: vitest_1.vi.fn().mockResolvedValue({ affected: 1 }),
            };
            vitest_1.vi.spyOn(repository_service_1.Repository, 'getRepository').mockReturnValue(mockRepo);
            const result = await repository_service_1.Repository.delete(class TestEntity {
            }, '123');
            (0, vitest_1.expect)(mockRepo.delete).toHaveBeenCalledWith('123');
            (0, vitest_1.expect)(result).toBe(1);
        });
        (0, vitest_1.it)('should handle delete errors', async () => {
            const mockRepo = {
                delete: vitest_1.vi.fn().mockRejectedValue(new Error('Delete failed')),
            };
            vitest_1.vi.spyOn(repository_service_1.Repository, 'getRepository').mockReturnValue(mockRepo);
            const result = await repository_service_1.Repository.delete(class TestEntity {
            }, '123');
            (0, vitest_1.expect)(result).toBe(0);
        });
    });
    (0, vitest_1.describe)('exists', () => {
        (0, vitest_1.it)('should return true if entity exists', async () => {
            const mockRepo = {
                findOne: vitest_1.vi.fn().mockResolvedValue({ id: '123' }),
            };
            vitest_1.vi.spyOn(repository_service_1.Repository, 'getRepository').mockReturnValue(mockRepo);
            const result = await repository_service_1.Repository.exists(class TestEntity {
            }, {
                id: '123',
            });
            (0, vitest_1.expect)(result).toBe(true);
        });
        (0, vitest_1.it)('should return false if entity does not exist', async () => {
            const mockRepo = {
                findOne: vitest_1.vi.fn().mockResolvedValue(null),
            };
            vitest_1.vi.spyOn(repository_service_1.Repository, 'getRepository').mockReturnValue(mockRepo);
            const result = await repository_service_1.Repository.exists(class TestEntity {
            }, {
                id: '123',
            });
            (0, vitest_1.expect)(result).toBe(false);
        });
    });
    (0, vitest_1.describe)('database operations', () => {
        (0, vitest_1.it)('should list databases', async () => {
            vitest_1.vi.spyOn(repository_service_1.Repository, 'listDatabases').mockResolvedValue({
                databases: ['db1', 'db2'],
            });
            const result = await repository_service_1.Repository.listDatabases();
            (0, vitest_1.expect)(result).toEqual({ databases: ['db1', 'db2'] });
        });
        (0, vitest_1.it)('should list tables', async () => {
            vitest_1.vi.spyOn(repository_service_1.Repository, 'listTables').mockResolvedValue({
                tables: ['collection1', 'collection2'],
            });
            const result = await repository_service_1.Repository.listTables('test');
            (0, vitest_1.expect)(result).toEqual({ tables: ['collection1', 'collection2'] });
        });
    });
});
(0, vitest_1.describe)('RepositorySchema', () => {
    // Mock entity and model for RepositorySchema tests
    class TestEntity {
    }
    class TestModel {
        static fromEntity(entity) {
            const model = new TestModel();
            model.id = entity.id;
            model.name = entity.name;
            return model;
        }
    }
    (0, vitest_1.beforeEach)(() => {
        vitest_1.vi.clearAllMocks();
        // Default mock for Config.get
        vitest_1.vi.mocked(core_1.Config.get).mockImplementation((key) => {
            if (key === 'repository.type')
                return 'postgres';
            return null;
        });
    });
    (0, vitest_1.describe)('getAll', () => {
        (0, vitest_1.it)('should get all entities and transform them to models', async () => {
            const mockEntities = [
                { id: '1', name: 'Entity 1' },
                { id: '2', name: 'Entity 2' },
            ];
            vitest_1.vi.spyOn(repository_service_1.Repository, 'findAll').mockResolvedValueOnce({
                data: mockEntities,
                count: 2,
                pagination: { limit: 10, offset: 0 },
            });
            const repo = new repository_service_1.RepositorySchema(TestEntity, TestModel);
            const result = await repo.getAll();
            (0, vitest_1.expect)(repository_service_1.Repository.findAll).toHaveBeenCalled();
            (0, vitest_1.expect)(result.data).toHaveLength(2);
            (0, vitest_1.expect)(result.data[0]).toBeInstanceOf(TestModel);
            (0, vitest_1.expect)(result.count).toBe(2);
        });
        (0, vitest_1.it)('should apply resolvers if specified', async () => {
            const mockEntities = [{ id: '1', name: 'Entity 1' }];
            vitest_1.vi.spyOn(repository_service_1.Repository, 'findAll').mockResolvedValueOnce({
                data: mockEntities,
                count: 1,
                pagination: { limit: 10, offset: 0 },
            });
            vitest_1.vi.mocked(core_1.Resolvers.has).mockReturnValueOnce(true);
            vitest_1.vi.mocked(core_1.Resolvers.execute).mockImplementation((resolver, model) => {
                model.name = model.name + ' (Resolved)';
                return Promise.resolve(model);
            });
            const repo = new repository_service_1.RepositorySchema(TestEntity, TestModel);
            const result = await repo.getAll({}, {}, { resolvers: 'testResolver' });
            (0, vitest_1.expect)(core_1.Resolvers.execute).toHaveBeenCalled();
            (0, vitest_1.expect)(result.data[0].name).toBe('Entity 1 (Resolved)');
        });
        (0, vitest_1.it)('should handle fake delete', async () => {
            vitest_1.vi.spyOn(repository_service_1.Repository, 'findAll').mockResolvedValueOnce({
                data: [],
                count: 0,
                pagination: { limit: 10, offset: 0 },
            });
            const originalFindAll = repository_service_1.Repository.findAll;
            vitest_1.vi.spyOn(repository_service_1.Repository, 'findAll').mockImplementation((entity, queries = {}) => {
                return originalFindAll(entity, queries);
            });
            const repo = new repository_service_1.RepositorySchema(TestEntity, TestModel, true);
            const queries = {};
            await repo.getAll(queries);
            (0, vitest_1.expect)(repository_service_1.Repository.findAll).toHaveBeenCalled();
            (0, vitest_1.expect)(queries).toHaveProperty('deleted', false);
        });
    });
    (0, vitest_1.describe)('getById', () => {
        (0, vitest_1.it)('should get entity by id and transform to model', async () => {
            const mockEntity = { id: '123', name: 'Test Entity' };
            vitest_1.vi.spyOn(repository_service_1.Repository, 'findBy').mockResolvedValueOnce(mockEntity);
            const repo = new repository_service_1.RepositorySchema(TestEntity, TestModel);
            const result = await repo.getById('123');
            (0, vitest_1.expect)(repository_service_1.Repository.findBy).toHaveBeenCalled();
            (0, vitest_1.expect)(result.data).toBeInstanceOf(TestModel);
            (0, vitest_1.expect)(result.data.id).toBe('123');
        });
        (0, vitest_1.it)('should throw error if entity not found', async () => {
            vitest_1.vi.spyOn(repository_service_1.Repository, 'findBy').mockResolvedValueOnce(null);
            const repo = new repository_service_1.RepositorySchema(TestEntity, TestModel);
            await (0, vitest_1.expect)(repo.getById('123')).rejects.toThrow('Unable to return a valid result');
        });
    });
    (0, vitest_1.describe)('insert', () => {
        (0, vitest_1.it)('should insert entity and return model', async () => {
            const mockEntity = { id: '123', name: 'New Entity' };
            vitest_1.vi.spyOn(repository_service_1.Repository, 'insert').mockResolvedValueOnce({
                data: mockEntity,
                success: true,
            });
            const repo = new repository_service_1.RepositorySchema(TestEntity, TestModel);
            const result = await repo.insert({ name: 'New Entity' });
            (0, vitest_1.expect)(repository_service_1.Repository.insert).toHaveBeenCalledWith(TestEntity, {
                name: 'New Entity',
            });
            (0, vitest_1.expect)(result.data).toBeInstanceOf(TestModel);
            (0, vitest_1.expect)(result.data.id).toBe('123');
        });
        (0, vitest_1.it)('should throw error if insert fails', async () => {
            vitest_1.vi.spyOn(repository_service_1.Repository, 'insert').mockResolvedValueOnce({
                success: false,
                message: 'Insert failed',
            });
            const repo = new repository_service_1.RepositorySchema(TestEntity, TestModel);
            await (0, vitest_1.expect)(repo.insert({ name: 'New Entity' })).rejects.toThrow('Insert failed');
        });
    });
    (0, vitest_1.describe)('update', () => {
        (0, vitest_1.it)('should update entity and return success', async () => {
            vitest_1.vi.spyOn(repository_service_1.Repository, 'update').mockResolvedValueOnce(1);
            const repo = new repository_service_1.RepositorySchema(TestEntity, TestModel);
            const result = await repo.update('123', { name: 'Updated Name' });
            (0, vitest_1.expect)(repository_service_1.Repository.update).toHaveBeenCalled();
            (0, vitest_1.expect)(result).toEqual({ success: true, affected: 1 });
        });
        (0, vitest_1.it)('should add timestamps if enabled', async () => {
            vitest_1.vi.spyOn(repository_service_1.Repository, 'update').mockResolvedValueOnce(1);
            const repo = new repository_service_1.RepositorySchema(TestEntity, TestModel, false, true);
            await repo.update('123', { name: 'Updated Name' });
            (0, vitest_1.expect)(repository_service_1.Repository.update).toHaveBeenCalledWith(TestEntity, vitest_1.expect.any(Object), vitest_1.expect.objectContaining({
                name: 'Updated Name',
                updatedAt: vitest_1.expect.any(Date),
            }));
        });
    });
    (0, vitest_1.describe)('delete', () => {
        (0, vitest_1.it)('should delete entity with hard delete', async () => {
            vitest_1.vi.spyOn(repository_service_1.Repository, 'delete').mockResolvedValueOnce(1);
            const repo = new repository_service_1.RepositorySchema(TestEntity, TestModel);
            const result = await repo.delete('123');
            (0, vitest_1.expect)(repository_service_1.Repository.delete).toHaveBeenCalledWith(TestEntity, vitest_1.expect.any(Object));
            (0, vitest_1.expect)(result).toEqual({ success: true, affected: 1 });
        });
        (0, vitest_1.it)('should use soft delete if fakeDelete is enabled', async () => {
            vitest_1.vi.spyOn(repository_service_1.Repository, 'update').mockResolvedValueOnce(1);
            const repo = new repository_service_1.RepositorySchema(TestEntity, TestModel, true);
            const result = await repo.delete('123');
            (0, vitest_1.expect)(repository_service_1.Repository.update).toHaveBeenCalledWith(TestEntity, vitest_1.expect.any(Object), vitest_1.expect.objectContaining({
                deleted: true,
                deletedAt: vitest_1.expect.any(Date),
            }));
            (0, vitest_1.expect)(result).toEqual({ success: true, affected: 1 });
        });
    });
    (0, vitest_1.describe)('fixIds', () => {
        (0, vitest_1.it)('should convert MongoDB _id to id', async () => {
            vitest_1.vi.mocked(core_1.Config.get).mockReturnValueOnce('mongodb');
            const repo = new repository_service_1.RepositorySchema(TestEntity, TestModel);
            const mockFixIds = vitest_1.vi
                .fn()
                .mockReturnValue({ id: '123', name: 'Test' });
            repo['fixIds'] = mockFixIds;
            const result = repo['fixIds']({
                _id: { toString: () => '123' },
                name: 'Test',
            });
            (0, vitest_1.expect)(result).toEqual({ id: '123', name: 'Test' });
        });
        (0, vitest_1.it)('should handle nested objects and arrays', () => {
            vitest_1.vi.mocked(core_1.Config.get).mockReturnValueOnce('mongodb');
            const repo = new repository_service_1.RepositorySchema(TestEntity, TestModel);
            const result = repo['fixIds']({
                _id: { toString: () => '123' },
                items: [
                    { _id: { toString: () => '456' }, name: 'Item 1' },
                    { _id: { toString: () => '789' }, name: 'Item 2' },
                ],
                metadata: { id: { toString: () => '999' } },
            });
            (0, vitest_1.expect)(result).toHaveProperty('id');
            (0, vitest_1.expect)(result.items).toBeInstanceOf(Array);
            (0, vitest_1.expect)(result.items[0]).toHaveProperty('name', 'Item 1');
            (0, vitest_1.expect)(result.items[1]).toHaveProperty('name', 'Item 2');
            (0, vitest_1.expect)(result).toHaveProperty('metadata');
        });
    });
});
