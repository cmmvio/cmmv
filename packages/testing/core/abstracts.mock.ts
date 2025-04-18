import { vi } from 'vitest';

/**
 * Mock for AbstractContract
 */
class MockAbstractContract {
    public customProto = vi.fn().mockReturnValue('');
    public customTypes = vi.fn().mockReturnValue('');

    public reset(): void {
        this.customProto.mockReset();
        this.customTypes.mockReset();

        this.customProto.mockReturnValue('');
        this.customTypes.mockReturnValue('');
    }
}

/**
 * Mock for AbstractHttpAdapter
 */
class MockAbstractHttpAdapter {
    public httpServer = {};
    public application = {};
    public instance = {};

    public init = vi.fn().mockResolvedValue(undefined);
    public use = vi.fn().mockReturnThis();
    public get = vi.fn().mockReturnThis();
    public post = vi.fn().mockReturnThis();
    public head = vi.fn().mockReturnThis();
    public delete = vi.fn().mockReturnThis();
    public put = vi.fn().mockReturnThis();
    public patch = vi.fn().mockReturnThis();
    public all = vi.fn().mockReturnThis();
    public search = vi.fn().mockReturnThis();
    public options = vi.fn().mockReturnThis();
    public listen = vi.fn().mockReturnThis();
    public getHttpServer = vi.fn().mockReturnValue({});
    public setHttpServer = vi.fn();
    public setInstance = vi.fn();
    public getInstance = vi.fn().mockReturnValue({});
    public setPublicDir = vi.fn();
    public isJson = vi.fn().mockReturnValue(false);
    public close = vi.fn();

    public reset(): void {
        this.init.mockReset();
        this.use.mockReset();
        this.get.mockReset();
        this.post.mockReset();
        this.head.mockReset();
        this.delete.mockReset();
        this.put.mockReset();
        this.patch.mockReset();
        this.all.mockReset();
        this.search.mockReset();
        this.options.mockReset();
        this.listen.mockReset();
        this.getHttpServer.mockReset();
        this.setHttpServer.mockReset();
        this.setInstance.mockReset();
        this.getInstance.mockReset();
        this.setPublicDir.mockReset();
        this.isJson.mockReset();
        this.close.mockReset();

        this.use.mockReturnThis();
        this.get.mockReturnThis();
        this.post.mockReturnThis();
        this.head.mockReturnThis();
        this.delete.mockReturnThis();
        this.put.mockReturnThis();
        this.patch.mockReturnThis();
        this.all.mockReturnThis();
        this.search.mockReturnThis();
        this.options.mockReturnThis();
        this.listen.mockReturnThis();
        this.getHttpServer.mockReturnValue({});
        this.getInstance.mockReturnValue({});
        this.isJson.mockReturnValue(false);
    }
}

/**
 * Mock for AbstractModel
 */
class MockAbstractModel {
    public serialize = vi.fn().mockReturnValue({});
    public static sanitizeEntity = vi
        .fn()
        .mockImplementation(
            (ModelClass: any, entity: any) => new ModelClass({}),
        );
    public static fromEntity = vi.fn().mockReturnValue({});
    public static fromEntities = vi.fn().mockReturnValue([]);
    public afterValidation = vi.fn().mockImplementation((item: any) => item);

    public reset(): void {
        this.serialize.mockReset();
        MockAbstractModel.sanitizeEntity.mockReset();
        MockAbstractModel.fromEntity.mockReset();
        MockAbstractModel.fromEntities.mockReset();
        this.afterValidation.mockReset();

        this.serialize.mockReturnValue({});
        MockAbstractModel.sanitizeEntity.mockImplementation(
            (ModelClass: any, entity: any) => new ModelClass({}),
        );
        MockAbstractModel.fromEntity.mockReturnValue({});
        MockAbstractModel.fromEntities.mockReturnValue([]);
        this.afterValidation.mockImplementation((item: any) => item);
    }
}

/**
 * Mock for AbstractService
 */
class MockAbstractService {
    public name?: string;

    public removeUndefined = vi.fn().mockImplementation((obj: any) => obj);
    public fixIds = vi.fn().mockImplementation((item: any) => item);
    public appendUser = vi
        .fn()
        .mockImplementation((payload: any, userId: any) => ({
            ...payload,
            userCreator: userId,
        }));
    public appendUpdateUser = vi
        .fn()
        .mockImplementation((payload: any, userId: any) => ({
            ...payload,
            userLastUpdate: userId,
        }));
    public validate = vi.fn().mockImplementation(async (item: any) => item);

    public reset(): void {
        this.removeUndefined.mockReset();
        this.fixIds.mockReset();
        this.appendUser.mockReset();
        this.appendUpdateUser.mockReset();
        this.validate.mockReset();

        this.removeUndefined.mockImplementation((obj: any) => obj);
        this.fixIds.mockImplementation((item: any) => item);
        this.appendUser.mockImplementation((payload: any, userId: any) => ({
            ...payload,
            userCreator: userId,
        }));
        this.appendUpdateUser.mockImplementation(
            (payload: any, userId: any) => ({
                ...payload,
                userLastUpdate: userId,
            }),
        );
        this.validate.mockImplementation(async (item: any) => item);
    }
}

/**
 * Mock for Singleton
 */
class MockSingleton {
    private static instances: Map<string, any> = new Map();

    public static getInstance = vi.fn().mockImplementation(function (
        this: any,
    ) {
        const className = this.name;

        if (!MockSingleton.instances.has(className)) {
            const instance = new this();
            MockSingleton.instances.set(className, instance);
        }

        return MockSingleton.instances.get(className);
    });

    public static clearInstance = vi.fn().mockImplementation(function (
        this: any,
    ) {
        const className = this.name;
        MockSingleton.instances.delete(className);
    });

    public static reset(): void {
        MockSingleton.instances.clear();
        MockSingleton.getInstance.mockReset();
        MockSingleton.clearInstance.mockReset();

        MockSingleton.getInstance.mockImplementation(function (this: any) {
            const className = this.name;

            if (!MockSingleton.instances.has(className)) {
                const instance = new this();
                MockSingleton.instances.set(className, instance);
            }

            return MockSingleton.instances.get(className);
        });

        MockSingleton.clearInstance.mockImplementation(function (this: any) {
            const className = this.name;
            MockSingleton.instances.delete(className);
        });
    }
}

/**
 * Mock for AbstractWSAdapter
 */
class MockAbstractWSAdapter {
    public httpServer = {};

    public create = vi.fn().mockReturnThis();
    public close = vi.fn();
    public bindClientConnect = vi.fn().mockReturnValue({});
    public bindCustomMessageHandler = vi.fn().mockReturnValue({});

    public reset(): void {
        this.create.mockReset();
        this.close.mockReset();
        this.bindClientConnect.mockReset();
        this.bindCustomMessageHandler.mockReset();

        this.create.mockReturnThis();
        this.bindClientConnect.mockReturnValue({});
        this.bindCustomMessageHandler.mockReturnValue({});
    }
}

/**
 * Centralized mock for the core abstracts
 */
export class MockAbstracts {
    // Individual mock classes
    public static AbstractContract = MockAbstractContract;
    public static AbstractHttpAdapter = MockAbstractHttpAdapter;
    public static AbstractModel = MockAbstractModel;
    public static AbstractService = MockAbstractService;
    public static Singleton = MockSingleton;
    public static AbstractWSAdapter = MockAbstractWSAdapter;

    // Mock instance generators
    public static createAbstractContract(): MockAbstractContract {
        return new MockAbstractContract();
    }

    public static createAbstractHttpAdapter(): MockAbstractHttpAdapter {
        return new MockAbstractHttpAdapter();
    }

    public static createAbstractModel(): MockAbstractModel {
        return new MockAbstractModel();
    }

    public static createAbstractService(): MockAbstractService {
        return new MockAbstractService();
    }

    public static createAbstractWSAdapter(): MockAbstractWSAdapter {
        return new MockAbstractWSAdapter();
    }

    /**
     * Reset all mock classes
     */
    public static resetAll(): void {
        MockSingleton.reset();
    }

    /**
     * Returns mock module for contract.abstract.ts
     */
    public static getContractAbstractMock() {
        return {
            AbstractContract: MockAbstractContract,
        };
    }

    /**
     * Returns mock module for http-adapter.abstract.ts
     */
    public static getHttpAdapterAbstractMock() {
        return {
            AbstractHttpAdapter: MockAbstractHttpAdapter,
        };
    }

    /**
     * Returns mock module for model.abstract.ts
     */
    public static getModelAbstractMock() {
        return {
            AbstractModel: MockAbstractModel,
        };
    }

    /**
     * Returns mock module for services.abstract.ts
     */
    public static getServicesAbstractMock() {
        return {
            AbstractService: MockAbstractService,
        };
    }

    /**
     * Returns mock module for singleton.abstract.ts
     */
    public static getSingletonAbstractMock() {
        return {
            Singleton: MockSingleton,
        };
    }

    /**
     * Returns mock module for ws-adapter.abstract.ts
     */
    public static getWSAdapterAbstractMock() {
        return {
            AbstractWSAdapter: MockAbstractWSAdapter,
        };
    }

    /**
     * Returns the complete mock for core abstracts
     */
    public static getAbstracts() {
        return {
            AbstractContract: MockAbstractContract,
            AbstractHttpAdapter: MockAbstractHttpAdapter,
            AbstractModel: MockAbstractModel,
            AbstractService: MockAbstractService,
            Singleton: MockSingleton,
            AbstractWSAdapter: MockAbstractWSAdapter,
        };
    }
}

// Export central mock
export const mockAbstracts = MockAbstracts;
