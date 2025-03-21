import { describe, it, expect, vi, beforeEach } from 'vitest';
import { AbstractRepositoryService } from '../lib/repository.abstract';
import { Config } from '@cmmv/core';
import { ObjectId } from 'mongodb';
import { RepositorySchema } from '../lib/repository.service';

// Mock para dependências externas
vi.mock('@cmmv/core', () => ({
    AbstractService: class MockAbstractService {
        constructor() {}
        validate() {
            return true;
        }
        beforeSave() {
            return true;
        }
        afterSave() {
            return true;
        }
        fixIds(item: any) {
            return item;
        }
    },
    Config: {
        get: vi.fn(),
    },
}));

vi.mock('./repository.service', () => ({
    RepositorySchema: class MockRepositorySchema {
        constructor() {}
    },
}));

// Classe concreta para testar a classe abstrata
class TestRepositoryService extends AbstractRepositoryService {
    constructor() {
        super(); //@ts-ignore
        this.schema = new RepositorySchema<any, any>() as any;
    }
}

describe('AbstractRepositoryService', () => {
    let service: TestRepositoryService;

    beforeEach(() => {
        vi.resetAllMocks();
        service = new TestRepositoryService();
    });

    describe('fixIds', () => {
        it('should convert _id to id in a simple object', () => {
            const objectId = new ObjectId();
            const input = { _id: objectId, name: 'Test' };
            const expected = { id: objectId.toString(), name: 'Test' };

            const result = service.fixIds(input);

            expect(result).toEqual(expected);
            expect(result).not.toHaveProperty('_id');
            expect(result).toHaveProperty('id', objectId.toString());
        });

        it('should convert ObjectId values to strings', () => {
            const objectId1 = new ObjectId();
            const objectId2 = new ObjectId();
            const input = { _id: objectId1, refId: objectId2, name: 'Test' };

            const result = service.fixIds(input);

            expect(result.refId).toBe(objectId2.toString());
            expect(typeof result.refId).toBe('string');
        });

        it('should handle arrays of objects', () => {
            const objectId1 = new ObjectId();
            const objectId2 = new ObjectId();
            const input = {
                items: [
                    { _id: objectId1, name: 'Item 1' },
                    { _id: objectId2, name: 'Item 2' },
                ],
            };

            const result = service.fixIds(input);

            expect(result.items[0]).toHaveProperty('id', objectId1.toString());
            expect(result.items[0]).not.toHaveProperty('_id');
            expect(result.items[1]).toHaveProperty('id', objectId2.toString());
            expect(result.items[1]).not.toHaveProperty('_id');
        });

        it('should handle nested objects', () => {
            const objectId1 = new ObjectId();
            const objectId2 = new ObjectId();
            const input = {
                _id: objectId1,
                name: 'Parent',
                child: {
                    _id: objectId2,
                    name: 'Child',
                },
            };

            const result = service.fixIds(input);

            expect(result).toHaveProperty('id', objectId1.toString());
            expect(result).not.toHaveProperty('_id');
            expect(result.child).toHaveProperty('id', objectId2.toString());
            expect(result.child).not.toHaveProperty('_id');
        });

        it('should handle null and undefined values', () => {
            expect(service.fixIds(null)).toBe(null);
            expect(service.fixIds(undefined)).toBe(undefined);
        });

        it('should not process non-object values', () => {
            expect(service.fixIds('string')).toBe('string');
            expect(service.fixIds(123)).toBe(123);
            expect(service.fixIds(true)).toBe(true);
        });
    });

    describe('fromPartial', () => {
        it('should use model.fromPartial if available', () => {
            const mockModel = {
                fromPartial: vi
                    .fn()
                    .mockReturnValue({ id: '123', name: 'Test Complete' }),
            };
            const data = { name: 'Test' };
            const req = { user: { id: '456' } };

            const result = service['fromPartial'](mockModel, data, req);

            expect(mockModel.fromPartial).toHaveBeenCalled();
            expect(result).toEqual({ id: '123', name: 'Test Complete' });
        });

        it('should return data directly if model.fromPartial is not available', () => {
            const mockModel = {}; // No fromPartial method
            const data = { name: 'Test' };
            const req = { user: { id: '456' } };

            const result = service['fromPartial'](mockModel, data, req);

            expect(result).toBe(data);
        });

        it('should call extraData to enrich the data', () => {
            const mockModel = {
                fromPartial: vi.fn().mockImplementation((data) => data),
            };
            const data = { name: 'Test' };
            const req = { user: { id: '456' } };

            const extraDataSpy = vi.spyOn(service as any, 'extraData');

            service['fromPartial'](mockModel, data, req);

            expect(extraDataSpy).toHaveBeenCalledWith(data, req);
        });
    });

    describe('toModel', () => {
        it('should convert entity to model using fromEntity if available', () => {
            const mockModel = {
                fromEntity: vi
                    .fn()
                    .mockReturnValue({ id: '123', name: 'Converted' }),
            };
            const data = {
                _id: new ObjectId('507f1f77bcf86cd799439011'),
                name: 'Test',
            };

            // Configure mock to simulate MongoDB
            vi.mocked(Config.get).mockReturnValue('mongodb');

            const result = service['toModel'](mockModel, data);

            expect(mockModel.fromEntity).toHaveBeenCalled();
            expect(result).toEqual({ id: '123', name: 'Converted' });
        });

        it('should fix IDs if repository type is MongoDB', () => {
            const data = {
                _id: new ObjectId('507f1f77bcf86cd799439011'),
                name: 'Test',
            };

            // Configure mock to simulate MongoDB
            vi.mocked(Config.get).mockReturnValue('mongodb');

            const fixIdsSpy = vi.spyOn(service, 'fixIds');

            service['toModel'](null, data);

            expect(fixIdsSpy).toHaveBeenCalledWith(data);
        });

        it('should not fix IDs if repository type is not MongoDB', () => {
            const data = { id: '123', name: 'Test' };

            // Configure mock to simulate PostgreSQL
            vi.mocked(Config.get).mockReturnValue('postgres');

            const fixIdsSpy = vi.spyOn(service, 'fixIds');

            service['toModel'](null, data);

            expect(fixIdsSpy).not.toHaveBeenCalled();
        });

        it('should return fixed data if model.fromEntity is not available', () => {
            const mockModel = {}; // No fromEntity method
            const data = {
                _id: new ObjectId('507f1f77bcf86cd799439011'),
                name: 'Test',
            };

            // Configure mock to simulate MongoDB
            vi.mocked(Config.get).mockReturnValue('mongodb');

            const result = service['toModel'](mockModel, data);

            expect(result).toHaveProperty('id', '507f1f77bcf86cd799439011');
            expect(result).not.toHaveProperty('_id');
        });
    });

    describe('extraData', () => {
        it('should add userCreator from request when repository is MongoDB', () => {
            const newItem = { name: 'Test' };
            const req = { user: { id: '507f1f77bcf86cd799439011' } };

            // Configure mock to simulate MongoDB
            vi.mocked(Config.get).mockReturnValue('mongodb');

            const result = service['extraData'](newItem, req);

            expect(result).toHaveProperty('userCreator');
            expect(result.userCreator).toBeInstanceOf(ObjectId);
            expect(result.userCreator.toString()).toBe(
                '507f1f77bcf86cd799439011',
            );
        });

        it('should add userCreator from request when repository is not MongoDB', () => {
            const newItem = { name: 'Test' };
            const req = { user: { id: '123-456-789' } };

            // Configure mock to simulate PostgreSQL
            vi.mocked(Config.get).mockReturnValue('postgres');

            const result = service['extraData'](newItem, req);

            expect(result).toHaveProperty('userCreator', '123-456-789');
            expect(typeof result.userCreator).toBe('string');
        });

        it('should handle case when user ID is invalid for ObjectId', () => {
            const newItem = { name: 'Test' };
            const req = { user: { id: 'invalid-id' } };

            // Configure mock to simulate MongoDB
            vi.mocked(Config.get).mockReturnValue('mongodb');

            // Spy on console.warn
            const warnSpy = vi
                .spyOn(console, 'warn')
                .mockImplementation(() => {});

            const result = service['extraData'](newItem, req);

            // Verificar que o item não tem userCreator definido
            expect(result).not.toHaveProperty('userCreator');

            // Verificar que um aviso foi registrado
            expect(warnSpy).toHaveBeenCalledWith(
                'Error assigning userCreator:',
                expect.any(Error),
            );
        });

        it('should not add userCreator when user ID is not available', () => {
            const newItem = { name: 'Test' };
            const reqWithoutUser = {};

            const result = service['extraData'](newItem, reqWithoutUser);

            expect(result).not.toHaveProperty('userCreator');
        });

        it('should return original item when req is undefined', () => {
            const newItem = { name: 'Test' };

            const result = service['extraData'](newItem, undefined);

            expect(result).toEqual(newItem);
            expect(result).not.toHaveProperty('userCreator');
        });
    });
});
