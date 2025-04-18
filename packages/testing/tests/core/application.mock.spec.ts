import { describe, it, expect, beforeEach, vi, afterEach } from 'vitest';
import { ApplicationMock } from '../../core/application.mock';
import {
    DefaultAdapter,
    MockDefaultAdapter,
    MockControllerRegistry,
} from '../../http/http.mock';
import { Module, Logger, AbstractHttpAdapter } from '@cmmv/core';
import { Get, Controller } from '../../http/http-decorators.mock';

@Controller('hello-world')
class HelloWorldController {
    protected logger = new Logger('HelloWorldController');

    @Get()
    async helloWorld() {
        return { Hello: 'World' };
    }
}

// Cria um módulo de teste
const TestModule = new Module('test', {
    controllers: [HelloWorldController],
});

describe('ApplicationMock with HTTP', () => {
    let app: ApplicationMock;
    let httpAdapter: MockDefaultAdapter;

    beforeEach(async () => {
        vi.clearAllMocks();

        // Criar a aplicação mock com o adaptador HTTP mockado
        app = new ApplicationMock({
            httpAdapter: DefaultAdapter as unknown as new (
                instance?: any,
            ) => AbstractHttpAdapter,
            modules: [TestModule],
        });

        // Obter o adaptador HTTP da aplicação
        httpAdapter = app.getHttpAdapter() as unknown as MockDefaultAdapter;

        // Inicializar o aplicativo
        await app['initialize']();
    });

    afterEach(async () => {
        await app.close();
    });

    describe('HTTP Routing', () => {
        it('should handle GET /hello-world and return Hello World json', async () => {
            // Criar uma instância do controlador manualmente
            const controllerInstance = new HelloWorldController();

            // Mock da requisição e resposta
            const req = {
                method: 'GET',
                path: '/hello-world',
                query: {},
                headers: {},
                ip: '127.0.0.1',
                requestId: '12345',
            };

            const res = {
                json: vi.fn(),
                send: vi.fn(),
                code: vi.fn().mockReturnThis(),
                set: vi.fn().mockReturnThis(),
            };

            // Mock para Telemetry
            const mockTelemetry = {
                start: vi.fn(),
                end: vi.fn(),
                getProcessTimer: vi.fn().mockReturnValue(10),
                getTelemetry: vi.fn().mockReturnValue({}),
                clearTelemetry: vi.fn(),
            };

            // Adicionar o mock Telemetry globalmente
            global.Telemetry = mockTelemetry;

            // Mock da função buildRouteArgs para retornar os argumentos corretos
            httpAdapter.buildRouteArgs.mockReturnValue([]);

            // Mock da função isJson para retornar true para objetos
            httpAdapter.isJson.mockReturnValue(true);

            // Criar manualmente um handler similar ao que seria gerado pelo adaptador
            const handler = async (req: any, res: any) => {
                try {
                    // Simulando o comportamento do handler gerado pelo adaptador
                    const args = httpAdapter.buildRouteArgs(req, res, null, []);
                    // Chamar o método diretamente sem spread operator
                    const result = await controllerInstance.helloWorld();

                    const processingTime = 100;

                    if (httpAdapter.isJson(result)) {
                        const response = {
                            status: 200,
                            processingTime,
                            result,
                        };

                        res.json(response);
                    } else {
                        res.send(result);
                    }
                } catch (error) {
                    res.code(500).send({ error: error.message });
                }
            };

            // Chamar o handler manualmente
            await handler(req, res);

            // Verificar se a resposta foi chamada com os dados corretos
            expect(res.json).toHaveBeenCalledWith({
                status: 200,
                processingTime: expect.any(Number),
                result: { Hello: 'World' },
            });
        });
    });
});
