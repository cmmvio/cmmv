import { vi } from 'vitest';

/**
 * Mock for core decorators
 */
export class MockDecorators {
    // Contract Decorator Mocks
    public static Contract = vi.fn().mockImplementation(() => {
        return vi.fn();
    });

    public static ContractField = vi.fn().mockImplementation(() => {
        return vi.fn();
    });

    public static ContractMethod = vi.fn().mockImplementation(() => {
        return vi.fn();
    });

    public static ContractMessage = vi.fn().mockImplementation(() => {
        return vi.fn();
    });

    public static ContractService = vi.fn().mockImplementation(() => {
        return vi.fn();
    });

    // Hook Decorator Mock
    public static Hook = vi.fn().mockImplementation(() => {
        return vi.fn();
    });

    // Interceptor Decorator Mock
    public static Interceptor = vi.fn().mockImplementation(() => {
        return vi.fn();
    });

    // SetMetadata Decorator Mock
    public static SetMetadata = vi
        .fn()
        .mockImplementation((metadataKey, metadataValue) => {
            const decoratorFactory = vi.fn();
            // @ts-ignore
            decoratorFactory.KEY = metadataKey;
            return decoratorFactory;
        });

    // MixedDecorator Mock
    public static MixedDecorator = vi.fn().mockImplementation(() => {
        return vi.fn();
    });

    // Resolver Decorator Mock
    public static Resolver = vi.fn().mockImplementation(() => {
        return vi.fn();
    });

    // Cron Decorator Mock
    public static Cron = vi.fn().mockImplementation(() => {
        return vi.fn();
    });

    // Service Decorator Mock
    public static Service = vi.fn().mockImplementation(() => {
        return vi.fn();
    });

    // Metadata symbols mocks
    public static CONTRACT_METADATA = {
        NAMESPACE_METADATA: Symbol('namespace_metadata'),
        PUBLIC_METADATA: Symbol('public_metadata'),
        CONTRACT_WATERMARK: Symbol('contract_watermark'),
        CONTROLLER_NAME_METADATA: Symbol('controller_name_metadata'),
        SUB_PATH_METADATA: Symbol('sub_path_metadata'),
        PROTO_PATH_METADATA: Symbol('proto_path_metadata'),
        PROTO_PACKAGE_METADATA: Symbol('proto_package_metadata'),
        DATABASE_TYPE_METADATA: Symbol('database_type_metadata'),
        FIELD_METADATA: Symbol('contract_field_metadata'),
        METHOD_METADATA: Symbol('contract_method_metadata'),
        MESSAGE_METADATA: Symbol('contract_message_metadata'),
        SERVICE_METADATA: Symbol('contract_service_metadata'),
        DIRECTMESSAGE_METADATA: Symbol('contract_directmessage_metadata'),
        GENERATE_CONTROLLER_METADATA: Symbol('generate_controller_metadata'),
        GENERATE_ENTITIES_METADATA: Symbol('generate_entities_metadata'),
        GENERATE_BOILERPLATES_METADATA: Symbol(
            'generate_boilerplates_metadata',
        ),
        AUTH_METADATA: Symbol('auth_metadata'),
        ROOTONLY_METADATA: Symbol('rootonly_metadata'),
        CONTROLLER_CUSTOM_PATH_METADATA: Symbol(
            'controller_custom_path_metadata',
        ),
        CONTROLLER_IMPORTS: Symbol('contract_imports'),
        CONTROLLER_INDEXS: Symbol('contract_indexs'),
        CONTROLLER_CACHE: Symbol('contract_cache'),
        CONTROLLER_OPTIONS: Symbol('contract_options'),
        CONTROLLER_VIEWFORM: Symbol('contract_viewform'),
        CONTROLLER_VIEWPAGE: Symbol('contract_viewpage'),
    };

    public static CRON_METADATA = Symbol('CRON_METADATA');

    /**
     * Reset all mocks
     */
    public static reset(): void {
        MockDecorators.Contract.mockReset();
        MockDecorators.ContractField.mockReset();
        MockDecorators.ContractMethod.mockReset();
        MockDecorators.ContractMessage.mockReset();
        MockDecorators.ContractService.mockReset();
        MockDecorators.Hook.mockReset();
        MockDecorators.Interceptor.mockReset();
        MockDecorators.SetMetadata.mockReset();
        MockDecorators.MixedDecorator.mockReset();
        MockDecorators.Resolver.mockReset();
        MockDecorators.Cron.mockReset();
        MockDecorators.Service.mockReset();

        // Restore implementations
        MockDecorators.Contract.mockImplementation(() => vi.fn());
        MockDecorators.ContractField.mockImplementation(() => vi.fn());
        MockDecorators.ContractMethod.mockImplementation(() => vi.fn());
        MockDecorators.ContractMessage.mockImplementation(() => vi.fn());
        MockDecorators.ContractService.mockImplementation(() => vi.fn());
        MockDecorators.Hook.mockImplementation(() => vi.fn());
        MockDecorators.Interceptor.mockImplementation(() => vi.fn());
        MockDecorators.SetMetadata.mockImplementation(
            (metadataKey, metadataValue) => {
                const decoratorFactory = vi.fn();
                // @ts-ignore
                decoratorFactory.KEY = metadataKey;
                return decoratorFactory;
            },
        );
        MockDecorators.MixedDecorator.mockImplementation(() => vi.fn());
        MockDecorators.Resolver.mockImplementation(() => vi.fn());
        MockDecorators.Cron.mockImplementation(() => vi.fn());
        MockDecorators.Service.mockImplementation(() => vi.fn());
    }

    /**
     * Returns mock module for contract.decorator.ts
     */
    public static getContractDecoratorMock() {
        return {
            Contract: MockDecorators.Contract,
            ContractField: MockDecorators.ContractField,
            ContractMethod: MockDecorators.ContractMethod,
            ContractMessage: MockDecorators.ContractMessage,
            ContractService: MockDecorators.ContractService,
            NAMESPACE_METADATA:
                MockDecorators.CONTRACT_METADATA.NAMESPACE_METADATA,
            PUBLIC_METADATA: MockDecorators.CONTRACT_METADATA.PUBLIC_METADATA,
            CONTRACT_WATERMARK:
                MockDecorators.CONTRACT_METADATA.CONTRACT_WATERMARK,
            CONTROLLER_NAME_METADATA:
                MockDecorators.CONTRACT_METADATA.CONTROLLER_NAME_METADATA,
            SUB_PATH_METADATA:
                MockDecorators.CONTRACT_METADATA.SUB_PATH_METADATA,
            PROTO_PATH_METADATA:
                MockDecorators.CONTRACT_METADATA.PROTO_PATH_METADATA,
            PROTO_PACKAGE_METADATA:
                MockDecorators.CONTRACT_METADATA.PROTO_PACKAGE_METADATA,
            DATABASE_TYPE_METADATA:
                MockDecorators.CONTRACT_METADATA.DATABASE_TYPE_METADATA,
            FIELD_METADATA: MockDecorators.CONTRACT_METADATA.FIELD_METADATA,
            METHOD_METADATA: MockDecorators.CONTRACT_METADATA.METHOD_METADATA,
            MESSAGE_METADATA: MockDecorators.CONTRACT_METADATA.MESSAGE_METADATA,
            SERVICE_METADATA: MockDecorators.CONTRACT_METADATA.SERVICE_METADATA,
            DIRECTMESSAGE_METADATA:
                MockDecorators.CONTRACT_METADATA.DIRECTMESSAGE_METADATA,
            GENERATE_CONTROLLER_METADATA:
                MockDecorators.CONTRACT_METADATA.GENERATE_CONTROLLER_METADATA,
            GENERATE_ENTITIES_METADATA:
                MockDecorators.CONTRACT_METADATA.GENERATE_ENTITIES_METADATA,
            GENERATE_BOILERPLATES_METADATA:
                MockDecorators.CONTRACT_METADATA.GENERATE_BOILERPLATES_METADATA,
            AUTH_METADATA: MockDecorators.CONTRACT_METADATA.AUTH_METADATA,
            ROOTONLY_METADATA:
                MockDecorators.CONTRACT_METADATA.ROOTONLY_METADATA,
            CONTROLLER_CUSTOM_PATH_METADATA:
                MockDecorators.CONTRACT_METADATA
                    .CONTROLLER_CUSTOM_PATH_METADATA,
            CONTROLLER_IMPORTS:
                MockDecorators.CONTRACT_METADATA.CONTROLLER_IMPORTS,
            CONTROLLER_INDEXS:
                MockDecorators.CONTRACT_METADATA.CONTROLLER_INDEXS,
            CONTROLLER_CACHE: MockDecorators.CONTRACT_METADATA.CONTROLLER_CACHE,
            CONTROLLER_OPTIONS:
                MockDecorators.CONTRACT_METADATA.CONTROLLER_OPTIONS,
            CONTROLLER_VIEWFORM:
                MockDecorators.CONTRACT_METADATA.CONTROLLER_VIEWFORM,
            CONTROLLER_VIEWPAGE:
                MockDecorators.CONTRACT_METADATA.CONTROLLER_VIEWPAGE,
        };
    }

    /**
     * Returns mock module for hooks.decorator.ts
     */
    public static getHooksDecoratorMock() {
        return {
            Hook: MockDecorators.Hook,
        };
    }

    /**
     * Returns mock module for interceptor.decorator.ts
     */
    public static getInterceptorDecoratorMock() {
        return {
            Interceptor: MockDecorators.Interceptor,
        };
    }

    /**
     * Returns mock module for metadata.decorator.ts
     */
    public static getMetadataDecoratorMock() {
        return {
            SetMetadata: MockDecorators.SetMetadata,
        };
    }

    /**
     * Returns mock module for mixed.decorator.ts
     */
    public static getMixedDecoratorMock() {
        return {
            MixedDecorator: MockDecorators.MixedDecorator,
        };
    }

    /**
     * Returns mock module for resolver.decorator.ts
     */
    public static getResolverDecoratorMock() {
        return {
            Resolver: MockDecorators.Resolver,
        };
    }

    /**
     * Returns mock module for scheduling.decorator.ts
     */
    public static getSchedulingDecoratorMock() {
        return {
            Cron: MockDecorators.Cron,
            CRON_METADATA: MockDecorators.CRON_METADATA,
        };
    }

    /**
     * Returns mock module for service.decorator.ts
     */
    public static getServiceDecoratorMock() {
        return {
            Service: MockDecorators.Service,
        };
    }

    /**
     * Returns mock module structure for all decorators
     */
    public static getMockModule() {
        return {
            // Contract decorators
            Contract: MockDecorators.Contract,
            ContractField: MockDecorators.ContractField,
            ContractMethod: MockDecorators.ContractMethod,
            ContractMessage: MockDecorators.ContractMessage,
            ContractService: MockDecorators.ContractService,

            // Contract metadata symbols
            NAMESPACE_METADATA:
                MockDecorators.CONTRACT_METADATA.NAMESPACE_METADATA,
            PUBLIC_METADATA: MockDecorators.CONTRACT_METADATA.PUBLIC_METADATA,
            CONTRACT_WATERMARK:
                MockDecorators.CONTRACT_METADATA.CONTRACT_WATERMARK,
            CONTROLLER_NAME_METADATA:
                MockDecorators.CONTRACT_METADATA.CONTROLLER_NAME_METADATA,
            SUB_PATH_METADATA:
                MockDecorators.CONTRACT_METADATA.SUB_PATH_METADATA,
            PROTO_PATH_METADATA:
                MockDecorators.CONTRACT_METADATA.PROTO_PATH_METADATA,
            PROTO_PACKAGE_METADATA:
                MockDecorators.CONTRACT_METADATA.PROTO_PACKAGE_METADATA,
            DATABASE_TYPE_METADATA:
                MockDecorators.CONTRACT_METADATA.DATABASE_TYPE_METADATA,
            FIELD_METADATA: MockDecorators.CONTRACT_METADATA.FIELD_METADATA,
            METHOD_METADATA: MockDecorators.CONTRACT_METADATA.METHOD_METADATA,
            MESSAGE_METADATA: MockDecorators.CONTRACT_METADATA.MESSAGE_METADATA,
            SERVICE_METADATA: MockDecorators.CONTRACT_METADATA.SERVICE_METADATA,
            DIRECTMESSAGE_METADATA:
                MockDecorators.CONTRACT_METADATA.DIRECTMESSAGE_METADATA,
            GENERATE_CONTROLLER_METADATA:
                MockDecorators.CONTRACT_METADATA.GENERATE_CONTROLLER_METADATA,
            GENERATE_ENTITIES_METADATA:
                MockDecorators.CONTRACT_METADATA.GENERATE_ENTITIES_METADATA,
            GENERATE_BOILERPLATES_METADATA:
                MockDecorators.CONTRACT_METADATA.GENERATE_BOILERPLATES_METADATA,
            AUTH_METADATA: MockDecorators.CONTRACT_METADATA.AUTH_METADATA,
            ROOTONLY_METADATA:
                MockDecorators.CONTRACT_METADATA.ROOTONLY_METADATA,
            CONTROLLER_CUSTOM_PATH_METADATA:
                MockDecorators.CONTRACT_METADATA
                    .CONTROLLER_CUSTOM_PATH_METADATA,
            CONTROLLER_IMPORTS:
                MockDecorators.CONTRACT_METADATA.CONTROLLER_IMPORTS,
            CONTROLLER_INDEXS:
                MockDecorators.CONTRACT_METADATA.CONTROLLER_INDEXS,
            CONTROLLER_CACHE: MockDecorators.CONTRACT_METADATA.CONTROLLER_CACHE,
            CONTROLLER_OPTIONS:
                MockDecorators.CONTRACT_METADATA.CONTROLLER_OPTIONS,
            CONTROLLER_VIEWFORM:
                MockDecorators.CONTRACT_METADATA.CONTROLLER_VIEWFORM,
            CONTROLLER_VIEWPAGE:
                MockDecorators.CONTRACT_METADATA.CONTROLLER_VIEWPAGE,

            // Other decorators
            Hook: MockDecorators.Hook,
            Interceptor: MockDecorators.Interceptor,
            SetMetadata: MockDecorators.SetMetadata,
            MixedDecorator: MockDecorators.MixedDecorator,
            Resolver: MockDecorators.Resolver,
            Cron: MockDecorators.Cron,
            CRON_METADATA: MockDecorators.CRON_METADATA,
            Service: MockDecorators.Service,
        };
    }
}

// Contract decorator exports
export const Contract = MockDecorators.Contract;
export const ContractField = MockDecorators.ContractField;
export const ContractMethod = MockDecorators.ContractMethod;
export const ContractMessage = MockDecorators.ContractMessage;
export const ContractService = MockDecorators.ContractService;

// Contract metadata symbols
export const NAMESPACE_METADATA =
    MockDecorators.CONTRACT_METADATA.NAMESPACE_METADATA;
export const PUBLIC_METADATA = MockDecorators.CONTRACT_METADATA.PUBLIC_METADATA;
export const CONTRACT_WATERMARK =
    MockDecorators.CONTRACT_METADATA.CONTRACT_WATERMARK;
export const CONTROLLER_NAME_METADATA =
    MockDecorators.CONTRACT_METADATA.CONTROLLER_NAME_METADATA;
export const SUB_PATH_METADATA =
    MockDecorators.CONTRACT_METADATA.SUB_PATH_METADATA;
export const PROTO_PATH_METADATA =
    MockDecorators.CONTRACT_METADATA.PROTO_PATH_METADATA;
export const PROTO_PACKAGE_METADATA =
    MockDecorators.CONTRACT_METADATA.PROTO_PACKAGE_METADATA;
export const DATABASE_TYPE_METADATA =
    MockDecorators.CONTRACT_METADATA.DATABASE_TYPE_METADATA;
export const FIELD_METADATA = MockDecorators.CONTRACT_METADATA.FIELD_METADATA;
export const METHOD_METADATA = MockDecorators.CONTRACT_METADATA.METHOD_METADATA;
export const MESSAGE_METADATA =
    MockDecorators.CONTRACT_METADATA.MESSAGE_METADATA;
export const SERVICE_METADATA =
    MockDecorators.CONTRACT_METADATA.SERVICE_METADATA;
export const DIRECTMESSAGE_METADATA =
    MockDecorators.CONTRACT_METADATA.DIRECTMESSAGE_METADATA;
export const GENERATE_CONTROLLER_METADATA =
    MockDecorators.CONTRACT_METADATA.GENERATE_CONTROLLER_METADATA;
export const GENERATE_ENTITIES_METADATA =
    MockDecorators.CONTRACT_METADATA.GENERATE_ENTITIES_METADATA;
export const GENERATE_BOILERPLATES_METADATA =
    MockDecorators.CONTRACT_METADATA.GENERATE_BOILERPLATES_METADATA;
export const AUTH_METADATA = MockDecorators.CONTRACT_METADATA.AUTH_METADATA;
export const ROOTONLY_METADATA =
    MockDecorators.CONTRACT_METADATA.ROOTONLY_METADATA;
export const CONTROLLER_CUSTOM_PATH_METADATA =
    MockDecorators.CONTRACT_METADATA.CONTROLLER_CUSTOM_PATH_METADATA;
export const CONTROLLER_IMPORTS =
    MockDecorators.CONTRACT_METADATA.CONTROLLER_IMPORTS;
export const CONTROLLER_INDEXS =
    MockDecorators.CONTRACT_METADATA.CONTROLLER_INDEXS;
export const CONTROLLER_CACHE =
    MockDecorators.CONTRACT_METADATA.CONTROLLER_CACHE;
export const CONTROLLER_OPTIONS =
    MockDecorators.CONTRACT_METADATA.CONTROLLER_OPTIONS;
export const CONTROLLER_VIEWFORM =
    MockDecorators.CONTRACT_METADATA.CONTROLLER_VIEWFORM;
export const CONTROLLER_VIEWPAGE =
    MockDecorators.CONTRACT_METADATA.CONTROLLER_VIEWPAGE;

// Other decorator exports
export const Hook = MockDecorators.Hook;
export const Interceptor = MockDecorators.Interceptor;
export const SetMetadata = MockDecorators.SetMetadata;
export const MixedDecorator = MockDecorators.MixedDecorator;
export const Resolver = MockDecorators.Resolver;
export const Cron = MockDecorators.Cron;
export const CRON_METADATA = MockDecorators.CRON_METADATA;
export const Service = MockDecorators.Service;

/**
 * Central export to use in mocking
 */
export const mockDecorators = MockDecorators;
