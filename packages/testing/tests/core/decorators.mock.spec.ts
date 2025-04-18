import { describe, it, expect, beforeEach, vi } from 'vitest';
import {
    MockDecorators,
    mockDecorators,
    Contract,
    ContractField,
    ContractMethod,
    ContractMessage,
    ContractService,
    Hook,
    Interceptor,
    SetMetadata,
    MixedDecorator,
    Resolver,
    Cron,
    Service,
    NAMESPACE_METADATA,
    CONTROLLER_NAME_METADATA,
    CRON_METADATA,
} from '../../core/decorators.mock';

describe('MockDecorators', () => {
    beforeEach(() => {
        MockDecorators.reset();
    });

    it('should mock Contract decorator', () => {
        const options = { controllerName: 'TestController' };
        const decoratorFn = Contract(options);

        expect(Contract).toHaveBeenCalledWith(options);
        expect(typeof decoratorFn).toBe('function');
    });

    it('should mock ContractField decorator', () => {
        const options = { protoType: 'string' };
        const decoratorFn = ContractField(options);

        expect(ContractField).toHaveBeenCalledWith(options);
        expect(typeof decoratorFn).toBe('function');
    });

    it('should mock ContractMethod decorator', () => {
        const options = { customMethodName: 'testMethod' };
        const decoratorFn = ContractMethod(options);

        expect(ContractMethod).toHaveBeenCalledWith(options);
        expect(typeof decoratorFn).toBe('function');
    });

    it('should mock ContractMessage decorator', () => {
        const options = { name: 'TestMessage' };
        const decoratorFn = ContractMessage(options);

        expect(ContractMessage).toHaveBeenCalledWith(options);
        expect(typeof decoratorFn).toBe('function');
    });

    it('should mock ContractService decorator', () => {
        const options = {
            path: '/test',
            method: 'GET',
            name: 'testService',
            functionName: 'testFunction',
        };
        const decoratorFn = ContractService(options);

        expect(ContractService).toHaveBeenCalledWith(options);
        expect(typeof decoratorFn).toBe('function');
    });

    it('should mock Hook decorator', () => {
        const event = 'onError';
        const decoratorFn = Hook(event);

        expect(Hook).toHaveBeenCalledWith(event);
        expect(typeof decoratorFn).toBe('function');
    });

    it('should mock Interceptor decorator', () => {
        const decoratorFn = Interceptor();

        expect(Interceptor).toHaveBeenCalled();
        expect(typeof decoratorFn).toBe('function');
    });

    it('should mock SetMetadata decorator', () => {
        const key = 'test-key';
        const value = { data: 'test' };
        const decoratorFn = SetMetadata(key, value);

        expect(SetMetadata).toHaveBeenCalledWith(key, value);
        expect(typeof decoratorFn).toBe('function');
        expect(decoratorFn.KEY).toBe(key);
    });

    it('should mock MixedDecorator decorator', () => {
        const key = 'test-key';
        const metadata = { data: 'test' };
        const decoratorFn = MixedDecorator(key, metadata);

        expect(MixedDecorator).toHaveBeenCalledWith(key, metadata);
        expect(typeof decoratorFn).toBe('function');
    });

    it('should mock Resolver decorator', () => {
        const namespace = 'test.namespace';
        const decoratorFn = Resolver(namespace);

        expect(Resolver).toHaveBeenCalledWith(namespace);
        expect(typeof decoratorFn).toBe('function');
    });

    it('should mock Cron decorator', () => {
        const cronTime = '0 * * * *';
        const decoratorFn = Cron(cronTime);

        expect(Cron).toHaveBeenCalledWith(cronTime);
        expect(typeof decoratorFn).toBe('function');
    });

    it('should mock Service decorator', () => {
        const name = 'TestService';
        const decoratorFn = Service(name);

        expect(Service).toHaveBeenCalledWith(name);
        expect(typeof decoratorFn).toBe('function');
    });

    it('should provide individual module mocks', () => {
        // Test each individual module mock
        expect(MockDecorators.getContractDecoratorMock()).toHaveProperty(
            'Contract',
            Contract,
        );
        expect(MockDecorators.getHooksDecoratorMock()).toHaveProperty(
            'Hook',
            Hook,
        );
        expect(MockDecorators.getInterceptorDecoratorMock()).toHaveProperty(
            'Interceptor',
            Interceptor,
        );
        expect(MockDecorators.getMetadataDecoratorMock()).toHaveProperty(
            'SetMetadata',
            SetMetadata,
        );
        expect(MockDecorators.getMixedDecoratorMock()).toHaveProperty(
            'MixedDecorator',
            MixedDecorator,
        );
        expect(MockDecorators.getResolverDecoratorMock()).toHaveProperty(
            'Resolver',
            Resolver,
        );
        expect(MockDecorators.getSchedulingDecoratorMock()).toHaveProperty(
            'Cron',
            Cron,
        );
        expect(MockDecorators.getServiceDecoratorMock()).toHaveProperty(
            'Service',
            Service,
        );
    });

    it('should provide symbols for metadata', () => {
        expect(typeof NAMESPACE_METADATA).toBe('symbol');
        expect(typeof CONTROLLER_NAME_METADATA).toBe('symbol');
        expect(typeof CRON_METADATA).toBe('symbol');
    });

    it('should reset all mocks', () => {
        // Call some decorators
        Contract({ controllerName: 'Test' });
        Hook('event');

        // Verify they were called
        expect(Contract).toHaveBeenCalled();
        expect(Hook).toHaveBeenCalled();

        // Reset
        MockDecorators.reset();

        // Verify they were reset
        expect(Contract).not.toHaveBeenCalled();
        expect(Hook).not.toHaveBeenCalled();
    });

    it('should expose mockDecorators as an alias', () => {
        expect(mockDecorators).toBe(MockDecorators);
    });
});
