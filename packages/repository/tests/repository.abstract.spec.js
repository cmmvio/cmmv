"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const vitest_1 = require("vitest");
const repository_abstract_1 = require("../lib/repository.abstract");
const core_1 = require("@cmmv/core");
const mongodb_1 = require("mongodb");
const repository_service_1 = require("../lib/repository.service");
vitest_1.vi.mock('@cmmv/core', () => {
    const createDecorator = () => {
        const decorator = (...args) => {
            if (args.length === 0 ||
                (args.length === 1 && typeof args[0] !== 'function')) {
                return (...innerArgs) => decorator(...innerArgs);
            }
            return args[0];
        };
        return decorator;
    };
    return {
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
            fixIds(item) {
                return item;
            }
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
        Config: {
            get: vitest_1.vi.fn(),
        },
        Hook: createDecorator(),
        Hooks: {
            HooksType: {
                BEFORE_SAVE: 'BEFORE_SAVE',
                AFTER_SAVE: 'AFTER_SAVE',
            },
        },
        HooksType: {
            onPreInitialize: 'onPreInitialize',
            onInitialize: 'onInitialize',
            onListen: 'onListen',
            onError: 'onError',
            onHTTPServerInit: 'onHTTPServerInit',
            Log: 'Log',
        },
    };
});
vitest_1.vi.mock('./repository.service', () => ({
    RepositorySchema: class MockRepositorySchema {
        constructor() { }
    },
}));
class TestRepositoryService extends repository_abstract_1.AbstractRepositoryService {
    constructor() {
        super(); //@ts-ignore
        this.schema = new repository_service_1.RepositorySchema();
    }
}
(0, vitest_1.describe)('AbstractRepositoryService', () => {
    let service;
    (0, vitest_1.beforeEach)(() => {
        vitest_1.vi.resetAllMocks();
        service = new TestRepositoryService();
    });
    (0, vitest_1.describe)('fixIds', () => {
        (0, vitest_1.it)('should convert _id to id in a simple object', () => {
            const objectId = new mongodb_1.ObjectId();
            const input = { _id: objectId, name: 'Test' };
            const expected = { id: objectId.toString(), name: 'Test' };
            const result = service.fixIds(input);
            (0, vitest_1.expect)(result).toEqual(expected);
            (0, vitest_1.expect)(result).not.toHaveProperty('_id');
            (0, vitest_1.expect)(result).toHaveProperty('id', objectId.toString());
        });
        (0, vitest_1.it)('should convert ObjectId values to strings', () => {
            const objectId1 = new mongodb_1.ObjectId();
            const objectId2 = new mongodb_1.ObjectId();
            const input = { _id: objectId1, refId: objectId2, name: 'Test' };
            const result = service.fixIds(input);
            (0, vitest_1.expect)(result.refId).toBe(objectId2.toString());
            (0, vitest_1.expect)(typeof result.refId).toBe('string');
        });
        (0, vitest_1.it)('should handle arrays of objects', () => {
            const objectId1 = new mongodb_1.ObjectId();
            const objectId2 = new mongodb_1.ObjectId();
            const input = {
                items: [
                    { _id: objectId1, name: 'Item 1' },
                    { _id: objectId2, name: 'Item 2' },
                ],
            };
            const result = service.fixIds(input);
            (0, vitest_1.expect)(result.items[0]).toHaveProperty('id', objectId1.toString());
            (0, vitest_1.expect)(result.items[0]).not.toHaveProperty('_id');
            (0, vitest_1.expect)(result.items[1]).toHaveProperty('id', objectId2.toString());
            (0, vitest_1.expect)(result.items[1]).not.toHaveProperty('_id');
        });
        (0, vitest_1.it)('should handle nested objects', () => {
            const objectId1 = new mongodb_1.ObjectId();
            const objectId2 = new mongodb_1.ObjectId();
            const input = {
                _id: objectId1,
                name: 'Parent',
                child: {
                    _id: objectId2,
                    name: 'Child',
                },
            };
            const result = service.fixIds(input);
            (0, vitest_1.expect)(result).toHaveProperty('id', objectId1.toString());
            (0, vitest_1.expect)(result).not.toHaveProperty('_id');
            (0, vitest_1.expect)(result.child).toHaveProperty('id', objectId2.toString());
            (0, vitest_1.expect)(result.child).not.toHaveProperty('_id');
        });
        (0, vitest_1.it)('should handle null and undefined values', () => {
            (0, vitest_1.expect)(service.fixIds(null)).toBe(null);
            (0, vitest_1.expect)(service.fixIds(undefined)).toBe(undefined);
        });
        (0, vitest_1.it)('should not process non-object values', () => {
            (0, vitest_1.expect)(service.fixIds('string')).toBe('string');
            (0, vitest_1.expect)(service.fixIds(123)).toBe(123);
            (0, vitest_1.expect)(service.fixIds(true)).toBe(true);
        });
    });
    (0, vitest_1.describe)('fromPartial', () => {
        (0, vitest_1.it)('should use model.fromPartial if available', () => {
            const mockModel = {
                fromPartial: vitest_1.vi
                    .fn()
                    .mockReturnValue({ id: '123', name: 'Test Complete' }),
            };
            const data = { name: 'Test' };
            const req = { user: { id: '456' } };
            const result = service['fromPartial'](mockModel, data, req);
            (0, vitest_1.expect)(mockModel.fromPartial).toHaveBeenCalled();
            (0, vitest_1.expect)(result).toEqual({ id: '123', name: 'Test Complete' });
        });
        (0, vitest_1.it)('should return data directly if model.fromPartial is not available', () => {
            const mockModel = {}; // No fromPartial method
            const data = { name: 'Test' };
            const req = { user: { id: '456' } };
            const result = service['fromPartial'](mockModel, data, req);
            (0, vitest_1.expect)(result).toBe(data);
        });
        (0, vitest_1.it)('should call extraData to enrich the data', () => {
            const mockModel = {
                fromPartial: vitest_1.vi.fn().mockImplementation((data) => data),
            };
            const data = { name: 'Test' };
            const req = { user: { id: '456' } };
            const extraDataSpy = vitest_1.vi.spyOn(service, 'extraData');
            service['fromPartial'](mockModel, data, req);
            (0, vitest_1.expect)(extraDataSpy).toHaveBeenCalledWith(data, req);
        });
    });
    (0, vitest_1.describe)('toModel', () => {
        (0, vitest_1.it)('should convert entity to model using fromEntity if available', () => {
            const mockModel = {
                fromEntity: vitest_1.vi
                    .fn()
                    .mockReturnValue({ id: '123', name: 'Converted' }),
            };
            const data = {
                _id: new mongodb_1.ObjectId('507f1f77bcf86cd799439011'),
                name: 'Test',
            };
            // Configure mock to simulate MongoDB
            vitest_1.vi.mocked(core_1.Config.get).mockReturnValue('mongodb');
            const result = service['toModel'](mockModel, data);
            (0, vitest_1.expect)(mockModel.fromEntity).toHaveBeenCalled();
            (0, vitest_1.expect)(result).toEqual({ id: '123', name: 'Converted' });
        });
        (0, vitest_1.it)('should fix IDs if repository type is MongoDB', () => {
            const data = {
                _id: new mongodb_1.ObjectId('507f1f77bcf86cd799439011'),
                name: 'Test',
            };
            // Configure mock to simulate MongoDB
            vitest_1.vi.mocked(core_1.Config.get).mockReturnValue('mongodb');
            const fixIdsSpy = vitest_1.vi.spyOn(service, 'fixIds');
            service['toModel'](null, data);
            (0, vitest_1.expect)(fixIdsSpy).toHaveBeenCalledWith(data);
        });
        (0, vitest_1.it)('should not fix IDs if repository type is not MongoDB', () => {
            const data = { id: '123', name: 'Test' };
            // Configure mock to simulate PostgreSQL
            vitest_1.vi.mocked(core_1.Config.get).mockReturnValue('postgres');
            const fixIdsSpy = vitest_1.vi.spyOn(service, 'fixIds');
            service['toModel'](null, data);
            (0, vitest_1.expect)(fixIdsSpy).not.toHaveBeenCalled();
        });
        (0, vitest_1.it)('should return fixed data if model.fromEntity is not available', () => {
            const mockModel = {}; // No fromEntity method
            const data = {
                _id: new mongodb_1.ObjectId('507f1f77bcf86cd799439011'),
                name: 'Test',
            };
            // Configure mock to simulate MongoDB
            vitest_1.vi.mocked(core_1.Config.get).mockReturnValue('mongodb');
            const result = service['toModel'](mockModel, data);
            (0, vitest_1.expect)(result).toHaveProperty('id', '507f1f77bcf86cd799439011');
            (0, vitest_1.expect)(result).not.toHaveProperty('_id');
        });
    });
    (0, vitest_1.describe)('extraData', () => {
        (0, vitest_1.it)('should add userCreator from request when repository is MongoDB', () => {
            const newItem = { name: 'Test' };
            const req = { user: { id: '507f1f77bcf86cd799439011' } };
            // Configure mock to simulate MongoDB
            vitest_1.vi.mocked(core_1.Config.get).mockReturnValue('mongodb');
            const result = service['extraData'](newItem, req);
            (0, vitest_1.expect)(result).toHaveProperty('userCreator');
            (0, vitest_1.expect)(result.userCreator).toBeInstanceOf(mongodb_1.ObjectId);
            (0, vitest_1.expect)(result.userCreator.toString()).toBe('507f1f77bcf86cd799439011');
        });
        (0, vitest_1.it)('should add userCreator from request when repository is not MongoDB', () => {
            const newItem = { name: 'Test' };
            const req = { user: { id: '123-456-789' } };
            // Configure mock to simulate PostgreSQL
            vitest_1.vi.mocked(core_1.Config.get).mockReturnValue('postgres');
            const result = service['extraData'](newItem, req);
            (0, vitest_1.expect)(result).toHaveProperty('userCreator', '123-456-789');
            (0, vitest_1.expect)(typeof result.userCreator).toBe('string');
        });
        (0, vitest_1.it)('should handle case when user ID is invalid for ObjectId', () => {
            const newItem = { name: 'Test' };
            const req = { user: { id: 'invalid-id' } };
            // Configure mock to simulate MongoDB
            vitest_1.vi.mocked(core_1.Config.get).mockReturnValue('mongodb');
            // Spy on console.warn
            const warnSpy = vitest_1.vi
                .spyOn(console, 'warn')
                .mockImplementation(() => { });
            const result = service['extraData'](newItem, req);
            // Verificar que o item não tem userCreator definido
            (0, vitest_1.expect)(result).not.toHaveProperty('userCreator');
            // Verificar que um aviso foi registrado
            (0, vitest_1.expect)(warnSpy).toHaveBeenCalledWith('Error assigning userCreator:', vitest_1.expect.any(Error));
        });
        (0, vitest_1.it)('should not add userCreator when user ID is not available', () => {
            const newItem = { name: 'Test' };
            const reqWithoutUser = {};
            const result = service['extraData'](newItem, reqWithoutUser);
            (0, vitest_1.expect)(result).not.toHaveProperty('userCreator');
        });
        (0, vitest_1.it)('should return original item when req is undefined', () => {
            const newItem = { name: 'Test' };
            const result = service['extraData'](newItem, undefined);
            (0, vitest_1.expect)(result).toEqual(newItem);
            (0, vitest_1.expect)(result).not.toHaveProperty('userCreator');
        });
    });
});
