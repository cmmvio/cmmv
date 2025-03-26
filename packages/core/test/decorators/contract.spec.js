"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const tslib_1 = require("tslib");
require("reflect-metadata");
const vitest_1 = require("vitest");
const contract_decorator_1 = require("../../decorators/contract.decorator");
(0, vitest_1.describe)('Contract Decorator', () => {
    (0, vitest_1.it)('should apply default metadata when no options are provided', () => {
        let TestClass = class TestClass {
        };
        TestClass = tslib_1.__decorate([
            (0, contract_decorator_1.Contract)()
        ], TestClass);
        (0, vitest_1.expect)(Reflect.getMetadata(contract_decorator_1.CONTRACT_WATERMARK, TestClass)).toBe(true);
        (0, vitest_1.expect)(Reflect.getMetadata(contract_decorator_1.CONTROLLER_NAME_METADATA, TestClass)).toBe('DefaultContract');
        (0, vitest_1.expect)(Reflect.getMetadata(contract_decorator_1.PROTO_PATH_METADATA, TestClass)).toBe('contract.proto');
        (0, vitest_1.expect)(Reflect.getMetadata(contract_decorator_1.PROTO_PACKAGE_METADATA, TestClass)).toBe('');
    });
    (0, vitest_1.it)('should apply provided metadata options', () => {
        const options = {
            controllerName: 'CustomContract',
            protoPath: 'custom.proto',
            protoPackage: 'custom.package',
            directMessage: true,
            generateController: false,
            auth: false,
            controllerCustomPath: 'custom/path',
        };
        let TestClass = class TestClass {
        };
        TestClass = tslib_1.__decorate([
            (0, contract_decorator_1.Contract)(options)
        ], TestClass);
        (0, vitest_1.expect)(Reflect.getMetadata(contract_decorator_1.CONTRACT_WATERMARK, TestClass)).toBe(true);
        (0, vitest_1.expect)(Reflect.getMetadata(contract_decorator_1.CONTROLLER_NAME_METADATA, TestClass)).toBe('CustomContract');
        (0, vitest_1.expect)(Reflect.getMetadata(contract_decorator_1.PROTO_PATH_METADATA, TestClass)).toBe('custom.proto');
        (0, vitest_1.expect)(Reflect.getMetadata(contract_decorator_1.PROTO_PACKAGE_METADATA, TestClass)).toBe('custom.package');
    });
});
(0, vitest_1.describe)('ContractField Decorator', () => {
    (0, vitest_1.it)('should apply field metadata to class properties', () => {
        const options = {
            protoType: 'string',
            protoRepeated: true,
            defaultValue: 'default',
            index: true,
            unique: false,
        };
        let TestClass = class TestClass {
        };
        tslib_1.__decorate([
            (0, contract_decorator_1.ContractField)(options),
            tslib_1.__metadata("design:type", String)
        ], TestClass.prototype, "testField", void 0);
        TestClass = tslib_1.__decorate([
            (0, contract_decorator_1.Contract)()
        ], TestClass);
        const contract = new TestClass();
        const target = contract.constructor || contract;
        const prototype = target.prototype || contract.prototype;
        const fieldMetadata = Reflect.getMetadata(contract_decorator_1.FIELD_METADATA, prototype).find((field) => field.propertyKey === 'testField');
        (0, vitest_1.expect)(fieldMetadata.protoType).toBe('string');
        (0, vitest_1.expect)(fieldMetadata.protoRepeated).toBe(true);
        (0, vitest_1.expect)(fieldMetadata.defaultValue).toBe('default');
        (0, vitest_1.expect)(fieldMetadata.index).toBe(true);
        (0, vitest_1.expect)(fieldMetadata.unique).toBe(false);
    });
    (0, vitest_1.it)('should handle multiple fields on the same class', () => {
        class TestClass {
        }
        tslib_1.__decorate([
            (0, contract_decorator_1.ContractField)({ protoType: 'string' }),
            tslib_1.__metadata("design:type", String)
        ], TestClass.prototype, "field1", void 0);
        tslib_1.__decorate([
            (0, contract_decorator_1.ContractField)({ protoType: 'int32', defaultValue: 42 }),
            tslib_1.__metadata("design:type", Number)
        ], TestClass.prototype, "field2", void 0);
        const contract = new TestClass();
        const target = contract.constructor || contract;
        const prototype = target.prototype || contract.prototype;
        const field1Metadata = Reflect.getMetadata(contract_decorator_1.FIELD_METADATA, prototype).find((field) => field.propertyKey === 'field1');
        const field2Metadata = Reflect.getMetadata(contract_decorator_1.FIELD_METADATA, prototype).find((field) => field.propertyKey === 'field2');
        (0, vitest_1.expect)(field1Metadata.protoType).toBe('string');
        (0, vitest_1.expect)(field2Metadata.protoType).toBe('int32');
        (0, vitest_1.expect)(field2Metadata.defaultValue).toBe(42);
    });
});
(0, vitest_1.describe)('Contract Decorator Additional Tests', () => {
    (0, vitest_1.it)('should apply auth and cache metadata when provided', () => {
        const options = {
            controllerName: 'AuthContract',
            protoPath: 'auth.proto',
            protoPackage: 'auth.package',
            auth: true,
            cache: { key: 'authCacheKey', ttl: 3600 },
        };
        let AuthClass = class AuthClass {
        };
        AuthClass = tslib_1.__decorate([
            (0, contract_decorator_1.Contract)(options)
        ], AuthClass);
        (0, vitest_1.expect)(Reflect.getMetadata(contract_decorator_1.CONTROLLER_NAME_METADATA, AuthClass)).toBe('AuthContract');
        (0, vitest_1.expect)(Reflect.getMetadata(contract_decorator_1.PROTO_PATH_METADATA, AuthClass)).toBe('auth.proto');
        (0, vitest_1.expect)(Reflect.getMetadata(contract_decorator_1.PROTO_PACKAGE_METADATA, AuthClass)).toBe('auth.package');
        (0, vitest_1.expect)(Reflect.getMetadata(contract_decorator_1.AUTH_METADATA, AuthClass)).toBe(true);
        (0, vitest_1.expect)(Reflect.getMetadata(contract_decorator_1.CONTROLLER_CACHE, AuthClass)).toEqual({
            key: 'authCacheKey',
            ttl: 3600,
        });
    });
    (0, vitest_1.it)('should handle contract imports and custom paths', () => {
        const options = {
            controllerName: 'ImportContract',
            protoPath: 'import.proto',
            imports: ['import1', 'import2'],
            controllerCustomPath: 'custom/import/path',
        };
        let ImportClass = class ImportClass {
        };
        ImportClass = tslib_1.__decorate([
            (0, contract_decorator_1.Contract)(options)
        ], ImportClass);
        (0, vitest_1.expect)(Reflect.getMetadata(contract_decorator_1.CONTROLLER_NAME_METADATA, ImportClass)).toBe('ImportContract');
        (0, vitest_1.expect)(Reflect.getMetadata(contract_decorator_1.CONTROLLER_IMPORTS, ImportClass)).toEqual([
            'import1',
            'import2',
        ]);
        (0, vitest_1.expect)(Reflect.getMetadata(contract_decorator_1.CONTROLLER_CUSTOM_PATH_METADATA, ImportClass)).toBe('custom/import/path');
    });
});
(0, vitest_1.describe)('ContractField Decorator Additional Tests', () => {
    (0, vitest_1.it)('should apply transform and validation options correctly', () => {
        const options = {
            protoType: 'string',
            transform: (value) => value.toUpperCase(),
            validations: [{ type: 'required', message: 'Field is required' }],
        };
        let TransformClass = class TransformClass {
        };
        tslib_1.__decorate([
            (0, contract_decorator_1.ContractField)(options),
            tslib_1.__metadata("design:type", String)
        ], TransformClass.prototype, "name", void 0);
        TransformClass = tslib_1.__decorate([
            (0, contract_decorator_1.Contract)()
        ], TransformClass);
        const contract = new TransformClass();
        const target = contract.constructor || contract;
        const prototype = target.prototype || contract.prototype;
        const fieldMetadata = Reflect.getMetadata(contract_decorator_1.FIELD_METADATA, prototype).find((field) => field.propertyKey === 'name');
        (0, vitest_1.expect)(fieldMetadata.protoType).toBe('string');
        (0, vitest_1.expect)(typeof fieldMetadata.transform).toBe('function');
        (0, vitest_1.expect)(fieldMetadata.validations).toEqual([
            { type: 'required', message: 'Field is required' },
        ]);
    });
    (0, vitest_1.it)('should apply nullable and exclude options', () => {
        const options1 = { protoType: 'string', nullable: true };
        const options2 = { protoType: 'int32', exclude: true };
        let NullableExcludeClass = class NullableExcludeClass {
        };
        tslib_1.__decorate([
            (0, contract_decorator_1.ContractField)(options1),
            tslib_1.__metadata("design:type", String)
        ], NullableExcludeClass.prototype, "optionalField", void 0);
        tslib_1.__decorate([
            (0, contract_decorator_1.ContractField)(options2),
            tslib_1.__metadata("design:type", Number)
        ], NullableExcludeClass.prototype, "excludedField", void 0);
        NullableExcludeClass = tslib_1.__decorate([
            (0, contract_decorator_1.Contract)()
        ], NullableExcludeClass);
        const contract = new NullableExcludeClass();
        const target = contract.constructor || contract;
        const prototype = target.prototype || contract.prototype;
        const field1Metadata = Reflect.getMetadata(contract_decorator_1.FIELD_METADATA, prototype).find((field) => field.propertyKey === 'optionalField');
        const field2Metadata = Reflect.getMetadata(contract_decorator_1.FIELD_METADATA, prototype).find((field) => field.propertyKey === 'excludedField');
        (0, vitest_1.expect)(field1Metadata.protoType).toBe('string');
        (0, vitest_1.expect)(field1Metadata.nullable).toBe(true);
        (0, vitest_1.expect)(field2Metadata.protoType).toBe('int32');
        (0, vitest_1.expect)(field2Metadata.exclude).toBe(true);
    });
    (0, vitest_1.it)('should handle toClassOnly option correctly', () => {
        const options = { protoType: 'string', toClassOnly: true };
        let ClassOnlyFieldClass = class ClassOnlyFieldClass {
        };
        tslib_1.__decorate([
            (0, contract_decorator_1.ContractField)(options),
            tslib_1.__metadata("design:type", String)
        ], ClassOnlyFieldClass.prototype, "classOnlyField", void 0);
        ClassOnlyFieldClass = tslib_1.__decorate([
            (0, contract_decorator_1.Contract)()
        ], ClassOnlyFieldClass);
        const contract = new ClassOnlyFieldClass();
        const target = contract.constructor || contract;
        const prototype = target.prototype || contract.prototype;
        const fieldMetadata = Reflect.getMetadata(contract_decorator_1.FIELD_METADATA, prototype).find((field) => field.propertyKey === 'classOnlyField');
        (0, vitest_1.expect)(fieldMetadata.protoType).toBe('string');
        (0, vitest_1.expect)(fieldMetadata.toClassOnly).toBe(true);
    });
    (0, vitest_1.describe)('Contract Decorator with ViewForm and ViewPage', () => {
        (0, vitest_1.it)('should apply viewForm and viewPage metadata when provided', () => {
            class MockViewForm {
            }
            class MockViewPage {
            }
            const options = {
                controllerName: 'ViewContract',
                protoPath: 'view.proto',
                viewForm: MockViewForm,
                viewPage: MockViewPage,
            };
            let ViewClass = class ViewClass {
            };
            ViewClass = tslib_1.__decorate([
                (0, contract_decorator_1.Contract)(options)
            ], ViewClass);
            (0, vitest_1.expect)(Reflect.getMetadata(contract_decorator_1.CONTROLLER_NAME_METADATA, ViewClass)).toBe('ViewContract');
            (0, vitest_1.expect)(Reflect.getMetadata(contract_decorator_1.PROTO_PATH_METADATA, ViewClass)).toBe('view.proto');
            (0, vitest_1.expect)(Reflect.getMetadata(contract_decorator_1.CONTROLLER_VIEWFORM, ViewClass)).toBe(MockViewForm);
            (0, vitest_1.expect)(Reflect.getMetadata(contract_decorator_1.CONTROLLER_VIEWPAGE, ViewClass)).toBe(MockViewPage);
        });
        (0, vitest_1.it)('should apply default metadata when viewForm and viewPage are not provided', () => {
            let DefaultViewClass = class DefaultViewClass {
            };
            DefaultViewClass = tslib_1.__decorate([
                (0, contract_decorator_1.Contract)()
            ], DefaultViewClass);
            (0, vitest_1.expect)(Reflect.getMetadata(contract_decorator_1.CONTROLLER_VIEWFORM, DefaultViewClass)).toBe(null);
            (0, vitest_1.expect)(Reflect.getMetadata(contract_decorator_1.CONTROLLER_VIEWPAGE, DefaultViewClass)).toBe(null);
        });
    });
    (0, vitest_1.describe)('Contract Decorator Extended Tests for ViewForm and ViewPage', () => {
        (0, vitest_1.it)('should allow dynamic assignment of viewForm and viewPage', () => {
            class DynamicViewForm {
            }
            class DynamicViewPage {
            }
            const options = {
                controllerName: 'DynamicViewContract',
                protoPath: 'dynamic.proto',
                viewForm: DynamicViewForm,
                viewPage: DynamicViewPage,
            };
            let DynamicViewClass = class DynamicViewClass {
            };
            DynamicViewClass = tslib_1.__decorate([
                (0, contract_decorator_1.Contract)(options)
            ], DynamicViewClass);
            (0, vitest_1.expect)(Reflect.getMetadata(contract_decorator_1.CONTROLLER_VIEWFORM, DynamicViewClass)).toBe(DynamicViewForm);
            (0, vitest_1.expect)(Reflect.getMetadata(contract_decorator_1.CONTROLLER_VIEWPAGE, DynamicViewClass)).toBe(DynamicViewPage);
        });
        (0, vitest_1.it)('should handle null values for viewForm and viewPage', () => {
            const options = {
                controllerName: 'NullViewContract',
                protoPath: 'nullview.proto',
                viewForm: null,
                viewPage: null,
            };
            let NullViewClass = class NullViewClass {
            };
            NullViewClass = tslib_1.__decorate([
                (0, contract_decorator_1.Contract)(options)
            ], NullViewClass);
            (0, vitest_1.expect)(Reflect.getMetadata(contract_decorator_1.CONTROLLER_VIEWFORM, NullViewClass)).toBe(null);
            (0, vitest_1.expect)(Reflect.getMetadata(contract_decorator_1.CONTROLLER_VIEWPAGE, NullViewClass)).toBe(null);
        });
        (0, vitest_1.it)('should work with custom metadata alongside viewForm and viewPage', () => {
            class CustomViewForm {
            }
            class CustomViewPage {
            }
            const options = {
                controllerName: 'CustomViewContract',
                protoPath: 'customview.proto',
                viewForm: CustomViewForm,
                viewPage: CustomViewPage,
                imports: ['import1', 'import2'],
                cache: { key: 'customCache', ttl: 600 },
            };
            let CustomViewClass = class CustomViewClass {
            };
            CustomViewClass = tslib_1.__decorate([
                (0, contract_decorator_1.Contract)(options)
            ], CustomViewClass);
            (0, vitest_1.expect)(Reflect.getMetadata(contract_decorator_1.CONTROLLER_NAME_METADATA, CustomViewClass)).toBe('CustomViewContract');
            (0, vitest_1.expect)(Reflect.getMetadata(contract_decorator_1.CONTROLLER_VIEWFORM, CustomViewClass)).toBe(CustomViewForm);
            (0, vitest_1.expect)(Reflect.getMetadata(contract_decorator_1.CONTROLLER_VIEWPAGE, CustomViewClass)).toBe(CustomViewPage);
            (0, vitest_1.expect)(Reflect.getMetadata(contract_decorator_1.CONTROLLER_IMPORTS, CustomViewClass)).toEqual(['import1', 'import2']);
            (0, vitest_1.expect)(Reflect.getMetadata(contract_decorator_1.CONTROLLER_CACHE, CustomViewClass)).toEqual({ key: 'customCache', ttl: 600 });
        });
        (0, vitest_1.it)('should override default viewForm and viewPage with provided values', () => {
            class OverriddenViewForm {
            }
            class OverriddenViewPage {
            }
            const options = {
                controllerName: 'contracttest',
                protoPath: '',
                viewForm: OverriddenViewForm,
                viewPage: OverriddenViewPage,
            };
            let OverriddenViewClass = class OverriddenViewClass {
            };
            OverriddenViewClass = tslib_1.__decorate([
                (0, contract_decorator_1.Contract)(options)
            ], OverriddenViewClass);
            (0, vitest_1.expect)(Reflect.getMetadata(contract_decorator_1.CONTROLLER_VIEWFORM, OverriddenViewClass)).toBe(OverriddenViewForm);
            (0, vitest_1.expect)(Reflect.getMetadata(contract_decorator_1.CONTROLLER_VIEWPAGE, OverriddenViewClass)).toBe(OverriddenViewPage);
        });
        (0, vitest_1.it)('should throw error if viewForm or viewPage are invalid types', () => {
            const invalidOptions1 = {
                viewForm: 'invalidViewForm', // Invalid type
            };
            const invalidOptions2 = {
                viewPage: 123, // Invalid type
            };
            (0, vitest_1.expect)(() => {
                let InvalidViewFormClass = class InvalidViewFormClass {
                };
                InvalidViewFormClass = tslib_1.__decorate([
                    (0, contract_decorator_1.Contract)(invalidOptions1)
                ], InvalidViewFormClass);
            }).toThrowError();
            (0, vitest_1.expect)(() => {
                let InvalidViewPageClass = class InvalidViewPageClass {
                };
                InvalidViewPageClass = tslib_1.__decorate([
                    (0, contract_decorator_1.Contract)(invalidOptions2)
                ], InvalidViewPageClass);
            }).toThrowError();
        });
    });
});
