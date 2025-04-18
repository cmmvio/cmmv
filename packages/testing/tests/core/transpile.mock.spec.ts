import { describe, it, expect, beforeEach, vi } from 'vitest';
import {
    MockAbstractTranspile,
    MockTranspile,
} from '../../core/transpile.mock';

describe('MockAbstractTranspile', () => {
    let abstractTranspile: MockAbstractTranspile;

    beforeEach(() => {
        abstractTranspile = new MockAbstractTranspile();
    });

    it('should generate the correct root path', () => {
        const contract = { subPath: 'test/path' };
        const context = 'contracts';
        const result = abstractTranspile.getRootPath(contract, context);
        expect(result).toBe('root/contracts/test/path');
    });

    it('should generate the correct root path without subPath', () => {
        const contract = {};
        const context = 'contracts';
        const result = abstractTranspile.getRootPath(contract, context);
        expect(result).toBe('root/contracts/');
    });

    it('should generate the correct generated path', () => {
        const contract = { subPath: 'test/path' };
        const context = 'contracts';
        const result = abstractTranspile.getGeneratedPath(contract, context);
        expect(result).toBe('.generated/contracts/test/path');
    });

    it('should generate the correct import path', () => {
        const contract = { subPath: 'test/path' };
        const context = 'contracts';
        const filename = 'test.ts';
        const result = abstractTranspile.getImportPath(
            contract,
            context,
            filename,
        );
        expect(result).toBe('../../contractstest/path/test.ts');
    });

    it('should generate the correct import path with alias', () => {
        const contract = { subPath: 'test/path' };
        const context = 'contracts';
        const filename = 'test.ts';
        const alias = '@/';
        const result = abstractTranspile.getImportPath(
            contract,
            context,
            filename,
            alias,
        );
        expect(result).toBe('@/test/path/test.ts');
    });

    it('should generate the correct import path without subPath', () => {
        const contract = { subPath: 'test/path' };
        const context = 'contracts';
        const filename = 'test.ts';
        const result = abstractTranspile.getImportPathWithoutSubPath(
            contract,
            context,
            filename,
        );
        expect(result).toBe('../../contracts/test.ts');
    });

    it('should generate the correct relative import path', () => {
        const contract = { subPath: 'test/path' };
        const contractTo = { subPath: 'test/path' };
        const context = 'contracts';
        const filename = 'test.ts';
        const result = abstractTranspile.getImportPathRelative(
            contract,
            contractTo,
            context,
            filename,
        );
        expect(result).toBe('./test.ts');
    });

    it('should generate the correct relative import path with different subPaths', () => {
        const contract = { subPath: 'test/path1' };
        const contractTo = { subPath: 'test/path2' };
        const context = 'contracts';
        const filename = 'test.ts';
        const result = abstractTranspile.getImportPathRelative(
            contract,
            contractTo,
            context,
            filename,
        );
        expect(result).toBe('../../contractstest/path1/test.ts');
    });

    it('should remove extra spaces', () => {
        const code = 'line1\n\n\n\nline2\n\n\n\n\nline3';
        const result = abstractTranspile.removeExtraSpaces(code);
        expect(result).toBe('line1\n\nline2\n\nline3');
    });

    it('should remove telemetry', () => {
        const code = 'Telemetry.log(); Telemetry.track(); other code;';
        const result = abstractTranspile.removeTelemetry(code);
        expect(result).toBe('log(); track(); other code;');
    });

    it('should reset all mocks', () => {
        abstractTranspile.getRootPath({ subPath: 'test' }, 'context');
        abstractTranspile.getGeneratedPath({ subPath: 'test' }, 'context');

        expect(abstractTranspile.getRootPath.mock.calls.length).toBeGreaterThan(
            0,
        );
        expect(
            abstractTranspile.getGeneratedPath.mock.calls.length,
        ).toBeGreaterThan(0);

        abstractTranspile.reset();

        const result = abstractTranspile.getRootPath(
            { subPath: 'test/after-reset' },
            'context',
        );
        expect(result).toBe('root/context/test/after-reset');
    });
});

describe('MockTranspile', () => {
    let transpileInstance: MockTranspile;

    beforeEach(() => {
        transpileInstance = new MockTranspile();
    });

    it('should add a transpiler', () => {
        const transpiler = function DummyTranspiler() {};
        transpileInstance.add(transpiler);
        expect(transpileInstance.transpilers).toContain(transpiler);
    });

    it('should run all transpilers', async () => {
        const mockRun = vi.fn().mockResolvedValue('result');

        const FakeTranspiler = function () {
            return { run: mockRun };
        };

        transpileInstance.add(FakeTranspiler);
        await transpileInstance.transpile();

        expect(mockRun).toHaveBeenCalled();
    });

    it('should handle errors', async () => {
        const error = new Error('Test error');
        const loggerErrorSpy = vi.spyOn(transpileInstance.logger, 'error');

        const mockRun = vi.fn().mockRejectedValue(error);

        const FakeTranspiler = function () {
            return { run: mockRun };
        };

        transpileInstance.add(FakeTranspiler);
        transpileInstance.transpile.mockImplementationOnce(async () => {
            try {
                const transpilePromises = transpileInstance.transpilers.map(
                    (TranspilerClass) => {
                        if (typeof TranspilerClass === 'function') {
                            const transpiler = new TranspilerClass();
                            return transpiler.run();
                        }
                        return Promise.resolve();
                    },
                );

                return await Promise.all(transpilePromises);
            } catch (e) {
                transpileInstance.logger.error(e);
                throw e;
            }
        });

        try {
            await transpileInstance.transpile();
            expect.fail('Should have thrown an error');
        } catch (e) {
            expect(e).toBe(error);
            expect(loggerErrorSpy).toHaveBeenCalledWith(error);
        }
    });

    it('should reset all mocks', () => {
        const dummyTranspiler = () => {};
        transpileInstance.add(dummyTranspiler);
        expect(transpileInstance.transpilers).toHaveLength(1);

        const addCallsCount = transpileInstance.add.mock.calls.length;

        transpileInstance.reset();

        expect(transpileInstance.transpilers).toHaveLength(0);
        expect(transpileInstance.add.mock.calls.length).toBe(0);

        const newTranspiler = () => {};
        transpileInstance.add(newTranspiler);
        expect(transpileInstance.transpilers).toContain(newTranspiler);
    });

    it('should provide correct mock module structure', () => {
        const mockModule = MockTranspile.getMockModule();

        expect(mockModule).toHaveProperty(
            'AbstractTranspile',
            MockAbstractTranspile,
        );
        expect(mockModule).toHaveProperty('Transpile', MockTranspile);
    });
});
