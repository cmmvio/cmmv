import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';

import {
    DatabaseTestingModule,
    MockTestDataSource,
    MockTestRepository,
    MockQueryBuilder,
    FixtureFactory,
    createDatabaseTestingModule,
    createFixtureFactory,
    withTestDatabase,
    withTransaction,
} from '../../database/database-testing.module';

// Test entity class
class UserEntity {
    id: string;
    name: string;
    email: string;
    createdAt: Date;
    updatedAt: Date;
}

class PostEntity {
    id: string;
    title: string;
    content: string;
    userId: string;
    createdAt: Date;
    updatedAt: Date;
}

describe('DatabaseTestingModule', () => {
    let db: DatabaseTestingModule;

    beforeEach(async () => {
        db = createDatabaseTestingModule({
            type: 'sqlite',
            inMemory: true,
            entities: [UserEntity, PostEntity],
        });
        await db.initialize();
    });

    afterEach(async () => {
        await db.close();
    });

    describe('initialization', () => {
        it('should create database testing module', () => {
            expect(db).toBeInstanceOf(DatabaseTestingModule);
        });

        it('should initialize data source', async () => {
            const dataSource = db.getDataSource();
            expect(dataSource.isInitialized).toBe(true);
        });
    });

    describe('seeding', () => {
        it('should seed single entity', async () => {
            const users = await db.seed(UserEntity, [
                { name: 'John', email: 'john@example.com' },
                { name: 'Jane', email: 'jane@example.com' },
            ]);

            expect(users).toHaveLength(2);
            expect(users[0].name).toBe('John');
            expect(users[1].name).toBe('Jane');
        });

        it('should seed with auto-generated IDs', async () => {
            const users = await db.seed(UserEntity, [
                { name: 'Test User', email: 'test@example.com' },
            ]);

            expect(users[0].id).toBeDefined();
            expect(users[0].createdAt).toBeInstanceOf(Date);
            expect(users[0].updatedAt).toBeInstanceOf(Date);
        });

        it('should seed multiple entities', async () => {
            const results = await db.seedMany([
                {
                    entity: UserEntity,
                    data: [{ name: 'User 1', email: 'user1@example.com' }],
                },
                {
                    entity: PostEntity,
                    data: [
                        { title: 'Post 1', content: 'Content', userId: '1' },
                    ],
                },
            ]);

            expect(results.get('UserEntity')).toHaveLength(1);
            expect(results.get('PostEntity')).toHaveLength(1);
        });

        it('should get seeded data', async () => {
            await db.seed(UserEntity, [
                { name: 'Seeded User', email: 'seeded@example.com' },
            ]);

            const seeded = db.getSeededData(UserEntity);
            expect(seeded).toHaveLength(1);
            expect(seeded[0].name).toBe('Seeded User');
        });

        it('should clear seeded data', async () => {
            await db.seed(UserEntity, [
                { name: 'To Clear', email: 'clear@example.com' },
            ]);

            await db.clearSeededData();

            expect(db.getSeededData(UserEntity)).toHaveLength(0);
        });

        it('should clear specific entity', async () => {
            await db.seed(UserEntity, [
                { name: 'User', email: 'user@example.com' },
            ]);
            await db.seed(PostEntity, [
                { title: 'Post', content: 'Content', userId: '1' },
            ]);

            await db.clearEntity(UserEntity);

            expect(db.getSeededData(UserEntity)).toHaveLength(0);
            expect(db.getSeededData(PostEntity)).toHaveLength(1);
        });
    });

    describe('transactions', () => {
        it('should start transaction', async () => {
            const ctx = await db.startTransaction();

            expect(ctx.isActive).toBe(true);
            expect(ctx.queryRunner).toBeDefined();
            expect(ctx.manager).toBeDefined();

            await ctx.release();
        });

        it('should commit transaction', async () => {
            const ctx = await db.startTransaction();

            await ctx.commit();

            expect(ctx.isActive).toBe(false);
            expect(ctx.queryRunner.commitTransaction).toHaveBeenCalled();

            await ctx.release();
        });

        it('should rollback transaction', async () => {
            const ctx = await db.startTransaction();

            await ctx.rollback();

            expect(ctx.isActive).toBe(false);
            expect(ctx.queryRunner.rollbackTransaction).toHaveBeenCalled();

            await ctx.release();
        });

        it('should run callback in transaction with auto-rollback', async () => {
            let wasInTransaction = false;

            await db.runInTransaction(async (ctx) => {
                wasInTransaction = ctx.isActive;
            });

            expect(wasInTransaction).toBe(true);
        });
    });

    describe('repository', () => {
        it('should get repository for entity', () => {
            const repo = db.getRepository(UserEntity);
            expect(repo).toBeInstanceOf(MockTestRepository);
        });

        it('should save and find entities', async () => {
            await db.seed(UserEntity, [
                { name: 'User 1', email: 'user1@example.com' },
                { name: 'User 2', email: 'user2@example.com' },
            ]);

            const repo = db.getRepository(UserEntity);
            const users = await repo.find();

            expect(users).toHaveLength(2);
        });

        it('should find one entity', async () => {
            await db.seed(UserEntity, [
                { name: 'Test User', email: 'test@example.com' },
            ]);

            const repo = db.getRepository(UserEntity);
            const seeded = db.getSeededData(UserEntity);
            const user = await repo.findOne({ where: { id: seeded[0].id } });

            expect(user).not.toBeNull();
            expect(user?.name).toBe('Test User');
        });
    });

    describe('reset', () => {
        it('should reset database state', async () => {
            await db.seed(UserEntity, [
                { name: 'User', email: 'user@example.com' },
            ]);

            await db.reset();

            expect(db.getSeededData(UserEntity)).toHaveLength(0);
        });
    });

    describe('fixture factory', () => {
        it('should create fixture factory', () => {
            const factory = db.createFixtureFactory(UserEntity, {
                name: 'Default Name',
            });

            expect(factory).toBeInstanceOf(FixtureFactory);
        });
    });
});

describe('MockTestDataSource', () => {
    let dataSource: MockTestDataSource;

    beforeEach(() => {
        dataSource = new MockTestDataSource({
            type: 'sqlite',
            inMemory: true,
        });
    });

    it('should initialize', async () => {
        await dataSource.initialize();
        expect(dataSource.isInitialized).toBe(true);
    });

    it('should destroy', async () => {
        await dataSource.initialize();
        await dataSource.destroy();
        expect(dataSource.isInitialized).toBe(false);
    });

    it('should create query runner', () => {
        const qr = dataSource.createQueryRunner();

        expect(qr.connect).toBeDefined();
        expect(qr.startTransaction).toBeDefined();
        expect(qr.commitTransaction).toBeDefined();
        expect(qr.rollbackTransaction).toBeDefined();
        expect(qr.release).toBeDefined();
        expect(qr.manager).toBeDefined();
    });

    it('should create entity with auto-generated id', () => {
        const user = dataSource.createEntity(UserEntity, { name: 'Test' });

        expect(user.id).toBeDefined();
        expect(user.name).toBe('Test');
        expect(user.createdAt).toBeInstanceOf(Date);
    });
});

describe('MockTestRepository', () => {
    let store: Map<string, any[]>;
    let repo: MockTestRepository<UserEntity>;

    beforeEach(() => {
        store = new Map();
        repo = new MockTestRepository(UserEntity, store);
    });

    describe('find', () => {
        it('should return all entities', async () => {
            store.set('UserEntity', [
                { id: '1', name: 'User 1', email: 'user1@example.com' },
                { id: '2', name: 'User 2', email: 'user2@example.com' },
            ]);

            const users = await repo.find();
            expect(users).toHaveLength(2);
        });

        it('should filter by where clause', async () => {
            store.set('UserEntity', [
                { id: '1', name: 'John', email: 'john@example.com' },
                { id: '2', name: 'Jane', email: 'jane@example.com' },
            ]);

            const users = await repo.find({ where: { name: 'John' } });
            expect(users).toHaveLength(1);
            expect(users[0].name).toBe('John');
        });

        it('should apply pagination', async () => {
            store.set('UserEntity', [
                { id: '1', name: 'User 1' },
                { id: '2', name: 'User 2' },
                { id: '3', name: 'User 3' },
            ]);

            const users = await repo.find({ skip: 1, take: 1 });
            expect(users).toHaveLength(1);
            expect(users[0].name).toBe('User 2');
        });
    });

    describe('save', () => {
        it('should save new entity', async () => {
            const user = await repo.save({
                name: 'New User',
                email: 'new@example.com',
            });

            expect(user.id).toBeDefined();
            expect(user.name).toBe('New User');
        });

        it('should update existing entity', async () => {
            store.set('UserEntity', [
                { id: '1', name: 'Original', email: 'orig@example.com' },
            ]);

            await repo.save({ id: '1', name: 'Updated' });

            const data = store.get('UserEntity');
            expect(data?.[0].name).toBe('Updated');
        });
    });

    describe('delete', () => {
        it('should delete entity', async () => {
            store.set('UserEntity', [
                { id: '1', name: 'To Delete' },
                { id: '2', name: 'To Keep' },
            ]);

            const result = await repo.delete({ id: '1' });

            expect(result.affected).toBe(1);
            expect(store.get('UserEntity')).toHaveLength(1);
        });
    });

    describe('count', () => {
        it('should count entities', async () => {
            store.set('UserEntity', [{ id: '1' }, { id: '2' }, { id: '3' }]);

            const count = await repo.count();
            expect(count).toBe(3);
        });
    });

    describe('create', () => {
        it('should create entity instance', () => {
            const user = repo.create({
                name: 'Created',
                email: 'created@example.com',
            });

            expect(user.id).toBeDefined();
            expect(user.name).toBe('Created');
        });
    });

    describe('clear', () => {
        it('should clear all entities', async () => {
            store.set('UserEntity', [{ id: '1' }, { id: '2' }]);

            await repo.clear();

            expect(store.get('UserEntity')).toHaveLength(0);
        });
    });

    describe('createQueryBuilder', () => {
        it('should return query builder', () => {
            const qb = repo.createQueryBuilder('user');
            expect(qb).toBeInstanceOf(MockQueryBuilder);
        });
    });
});

describe('MockQueryBuilder', () => {
    let data: UserEntity[];
    let qb: MockQueryBuilder<UserEntity>;

    beforeEach(() => {
        data = [
            {
                id: '1',
                name: 'User 1',
                email: 'user1@example.com',
                createdAt: new Date(),
                updatedAt: new Date(),
            },
            {
                id: '2',
                name: 'User 2',
                email: 'user2@example.com',
                createdAt: new Date(),
                updatedAt: new Date(),
            },
            {
                id: '3',
                name: 'User 3',
                email: 'user3@example.com',
                createdAt: new Date(),
                updatedAt: new Date(),
            },
        ];
        qb = new MockQueryBuilder(data);
    });

    it('should support chaining', () => {
        const result = qb
            .where({ name: 'User 1' })
            .andWhere({ email: 'user1@example.com' })
            .orderBy('name', 'ASC')
            .limit(10)
            .offset(0);

        expect(result).toBe(qb);
    });

    it('should get many', async () => {
        const results = await qb.getMany();
        expect(results).toHaveLength(3);
    });

    it('should get one', async () => {
        const result = await qb.getOne();
        expect(result).toBeDefined();
    });

    it('should apply skip and take', async () => {
        const results = await qb.skip(1).take(1).getMany();
        expect(results).toHaveLength(1);
    });

    it('should get count', async () => {
        const count = await qb.getCount();
        expect(count).toBe(3);
    });
});

describe('FixtureFactory', () => {
    let factory: FixtureFactory<UserEntity>;

    beforeEach(() => {
        factory = new FixtureFactory(UserEntity, {
            name: 'Default User',
            email: 'default@example.com',
        });
    });

    describe('create', () => {
        it('should create fixture with defaults', () => {
            const user = factory.create();

            expect(user.id).toBeDefined();
            expect(user.name).toBe('Default User');
            expect(user.email).toBe('default@example.com');
        });

        it('should create fixture with overrides', () => {
            const user = factory.create({ name: 'Override User' });

            expect(user.name).toBe('Override User');
            expect(user.email).toBe('default@example.com');
        });

        it('should increment sequence', () => {
            const user1 = factory.create();
            const user2 = factory.create();

            expect(user1.id).not.toBe(user2.id);
        });
    });

    describe('createMany', () => {
        it('should create multiple fixtures', () => {
            const users = factory.createMany(3);

            expect(users).toHaveLength(3);
            users.forEach((user) => {
                expect(user.name).toBe('Default User');
            });
        });

        it('should create with dynamic overrides', () => {
            const users = factory.createMany(3, (index) => ({
                name: `User ${index}`,
            }));

            expect(users[0].name).toBe('User 0');
            expect(users[1].name).toBe('User 1');
            expect(users[2].name).toBe('User 2');
        });
    });

    describe('build', () => {
        it('should build fixture without entity class', () => {
            const data = factory.build({ name: 'Built User' });

            expect(data.name).toBe('Built User');
            expect(data.id).toBeDefined();
        });
    });

    describe('buildMany', () => {
        it('should build multiple fixtures', () => {
            const data = factory.buildMany(2);

            expect(data).toHaveLength(2);
        });
    });

    describe('resetSequence', () => {
        it('should reset sequence counter', () => {
            factory.create();
            factory.create();

            factory.resetSequence();

            const user = factory.create();
            expect(user.id).toBe('id-1');
        });
    });
});

describe('createDatabaseTestingModule', () => {
    it('should create database testing module', () => {
        const db = createDatabaseTestingModule();
        expect(db).toBeInstanceOf(DatabaseTestingModule);
    });
});

describe('createFixtureFactory', () => {
    it('should create fixture factory', () => {
        const factory = createFixtureFactory(UserEntity, { name: 'Test' });
        expect(factory).toBeInstanceOf(FixtureFactory);
    });
});

describe('withTestDatabase', () => {
    it('should run callback with database', async () => {
        let wasInitialized = false;

        await withTestDatabase(async (db) => {
            wasInitialized = db.getDataSource().isInitialized;
        });

        expect(wasInitialized).toBe(true);
    });
});

describe('withTransaction', () => {
    it('should run callback in transaction', async () => {
        const db = createDatabaseTestingModule();
        await db.initialize();

        let wasInTransaction = false;

        await withTransaction(db, async (ctx) => {
            wasInTransaction = ctx.isActive;
        });

        expect(wasInTransaction).toBe(true);

        await db.close();
    });
});
