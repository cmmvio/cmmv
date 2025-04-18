import { vi } from 'vitest';

export class MockCompile {
    private static instance: MockCompile;

    public static getInstance = vi.fn().mockImplementation(() => {
        if (!MockCompile.instance) {
            MockCompile.instance = new MockCompile();
        }
        return MockCompile.instance;
    });

    public compileSchema = vi
        .fn()
        .mockImplementation((schema: any, outputPath: string): string => {
            return outputPath;
        });

    public validateSchema = vi.fn();
    public generateContractCode = vi
        .fn()
        .mockReturnValue('// mock contract code');
    public generateImports = vi.fn().mockReturnValue('// mock imports');
    public generateContractDecorator = vi
        .fn()
        .mockReturnValue('// mock decorator');
    public generateContractClass = vi.fn().mockReturnValue('// mock class');
    public generateContractField = vi.fn().mockReturnValue('// mock field');
    public generateContractMessage = vi.fn().mockReturnValue('// mock message');
    public generateContractService = vi.fn().mockReturnValue('// mock service');
    public getContractClassName = vi
        .fn()
        .mockImplementation((contractName: string): string => {
            return contractName.endsWith('Contract')
                ? contractName
                : `${contractName}Contract`;
        });
    public getContractName = vi
        .fn()
        .mockImplementation((contract: any): string => {
            if (typeof contract === 'string') {
                return contract;
            }
            if (contract.name) {
                return contract.name;
            }
            return contract.toString();
        });

    public reset(): void {
        this.compileSchema.mockReset();
        this.validateSchema.mockReset();
        this.generateContractCode.mockReset();
        this.generateImports.mockReset();
        this.generateContractDecorator.mockReset();
        this.generateContractClass.mockReset();
        this.generateContractField.mockReset();
        this.generateContractMessage.mockReset();
        this.generateContractService.mockReset();
        this.getContractClassName.mockReset();
        this.getContractName.mockReset();
        MockCompile.getInstance.mockReset();

        MockCompile.getInstance.mockImplementation(() => {
            if (!MockCompile.instance) {
                MockCompile.instance = new MockCompile();
            }
            return MockCompile.instance;
        });

        this.compileSchema.mockImplementation(
            (schema: any, outputPath: string): string => {
                return outputPath;
            },
        );

        this.getContractClassName.mockImplementation(
            (contractName: string): string => {
                return contractName.endsWith('Contract')
                    ? contractName
                    : `${contractName}Contract`;
            },
        );

        this.getContractName.mockImplementation((contract: any): string => {
            if (typeof contract === 'string') {
                return contract;
            }
            if (contract.name) {
                return contract.name;
            }
            return contract.toString();
        });
    }

    public static getMockModule() {
        return {
            Compile: MockCompile,
        };
    }
}

/**
 * Setup for mocking the Compile module
 *
 * @example
 * ```ts
 * import { mockCompile } from '@cmmv/testing';
 *
 * vi.mock('@cmmv/core/lib/compile', () => mockCompile.getMockModule());
 *
 * describe('Your test', () => {
 *   beforeEach(() => {
 *     mockCompile.reset();
 *   });
 *
 *   it('tests compile functionality', () => {
 *     // Your test
 *   });
 * });
 * ```
 */
export const mockCompile = MockCompile;
