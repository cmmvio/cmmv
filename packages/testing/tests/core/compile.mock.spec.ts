import { describe, it, expect, beforeEach, vi } from 'vitest';
import { MockCompile } from '../../core/compile.mock';

describe('MockCompile', () => {
    let compileInstance: MockCompile;

    beforeEach(() => {
        compileInstance = MockCompile.getInstance();
        compileInstance.reset();
        compileInstance.generateContractCode.mockReturnValue(
            '// mock contract code',
        );
        compileInstance.generateImports.mockReturnValue('// mock imports');
        compileInstance.generateContractDecorator.mockReturnValue(
            '// mock decorator',
        );
        compileInstance.generateContractClass.mockReturnValue('// mock class');
        compileInstance.generateContractField.mockReturnValue('// mock field');
        compileInstance.generateContractMessage.mockReturnValue(
            '// mock message',
        );
        compileInstance.generateContractService.mockReturnValue(
            '// mock service',
        );
    });

    it('should follow singleton pattern', () => {
        const instance1 = MockCompile.getInstance();
        const instance2 = MockCompile.getInstance();
        expect(instance1).toBe(instance2);
    });

    it('should compile schema', () => {
        const schema = { name: 'TestSchema' };
        const outputPath = 'test/path/output.ts';
        const result = compileInstance.compileSchema(schema, outputPath);
        expect(result).toBe(outputPath);
        expect(compileInstance.compileSchema).toHaveBeenCalledWith(
            schema,
            outputPath,
        );
    });

    it('should generate contract code', () => {
        const result = compileInstance.generateContractCode();
        expect(result).toBe('// mock contract code');
        expect(compileInstance.generateContractCode).toHaveBeenCalled();
    });

    it('should generate imports', () => {
        const result = compileInstance.generateImports();
        expect(result).toBe('// mock imports');
        expect(compileInstance.generateImports).toHaveBeenCalled();
    });

    it('should generate contract decorator', () => {
        const result = compileInstance.generateContractDecorator();
        expect(result).toBe('// mock decorator');
        expect(compileInstance.generateContractDecorator).toHaveBeenCalled();
    });

    it('should generate contract class', () => {
        const result = compileInstance.generateContractClass();
        expect(result).toBe('// mock class');
        expect(compileInstance.generateContractClass).toHaveBeenCalled();
    });

    it('should generate contract field', () => {
        const result = compileInstance.generateContractField();
        expect(result).toBe('// mock field');
        expect(compileInstance.generateContractField).toHaveBeenCalled();
    });

    it('should generate contract message', () => {
        const result = compileInstance.generateContractMessage();
        expect(result).toBe('// mock message');
        expect(compileInstance.generateContractMessage).toHaveBeenCalled();
    });

    it('should generate contract service', () => {
        const result = compileInstance.generateContractService();
        expect(result).toBe('// mock service');
        expect(compileInstance.generateContractService).toHaveBeenCalled();
    });

    it('should get contract class name', () => {
        expect(compileInstance.getContractClassName('Test')).toBe(
            'TestContract',
        );
        expect(compileInstance.getContractClassName('TestContract')).toBe(
            'TestContract',
        );
        expect(compileInstance.getContractClassName).toHaveBeenCalledTimes(2);
    });

    it('should get contract name from string', () => {
        expect(compileInstance.getContractName('TestContract')).toBe(
            'TestContract',
        );
        expect(compileInstance.getContractName).toHaveBeenCalledWith(
            'TestContract',
        );
    });

    it('should get contract name from object with name property', () => {
        const contract = { name: 'TestContract' };
        expect(compileInstance.getContractName(contract)).toBe('TestContract');
        expect(compileInstance.getContractName).toHaveBeenCalledWith(contract);
    });

    it('should get contract name from object without name property', () => {
        const contract = { id: 1 };
        expect(compileInstance.getContractName(contract)).toBe(
            contract.toString(),
        );
        expect(compileInstance.getContractName).toHaveBeenCalledWith(contract);
    });

    it('should reset all mocks', () => {
        const compileSchemaSpy = vi.spyOn(compileInstance, 'compileSchema');
        const generateContractCodeSpy = vi.spyOn(
            compileInstance,
            'generateContractCode',
        );

        compileInstance.compileSchema({}, 'test');
        compileInstance.generateContractCode();

        expect(compileSchemaSpy).toHaveBeenCalled();
        expect(generateContractCodeSpy).toHaveBeenCalled();

        compileSchemaSpy.mockReset();
        generateContractCodeSpy.mockReset();

        compileInstance.reset();

        expect(compileInstance.compileSchema({}, 'testAfterReset')).toBe(
            'testAfterReset',
        );
    });

    it('should provide mock module structure', () => {
        const mockModule = MockCompile.getMockModule();
        expect(mockModule).toHaveProperty('Compile', MockCompile);
    });
});
