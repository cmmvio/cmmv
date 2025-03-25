import { describe, it, expect, vi, beforeEach } from 'vitest';
import { Cron, CRON_METADATA } from '../lib/scheduling.decorator';
import { Scope } from '@cmmv/core';
import 'reflect-metadata'; // Importar reflect-metadata para os decoradores

// Mock das dependências
vi.mock('@cmmv/core', () => ({
    Scope: {
        addToArray: vi.fn(),
    },
}));

// Espionar as funções do Reflect em vez de substituí-las completamente
const originalDefineMetadata = Reflect.defineMetadata;
Reflect.defineMetadata = vi.fn().mockImplementation((key, value, target) => {
    return originalDefineMetadata
        ? originalDefineMetadata(key, value, target)
        : undefined;
});

describe('Cron Decorator', () => {
    beforeEach(() => {
        // Resetar os mocks
        vi.clearAllMocks();
    });

    it('should define metadata on the decorated method', () => {
        // Definir uma classe de teste com um método decorado
        class TestClass {
            @Cron('0 0 * * *')
            public testMethod() {
                return 'executed';
            }
        }

        // Verificar se o metadata foi definido corretamente
        expect(Reflect.defineMetadata).toHaveBeenCalledWith(
            CRON_METADATA,
            '0 0 * * *',
            expect.any(Function),
        );
    });

    it('should add the cron job to the Scope.__crons array', () => {
        // Definir uma classe de teste com um método decorado
        class TestClass {
            @Cron('*/5 * * * *')
            public testMethod() {
                return 'executed';
            }
        }

        // Verificar se addToArray foi chamado com os parâmetros corretos
        expect(Scope.addToArray).toHaveBeenCalledWith('__crons', {
            target: TestClass.prototype,
            method: expect.any(Function),
            cronTime: '*/5 * * * *',
        });
    });

    it('should preserve the original method functionality', () => {
        // Definir uma classe de teste com um método decorado
        class TestClass {
            public value: string = '';

            @Cron('0 0 * * *')
            public testMethod(arg: string) {
                this.value = `processed: ${arg}`;
                return this.value;
            }
        }

        // Criar uma instância e executar o método
        const instance = new TestClass();
        const result = instance.testMethod('test input');

        // Verificar se o método ainda funciona como esperado
        expect(result).toBe('processed: test input');
        expect(instance.value).toBe('processed: test input');
    });

    it('should work with inherited class methods', () => {
        // Definir uma classe base
        class BaseClass {
            @Cron('0 12 * * *')
            public baseMethod() {
                return 'base method executed';
            }
        }

        // Definir uma classe que herda da classe base
        class ChildClass extends BaseClass {
            @Cron('0 18 * * *')
            public childMethod() {
                return 'child method executed';
            }
        }

        // Verificar se addToArray foi chamado duas vezes
        expect(Scope.addToArray).toHaveBeenCalledTimes(2);

        // Verificar se o método da classe base foi registrado
        expect(Scope.addToArray).toHaveBeenCalledWith(
            '__crons',
            expect.objectContaining({
                target: BaseClass.prototype,
                cronTime: '0 12 * * *',
            }),
        );

        // Verificar se o método da classe filha foi registrado
        expect(Scope.addToArray).toHaveBeenCalledWith(
            '__crons',
            expect.objectContaining({
                target: ChildClass.prototype,
                cronTime: '0 18 * * *',
            }),
        );
    });

    it('should accept different cron time formats', () => {
        // Testar com diferentes formatos de expressão cron
        class TestCronFormats {
            @Cron('*/30 * * * *')
            public everyThirtyMinutes() {}

            @Cron('0 */2 * * *')
            public everyTwoHours() {}

            @Cron('0 0 * * 1')
            public everyMonday() {}
        }

        // Verificar se addToArray foi chamado três vezes
        expect(Scope.addToArray).toHaveBeenCalledTimes(3);

        // Verificar se os diferentes formatos foram registrados corretamente
        expect(Scope.addToArray).toHaveBeenCalledWith(
            '__crons',
            expect.objectContaining({ cronTime: '*/30 * * * *' }),
        );

        expect(Scope.addToArray).toHaveBeenCalledWith(
            '__crons',
            expect.objectContaining({ cronTime: '0 */2 * * *' }),
        );

        expect(Scope.addToArray).toHaveBeenCalledWith(
            '__crons',
            expect.objectContaining({ cronTime: '0 0 * * 1' }),
        );
    });

    it('should allow decorating multiple methods in the same class', () => {
        // Classe com múltiplos métodos decorados
        class MultiMethodClass {
            @Cron('0 0 * * *')
            public dailyMethod() {}

            @Cron('0 0 * * 0')
            public weeklyMethod() {}

            @Cron('0 0 1 * *')
            public monthlyMethod() {}
        }

        // Verificar se addToArray foi chamado três vezes
        expect(Scope.addToArray).toHaveBeenCalledTimes(3);

        // Verificar se todos os métodos foram registrados com o cronTime correto
        expect(Scope.addToArray).toHaveBeenCalledWith(
            '__crons',
            expect.objectContaining({ cronTime: '0 0 * * *' }),
        );

        expect(Scope.addToArray).toHaveBeenCalledWith(
            '__crons',
            expect.objectContaining({ cronTime: '0 0 * * 0' }),
        );

        expect(Scope.addToArray).toHaveBeenCalledWith(
            '__crons',
            expect.objectContaining({ cronTime: '0 0 1 * *' }),
        );
    });
});
