"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const vitest_1 = require("vitest");
const autorization_service_1 = require("../services/autorization.service");
const repository_1 = require("@cmmv/repository");
const core_1 = require("@cmmv/core");
const http_1 = require("@cmmv/http");
vitest_1.vi.mock('@cmmv/repository');
vitest_1.vi.mock('@cmmv/core');
(0, vitest_1.describe)('AuthAutorizationService - User Registration', () => {
    let authService;
    (0, vitest_1.beforeEach)(() => {
        authService = new autorization_service_1.AuthAutorizationService({}, // Mock das dependências
        {});
    });
    (0, vitest_1.it)('should register a new user successfully', async () => {
        const mockUser = { username: 'testUser', password: 'hashedPassword' };
        vitest_1.vi.spyOn(core_1.Application, 'getModel').mockReturnValue({
            fromPartial: () => mockUser,
        });
        vitest_1.vi.spyOn(authService, 'validate').mockResolvedValue(mockUser);
        vitest_1.vi.spyOn(repository_1.Repository, 'insert').mockResolvedValue({ success: true });
        const result = await authService.register({
            username: 'testUser',
            password: 'testPass',
        });
        (0, vitest_1.expect)(result).toEqual({
            message: 'User registered successfully!',
        });
    });
    (0, vitest_1.it)('should throw an error if user validation fails', async () => {
        vitest_1.vi.spyOn(authService, 'validate').mockRejectedValue(new Error('Validation failed'));
        await (0, vitest_1.expect)(authService.register({
            username: 'testUser',
            password: 'testPass',
        })).rejects.toThrow('Validation failed');
    });
    (0, vitest_1.it)('should throw an error if repository insert fails', async () => {
        const mockUser = { username: 'testUser', password: 'hashedPassword' };
        vitest_1.vi.spyOn(core_1.Application, 'getModel').mockReturnValue({
            fromPartial: () => mockUser,
        });
        vitest_1.vi.spyOn(authService, 'validate').mockResolvedValue(mockUser);
        vitest_1.vi.spyOn(repository_1.Repository, 'insert').mockResolvedValue({ success: false });
        await (0, vitest_1.expect)(authService.register({
            username: 'testUser',
            password: 'testPass',
        })).rejects.toThrow(http_1.HttpException);
    });
});
