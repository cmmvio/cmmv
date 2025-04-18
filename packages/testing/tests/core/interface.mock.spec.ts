import { describe, it, expect, beforeEach, vi } from 'vitest';
import {
    mockInterfaces,
    MockInterfaces,
    MockConfigSchema,
    MockContractInterface,
    MockHttpServerInterface,
    MockHttpSettingsInterface,
    MockPluginInterface,
    MockSchedulingEnum,
} from '../../core/interface.mock';

describe('MockInterfaces', () => {
    beforeEach(() => {
        MockInterfaces.reset();
    });

    describe('MockConfigSchema', () => {
        it('should create ConfigSchema with required properties', () => {
            const schema = MockConfigSchema.createConfigSchema();

            expect(schema).toHaveProperty('required');
            expect(schema).toHaveProperty('type');
            expect(schema).toHaveProperty('default');
            expect(schema).toHaveProperty('properties');
        });

        it('should create ConfigSubPropsSchemas with mockProp', () => {
            const subProps = MockConfigSchema.createConfigSubPropsSchemas();

            expect(subProps).toHaveProperty('mockProp');
            expect(subProps.mockProp).toHaveProperty('required');
            expect(subProps.mockProp).toHaveProperty('type');
            expect(subProps.mockProp).toHaveProperty('default');
        });

        it('should return mock module with ConfigSchema and ConfigSubPropsSchemas', () => {
            const mockModule = MockConfigSchema.getMockModule();

            expect(mockModule).toHaveProperty('ConfigSchema');
            expect(mockModule).toHaveProperty('ConfigSubPropsSchemas');
        });
    });

    describe('MockContractInterface', () => {
        it('should create Contract with all required properties', () => {
            const contract = MockContractInterface.createContract();

            expect(contract).toHaveProperty('namespace');
            expect(contract).toHaveProperty('contractName');
            expect(contract).toHaveProperty('controllerName');
            expect(contract).toHaveProperty('fields');
            expect(contract).toHaveProperty('messages');
            expect(contract).toHaveProperty('services');
        });

        it('should create ContractField with all required properties', () => {
            const field = MockContractInterface.createContractField();

            expect(field).toHaveProperty('propertyKey');
            expect(field).toHaveProperty('protoType');
        });

        it('should create ContractMessage with properties field', () => {
            const message = MockContractInterface.createContractMessage();

            expect(message).toHaveProperty('propertyKey');
            expect(message).toHaveProperty('name');
            expect(message).toHaveProperty('properties');
            expect(message.properties).toHaveProperty('field1');
        });

        it('should create ContractService with all required properties', () => {
            const service = MockContractInterface.createContractService();

            expect(service).toHaveProperty('propertyKey');
            expect(service).toHaveProperty('name');
            expect(service).toHaveProperty('path');
            expect(service).toHaveProperty('method');
            expect(service).toHaveProperty('request');
            expect(service).toHaveProperty('response');
        });

        it('should create ContractIndex with fields array', () => {
            const index = MockContractInterface.createContractIndex();

            expect(index).toHaveProperty('name');
            expect(index).toHaveProperty('fields');
            expect(Array.isArray(index.fields)).toBe(true);
            expect(index.fields).toContain('field1');
            expect(index.fields).toContain('field2');
        });

        it('should return mock module with all contract interfaces', () => {
            const mockModule = MockContractInterface.getMockModule();

            expect(mockModule).toHaveProperty('IContract');
            expect(mockModule).toHaveProperty('IContractField');
            expect(mockModule).toHaveProperty('IContractMessage');
            expect(mockModule).toHaveProperty('IContractService');
            expect(mockModule).toHaveProperty('IContractIndex');
        });
    });

    describe('MockHttpServerInterface', () => {
        it('should create RequestHandler that calls next if provided', () => {
            const handler = MockHttpServerInterface.createRequestHandler();
            const next = vi.fn();

            expect(typeof handler).toBe('function');

            const result = handler({}, {}, next);
            expect(next).toHaveBeenCalled();
            expect(result).toHaveProperty('status', 200);
            expect(result).toHaveProperty('data', 'mock');
        });

        it('should create HttpServer with all required methods', () => {
            const server = MockHttpServerInterface.createHttpServer();

            expect(server).toHaveProperty('use');
            expect(server).toHaveProperty('get');
            expect(server).toHaveProperty('post');
            expect(server).toHaveProperty('head');
            expect(server).toHaveProperty('delete');
            expect(server).toHaveProperty('put');
            expect(server).toHaveProperty('patch');
            expect(server).toHaveProperty('all');
            expect(server).toHaveProperty('options');
            expect(server).toHaveProperty('listen');
            expect(server).toHaveProperty('getHttpServer');
        });

        it('should have methods that return "this" for chaining', () => {
            const server = MockHttpServerInterface.createHttpServer();

            expect(server.use()).toBe(server);
            expect(server.get()).toBe(server);
            expect(server.post()).toBe(server);
        });

        it('should reset all mock functions', () => {
            const server = MockHttpServerInterface.createHttpServer();
            server.get.mockImplementation(() => 'customReturn');

            expect(server.get()).toBe('customReturn');

            MockHttpServerInterface.reset();
            const newServer = MockHttpServerInterface.createHttpServer();

            expect(newServer.get()).toBe(newServer);
        });

        it('should return mock module with RequestHandler and HttpServer', () => {
            const mockModule = MockHttpServerInterface.getMockModule();

            expect(mockModule).toHaveProperty('RequestHandler');
            expect(mockModule).toHaveProperty('HttpServer');
        });
    });

    describe('MockHttpSettingsInterface', () => {
        it('should create HttpSettings with common server properties', () => {
            const settings = MockHttpSettingsInterface.createHttpSettings();

            expect(settings).toHaveProperty('port');
            expect(settings).toHaveProperty('host');
            expect(settings).toHaveProperty('cors');
            expect(settings).toHaveProperty('bodyParser');
            expect(settings).toHaveProperty('compression');
        });

        it('should return mock module with IHTTPSettings', () => {
            const mockModule = MockHttpSettingsInterface.getMockModule();

            expect(mockModule).toHaveProperty('IHTTPSettings');
        });
    });

    describe('MockPluginInterface', () => {
        it('should define PluginClientSupport enum', () => {
            expect(MockPluginInterface.PluginClientSupport).toHaveProperty(
                'VUE',
            );
            expect(MockPluginInterface.PluginClientSupport).toHaveProperty(
                'REACT',
            );
            expect(MockPluginInterface.PluginClientSupport).toHaveProperty(
                'ANGULAR',
            );
            expect(MockPluginInterface.PluginClientSupport).toHaveProperty(
                'SVELTE',
            );
            expect(MockPluginInterface.PluginClientSupport).toHaveProperty(
                'SOLID',
            );
            expect(MockPluginInterface.PluginClientSupport).toHaveProperty(
                'QWIK',
            );
            expect(MockPluginInterface.PluginClientSupport).toHaveProperty(
                'SOLIDJS',
            );
        });

        it('should define PluginAPISupport enum', () => {
            expect(MockPluginInterface.PluginAPISupport).toHaveProperty(
                'GRAPHQL',
            );
            expect(MockPluginInterface.PluginAPISupport).toHaveProperty('REST');
            expect(MockPluginInterface.PluginAPISupport).toHaveProperty('RPC');
        });

        it('should create Plugin with all required properties', () => {
            const plugin = MockPluginInterface.createPlugin();

            expect(plugin).toHaveProperty('name');
            expect(plugin).toHaveProperty('version');
            expect(plugin).toHaveProperty('description');
            expect(plugin).toHaveProperty('api');
            expect(plugin).toHaveProperty('admin');
            expect(plugin).toHaveProperty('clients');
            expect(plugin).toHaveProperty('contracts');
            expect(plugin).toHaveProperty('dependencies');
            expect(plugin).toHaveProperty('clientSupport');
            expect(plugin).toHaveProperty('apiSupport');
        });

        it('should create PluginContract with MockContract', () => {
            const contract = MockPluginInterface.createPluginContract();

            expect(contract).toHaveProperty('MockContract');
            expect(typeof contract.MockContract).toBe('function');
        });

        it('should create PluginClient with client framework properties', () => {
            const client = MockPluginInterface.createPluginClient();

            expect(client).toHaveProperty('vue');
            expect(client).toHaveProperty('react');
            expect(client).toHaveProperty('angular');
            expect(client).toHaveProperty('svelte');
            expect(client).toHaveProperty('solid');
            expect(client).toHaveProperty('qwik');
            expect(client).toHaveProperty('solidjs');
        });

        it('should create PluginAdmin with navbar', () => {
            const admin = MockPluginInterface.createPluginAdmin();

            expect(admin).toHaveProperty('navbav');
            expect(admin.navbav).toHaveProperty('mockNav');
        });

        it('should create NavbarItem with route properties', () => {
            const navItem = MockPluginInterface.createNavbarItem();

            expect(navItem).toHaveProperty('route');
            expect(navItem).toHaveProperty('contract');
            expect(navItem).toHaveProperty('view');
        });

        it('should return mock module with all plugin interfaces', () => {
            const mockModule = MockPluginInterface.getMockModule();

            expect(mockModule).toHaveProperty('PluginClientSupport');
            expect(mockModule).toHaveProperty('PluginAPISupport');
            expect(mockModule).toHaveProperty('IPlugin');
            expect(mockModule).toHaveProperty('IPluginContract');
            expect(mockModule).toHaveProperty('IPluginClient');
            expect(mockModule).toHaveProperty('IPluginAdmin');
            expect(mockModule).toHaveProperty('INavbarItem');
        });
    });

    describe('MockSchedulingEnum', () => {
        it('should define CronExpression enum with common patterns', () => {
            expect(MockSchedulingEnum.CronExpression).toHaveProperty(
                'EVERY_SECOND',
            );
            expect(MockSchedulingEnum.CronExpression).toHaveProperty(
                'EVERY_MINUTE',
            );
            expect(MockSchedulingEnum.CronExpression).toHaveProperty(
                'EVERY_HOUR',
            );
            expect(MockSchedulingEnum.CronExpression).toHaveProperty(
                'EVERY_DAY_AT_MIDNIGHT',
            );
            expect(MockSchedulingEnum.CronExpression).toHaveProperty(
                'EVERY_WEEK',
            );
            expect(MockSchedulingEnum.CronExpression).toHaveProperty(
                'EVERY_MONTH',
            );
            expect(MockSchedulingEnum.CronExpression).toHaveProperty(
                'EVERY_YEAR',
            );
        });

        it('should have valid cron pattern for each expression', () => {
            expect(MockSchedulingEnum.CronExpression.EVERY_SECOND).toBe(
                '* * * * * *',
            );
            expect(MockSchedulingEnum.CronExpression.EVERY_MINUTE).toBe(
                '*/1 * * * *',
            );
        });

        it('should return mock module with CronExpression', () => {
            const mockModule = MockSchedulingEnum.getMockModule();

            expect(mockModule).toHaveProperty('CronExpression');
        });
    });

    describe('Central MockInterfaces', () => {
        it('should provide access to all interface mocks', () => {
            expect(MockInterfaces.ConfigSchema).toBe(MockConfigSchema);
            expect(MockInterfaces.ContractInterface).toBe(
                MockContractInterface,
            );
            expect(MockInterfaces.HttpServerInterface).toBe(
                MockHttpServerInterface,
            );
            expect(MockInterfaces.HttpSettingsInterface).toBe(
                MockHttpSettingsInterface,
            );
            expect(MockInterfaces.PluginInterface).toBe(MockPluginInterface);
            expect(MockInterfaces.SchedulingEnum).toBe(MockSchedulingEnum);
        });

        it('should reset HTTP server interface', () => {
            const server = MockHttpServerInterface.createHttpServer();
            server.get.mockImplementation(() => 'customReturn');

            expect(server.get()).toBe('customReturn');

            MockInterfaces.reset();
            const newServer = MockHttpServerInterface.createHttpServer();

            expect(newServer.get()).toBe(newServer);
        });

        it('should return a consolidated mock module with all interfaces', () => {
            const mockModule = MockInterfaces.getMockModule();

            // Config interfaces
            expect(mockModule).toHaveProperty('ConfigSchema');
            expect(mockModule).toHaveProperty('ConfigSubPropsSchemas');

            // Contract interfaces
            expect(mockModule).toHaveProperty('IContract');
            expect(mockModule).toHaveProperty('IContractField');

            // HTTP interfaces
            expect(mockModule).toHaveProperty('RequestHandler');
            expect(mockModule).toHaveProperty('HttpServer');
            expect(mockModule).toHaveProperty('IHTTPSettings');

            // Plugin interfaces
            expect(mockModule).toHaveProperty('PluginClientSupport');
            expect(mockModule).toHaveProperty('IPlugin');

            // Scheduling enum
            expect(mockModule).toHaveProperty('CronExpression');
        });
    });

    it('should expose mockInterfaces constant equal to MockInterfaces class', () => {
        expect(mockInterfaces).toBe(MockInterfaces);
    });
});
