import { describe, it, expect, beforeEach } from 'vitest';
import { MockAbstracts, mockAbstracts } from '../../core/abstracts.mock';

describe('MockAbstracts', () => {
    beforeEach(() => {
        MockAbstracts.resetAll();
    });

    describe('MockAbstractContract', () => {
        it('should create a MockAbstractContract instance', () => {
            const mock = MockAbstracts.createAbstractContract();
            expect(mock).toBeDefined();
            expect(mock.customProto).toBeDefined();
            expect(mock.customTypes).toBeDefined();
        });

        it('should reset mock methods', () => {
            const mock = MockAbstracts.createAbstractContract();
            mock.customProto.mockReturnValue('custom');
            mock.customTypes.mockReturnValue('types');

            expect(mock.customProto()).toBe('custom');
            expect(mock.customTypes()).toBe('types');

            mock.reset();

            expect(mock.customProto()).toBe('');
            expect(mock.customTypes()).toBe('');
        });

        it('should return MockAbstractContract class via getContractAbstractMock', () => {
            const contractMock = MockAbstracts.getContractAbstractMock();
            expect(contractMock.AbstractContract).toBe(
                MockAbstracts.AbstractContract,
            );
        });
    });

    describe('MockAbstractHttpAdapter', () => {
        it('should create a MockAbstractHttpAdapter instance', () => {
            const mock = MockAbstracts.createAbstractHttpAdapter();
            expect(mock).toBeDefined();
            expect(mock.init).toBeDefined();
            expect(mock.use).toBeDefined();
            expect(mock.get).toBeDefined();
            expect(mock.post).toBeDefined();
            expect(mock.close).toBeDefined();
        });

        it('should have method chains returning this', () => {
            const mock = MockAbstracts.createAbstractHttpAdapter();
            expect(mock.use()).toBe(mock);
            expect(mock.get()).toBe(mock);
            expect(mock.post()).toBe(mock);
        });

        it('should reset all mock methods', () => {
            const mock = MockAbstracts.createAbstractHttpAdapter();
            mock.getHttpServer.mockReturnValue({ custom: true });

            expect(mock.getHttpServer()).toEqual({ custom: true });

            mock.reset();

            expect(mock.getHttpServer()).toEqual({});
        });

        it('should return MockAbstractHttpAdapter class via getHttpAdapterAbstractMock', () => {
            const adapterMock = MockAbstracts.getHttpAdapterAbstractMock();
            expect(adapterMock.AbstractHttpAdapter).toBe(
                MockAbstracts.AbstractHttpAdapter,
            );
        });
    });

    describe('MockAbstractModel', () => {
        it('should create a MockAbstractModel instance', () => {
            const mock = MockAbstracts.createAbstractModel();
            expect(mock).toBeDefined();
            expect(mock.serialize).toBeDefined();
            expect(mock.afterValidation).toBeDefined();
        });

        it('should have static methods properly mocked', () => {
            expect(MockAbstracts.AbstractModel.sanitizeEntity).toBeDefined();
            expect(MockAbstracts.AbstractModel.fromEntity).toBeDefined();
            expect(MockAbstracts.AbstractModel.fromEntities).toBeDefined();

            const result = MockAbstracts.AbstractModel.sanitizeEntity(
                MockAbstracts.AbstractModel,
                { id: 1 },
            );
            expect(result).toBeInstanceOf(MockAbstracts.AbstractModel);
        });

        it('should reset instance and static mock methods', () => {
            const mock = MockAbstracts.createAbstractModel();
            mock.serialize.mockReturnValue({ custom: true });
            MockAbstracts.AbstractModel.fromEntity.mockReturnValue({
                test: true,
            });

            expect(mock.serialize()).toEqual({ custom: true });
            expect(MockAbstracts.AbstractModel.fromEntity()).toEqual({
                test: true,
            });

            mock.reset();

            expect(mock.serialize()).toEqual({});
            expect(MockAbstracts.AbstractModel.fromEntity()).toEqual({});
        });

        it('should return MockAbstractModel class via getModelAbstractMock', () => {
            const modelMock = MockAbstracts.getModelAbstractMock();
            expect(modelMock.AbstractModel).toBe(MockAbstracts.AbstractModel);
        });
    });

    describe('MockAbstractService', () => {
        it('should create a MockAbstractService instance', () => {
            const mock = MockAbstracts.createAbstractService();
            expect(mock).toBeDefined();
            expect(mock.removeUndefined).toBeDefined();
            expect(mock.fixIds).toBeDefined();
            expect(mock.appendUser).toBeDefined();
            expect(mock.appendUpdateUser).toBeDefined();
            expect(mock.validate).toBeDefined();
        });

        it('should have methods with proper implementations', () => {
            const mock = MockAbstracts.createAbstractService();

            const withUser = mock.appendUser({ data: 'test' }, 'user123');
            expect(withUser).toEqual({ data: 'test', userCreator: 'user123' });

            const withUpdateUser = mock.appendUpdateUser(
                { data: 'test' },
                'user456',
            );
            expect(withUpdateUser).toEqual({
                data: 'test',
                userLastUpdate: 'user456',
            });
        });

        it('should reset all mock methods', () => {
            const mock = MockAbstracts.createAbstractService();
            mock.removeUndefined.mockImplementation(() => ({ custom: true }));

            expect(mock.removeUndefined({})).toEqual({ custom: true });

            mock.reset();

            expect(mock.removeUndefined({})).toEqual({});
        });

        it('should return MockAbstractService class via getServicesAbstractMock', () => {
            const serviceMock = MockAbstracts.getServicesAbstractMock();
            expect(serviceMock.AbstractService).toBe(
                MockAbstracts.AbstractService,
            );
        });
    });

    describe('MockSingleton', () => {
        it('should have static getInstance method', () => {
            expect(MockAbstracts.Singleton.getInstance).toBeDefined();
        });

        it('should have static clearInstance method', () => {
            expect(MockAbstracts.Singleton.clearInstance).toBeDefined();
        });

        it('should return MockSingleton class via getSingletonAbstractMock', () => {
            const singletonMock = MockAbstracts.getSingletonAbstractMock();
            expect(singletonMock.Singleton).toBe(MockAbstracts.Singleton);
        });
    });

    describe('MockAbstractWSAdapter', () => {
        it('should create a MockAbstractWSAdapter instance', () => {
            const mock = MockAbstracts.createAbstractWSAdapter();
            expect(mock).toBeDefined();
            expect(mock.create).toBeDefined();
            expect(mock.close).toBeDefined();
            expect(mock.bindClientConnect).toBeDefined();
            expect(mock.bindCustomMessageHandler).toBeDefined();
        });

        it('should have method chains returning this', () => {
            const mock = MockAbstracts.createAbstractWSAdapter();
            expect(mock.create()).toBe(mock);
        });

        it('should reset all mock methods', () => {
            const mock = MockAbstracts.createAbstractWSAdapter();
            mock.bindClientConnect.mockReturnValue({ custom: true });

            expect(mock.bindClientConnect()).toEqual({ custom: true });

            mock.reset();

            expect(mock.bindClientConnect()).toEqual({});
        });

        it('should return MockAbstractWSAdapter class via getWSAdapterAbstractMock', () => {
            const adapterMock = MockAbstracts.getWSAdapterAbstractMock();
            expect(adapterMock.AbstractWSAdapter).toBe(
                MockAbstracts.AbstractWSAdapter,
            );
        });
    });

    describe('MockAbstracts general functionality', () => {
        it('should provide access to all abstract mocks via getAbstracts', () => {
            const abstracts = MockAbstracts.getAbstracts();
            expect(abstracts.AbstractContract).toBe(
                MockAbstracts.AbstractContract,
            );
            expect(abstracts.AbstractHttpAdapter).toBe(
                MockAbstracts.AbstractHttpAdapter,
            );
            expect(abstracts.AbstractModel).toBe(MockAbstracts.AbstractModel);
            expect(abstracts.AbstractService).toBe(
                MockAbstracts.AbstractService,
            );
            expect(abstracts.Singleton).toBe(MockAbstracts.Singleton);
            expect(abstracts.AbstractWSAdapter).toBe(
                MockAbstracts.AbstractWSAdapter,
            );
        });

        it('should expose mockAbstracts constant that equals MockAbstracts class', () => {
            expect(mockAbstracts).toBe(MockAbstracts);
        });
    });
});
