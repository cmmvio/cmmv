"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const tslib_1 = require("tslib");
const vitest_1 = require("vitest");
const scheduling_decorator_1 = require("../lib/scheduling.decorator");
const core_1 = require("@cmmv/core");
require("reflect-metadata"); // Importar reflect-metadata para os decoradores
// Mock das dependências
vitest_1.vi.mock('@cmmv/core', () => ({
    Scope: {
        addToArray: vitest_1.vi.fn(),
    },
}));
// Espionar as funções do Reflect em vez de substituí-las completamente
const originalDefineMetadata = Reflect.defineMetadata;
Reflect.defineMetadata = vitest_1.vi.fn().mockImplementation((key, value, target) => {
    return originalDefineMetadata
        ? originalDefineMetadata(key, value, target)
        : undefined;
});
(0, vitest_1.describe)('Cron Decorator', () => {
    (0, vitest_1.beforeEach)(() => {
        // Resetar os mocks
        vitest_1.vi.clearAllMocks();
    });
    (0, vitest_1.it)('should define metadata on the decorated method', () => {
        // Definir uma classe de teste com um método decorado
        class TestClass {
            testMethod() {
                return 'executed';
            }
        }
        tslib_1.__decorate([
            (0, scheduling_decorator_1.Cron)('0 0 * * *'),
            tslib_1.__metadata("design:type", Function),
            tslib_1.__metadata("design:paramtypes", []),
            tslib_1.__metadata("design:returntype", void 0)
        ], TestClass.prototype, "testMethod", null);
        // Verificar se o metadata foi definido corretamente
        (0, vitest_1.expect)(Reflect.defineMetadata).toHaveBeenCalledWith(scheduling_decorator_1.CRON_METADATA, '0 0 * * *', vitest_1.expect.any(Function));
    });
    (0, vitest_1.it)('should add the cron job to the Scope.__crons array', () => {
        // Definir uma classe de teste com um método decorado
        class TestClass {
            testMethod() {
                return 'executed';
            }
        }
        tslib_1.__decorate([
            (0, scheduling_decorator_1.Cron)('*/5 * * * *'),
            tslib_1.__metadata("design:type", Function),
            tslib_1.__metadata("design:paramtypes", []),
            tslib_1.__metadata("design:returntype", void 0)
        ], TestClass.prototype, "testMethod", null);
        // Verificar se addToArray foi chamado com os parâmetros corretos
        (0, vitest_1.expect)(core_1.Scope.addToArray).toHaveBeenCalledWith('__crons', {
            target: TestClass.prototype,
            method: vitest_1.expect.any(Function),
            cronTime: '*/5 * * * *',
        });
    });
    (0, vitest_1.it)('should preserve the original method functionality', () => {
        // Definir uma classe de teste com um método decorado
        class TestClass {
            constructor() {
                this.value = '';
            }
            testMethod(arg) {
                this.value = `processed: ${arg}`;
                return this.value;
            }
        }
        tslib_1.__decorate([
            (0, scheduling_decorator_1.Cron)('0 0 * * *'),
            tslib_1.__metadata("design:type", Function),
            tslib_1.__metadata("design:paramtypes", [String]),
            tslib_1.__metadata("design:returntype", void 0)
        ], TestClass.prototype, "testMethod", null);
        // Criar uma instância e executar o método
        const instance = new TestClass();
        const result = instance.testMethod('test input');
        // Verificar se o método ainda funciona como esperado
        (0, vitest_1.expect)(result).toBe('processed: test input');
        (0, vitest_1.expect)(instance.value).toBe('processed: test input');
    });
    (0, vitest_1.it)('should work with inherited class methods', () => {
        // Definir uma classe base
        class BaseClass {
            baseMethod() {
                return 'base method executed';
            }
        }
        tslib_1.__decorate([
            (0, scheduling_decorator_1.Cron)('0 12 * * *'),
            tslib_1.__metadata("design:type", Function),
            tslib_1.__metadata("design:paramtypes", []),
            tslib_1.__metadata("design:returntype", void 0)
        ], BaseClass.prototype, "baseMethod", null);
        // Definir uma classe que herda da classe base
        class ChildClass extends BaseClass {
            childMethod() {
                return 'child method executed';
            }
        }
        tslib_1.__decorate([
            (0, scheduling_decorator_1.Cron)('0 18 * * *'),
            tslib_1.__metadata("design:type", Function),
            tslib_1.__metadata("design:paramtypes", []),
            tslib_1.__metadata("design:returntype", void 0)
        ], ChildClass.prototype, "childMethod", null);
        // Verificar se addToArray foi chamado duas vezes
        (0, vitest_1.expect)(core_1.Scope.addToArray).toHaveBeenCalledTimes(2);
        // Verificar se o método da classe base foi registrado
        (0, vitest_1.expect)(core_1.Scope.addToArray).toHaveBeenCalledWith('__crons', vitest_1.expect.objectContaining({
            target: BaseClass.prototype,
            cronTime: '0 12 * * *',
        }));
        // Verificar se o método da classe filha foi registrado
        (0, vitest_1.expect)(core_1.Scope.addToArray).toHaveBeenCalledWith('__crons', vitest_1.expect.objectContaining({
            target: ChildClass.prototype,
            cronTime: '0 18 * * *',
        }));
    });
    (0, vitest_1.it)('should accept different cron time formats', () => {
        // Testar com diferentes formatos de expressão cron
        class TestCronFormats {
            everyThirtyMinutes() { }
            everyTwoHours() { }
            everyMonday() { }
        }
        tslib_1.__decorate([
            (0, scheduling_decorator_1.Cron)('*/30 * * * *'),
            tslib_1.__metadata("design:type", Function),
            tslib_1.__metadata("design:paramtypes", []),
            tslib_1.__metadata("design:returntype", void 0)
        ], TestCronFormats.prototype, "everyThirtyMinutes", null);
        tslib_1.__decorate([
            (0, scheduling_decorator_1.Cron)('0 */2 * * *'),
            tslib_1.__metadata("design:type", Function),
            tslib_1.__metadata("design:paramtypes", []),
            tslib_1.__metadata("design:returntype", void 0)
        ], TestCronFormats.prototype, "everyTwoHours", null);
        tslib_1.__decorate([
            (0, scheduling_decorator_1.Cron)('0 0 * * 1'),
            tslib_1.__metadata("design:type", Function),
            tslib_1.__metadata("design:paramtypes", []),
            tslib_1.__metadata("design:returntype", void 0)
        ], TestCronFormats.prototype, "everyMonday", null);
        // Verificar se addToArray foi chamado três vezes
        (0, vitest_1.expect)(core_1.Scope.addToArray).toHaveBeenCalledTimes(3);
        // Verificar se os diferentes formatos foram registrados corretamente
        (0, vitest_1.expect)(core_1.Scope.addToArray).toHaveBeenCalledWith('__crons', vitest_1.expect.objectContaining({ cronTime: '*/30 * * * *' }));
        (0, vitest_1.expect)(core_1.Scope.addToArray).toHaveBeenCalledWith('__crons', vitest_1.expect.objectContaining({ cronTime: '0 */2 * * *' }));
        (0, vitest_1.expect)(core_1.Scope.addToArray).toHaveBeenCalledWith('__crons', vitest_1.expect.objectContaining({ cronTime: '0 0 * * 1' }));
    });
    (0, vitest_1.it)('should allow decorating multiple methods in the same class', () => {
        // Classe com múltiplos métodos decorados
        class MultiMethodClass {
            dailyMethod() { }
            weeklyMethod() { }
            monthlyMethod() { }
        }
        tslib_1.__decorate([
            (0, scheduling_decorator_1.Cron)('0 0 * * *'),
            tslib_1.__metadata("design:type", Function),
            tslib_1.__metadata("design:paramtypes", []),
            tslib_1.__metadata("design:returntype", void 0)
        ], MultiMethodClass.prototype, "dailyMethod", null);
        tslib_1.__decorate([
            (0, scheduling_decorator_1.Cron)('0 0 * * 0'),
            tslib_1.__metadata("design:type", Function),
            tslib_1.__metadata("design:paramtypes", []),
            tslib_1.__metadata("design:returntype", void 0)
        ], MultiMethodClass.prototype, "weeklyMethod", null);
        tslib_1.__decorate([
            (0, scheduling_decorator_1.Cron)('0 0 1 * *'),
            tslib_1.__metadata("design:type", Function),
            tslib_1.__metadata("design:paramtypes", []),
            tslib_1.__metadata("design:returntype", void 0)
        ], MultiMethodClass.prototype, "monthlyMethod", null);
        // Verificar se addToArray foi chamado três vezes
        (0, vitest_1.expect)(core_1.Scope.addToArray).toHaveBeenCalledTimes(3);
        // Verificar se todos os métodos foram registrados com o cronTime correto
        (0, vitest_1.expect)(core_1.Scope.addToArray).toHaveBeenCalledWith('__crons', vitest_1.expect.objectContaining({ cronTime: '0 0 * * *' }));
        (0, vitest_1.expect)(core_1.Scope.addToArray).toHaveBeenCalledWith('__crons', vitest_1.expect.objectContaining({ cronTime: '0 0 * * 0' }));
        (0, vitest_1.expect)(core_1.Scope.addToArray).toHaveBeenCalledWith('__crons', vitest_1.expect.objectContaining({ cronTime: '0 0 1 * *' }));
    });
});
