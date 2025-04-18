import { vi } from 'vitest';

export class MockAbstractTranspile {
    public getRootPath = vi
        .fn()
        .mockImplementation(
            (
                contract: any,
                context: string,
                createDirectory: boolean = true,
            ): string => {
                return `root/${context}/${contract.subPath || ''}`;
            },
        );

    public getGeneratedPath = vi
        .fn()
        .mockImplementation(
            (
                contract: any,
                context: string,
                createDirectory: boolean = true,
            ): string => {
                return `.generated/${context}/${contract.subPath || ''}`;
            },
        );

    public getImportPath = vi
        .fn()
        .mockImplementation(
            (
                contract: any,
                context: string,
                filename: string,
                alias?: string,
            ) => {
                const basePath = contract.subPath
                    ? `${contract.subPath
                          .split('/')
                          .map(() => '../')
                          .join('')}${context}${contract.subPath}/${filename}`
                    : `../${context}/${filename}`;

                return alias
                    ? `${alias}${basePath.replace(context, '').replace(/\.\.\//gim, '')}`
                    : basePath;
            },
        );

    public getImportPathWithoutSubPath = vi
        .fn()
        .mockImplementation(
            (
                contract: any,
                context: string,
                filename: string,
                alias?: string,
            ) => {
                const basePath = contract.subPath
                    ? `${contract.subPath
                          .split('/')
                          .map(() => '../')
                          .join('')}${context}/${filename}`
                    : `../${context}/${filename}`;

                return alias
                    ? `${alias}${basePath.replace(context, '').replace(/\.\.\//gim, '')}`
                    : basePath;
            },
        );

    public getImportPathRelative = vi
        .fn()
        .mockImplementation(
            (
                contract: any,
                contractTo: any,
                context: string,
                filename: string,
                alias?: string,
            ) => {
                if (contractTo.subPath === contract.subPath)
                    return `./${filename}`;

                const relativePath = contractTo.subPath
                    ? `${contractTo.subPath
                          .split('/')
                          .map(() => '../')
                          .join('')}${context}${contract.subPath}/${filename}`
                    : `../${context}/${filename}`;

                return alias
                    ? `${alias}${relativePath.replace(context, '').replace(/\.\.\//gim, '')}`
                    : relativePath;
            },
        );

    public removeExtraSpaces = vi
        .fn()
        .mockImplementation((code: string): string => {
            return code
                .replace(/\n{3,}/g, '\n\n')
                .replace(/(\n\s*\n\s*\n)/g, '\n\n');
        });

    public removeTelemetry = vi
        .fn()
        .mockImplementation((code: string): string => {
            return code.replace(/Telemetry\./g, '');
        });

    /**
     * Resets all mocks
     */
    public reset(): void {
        this.getRootPath.mockReset();
        this.getGeneratedPath.mockReset();
        this.getImportPath.mockReset();
        this.getImportPathWithoutSubPath.mockReset();
        this.getImportPathRelative.mockReset();
        this.removeExtraSpaces.mockReset();
        this.removeTelemetry.mockReset();

        // Restore implementations
        this.getRootPath.mockImplementation(
            (
                contract: any,
                context: string,
                createDirectory: boolean = true,
            ): string => {
                return `root/${context}/${contract.subPath || ''}`;
            },
        );

        this.getGeneratedPath.mockImplementation(
            (
                contract: any,
                context: string,
                createDirectory: boolean = true,
            ): string => {
                return `.generated/${context}/${contract.subPath || ''}`;
            },
        );

        this.getImportPath.mockImplementation(
            (
                contract: any,
                context: string,
                filename: string,
                alias?: string,
            ) => {
                const basePath = contract.subPath
                    ? `${contract.subPath
                          .split('/')
                          .map(() => '../')
                          .join('')}${context}${contract.subPath}/${filename}`
                    : `../${context}/${filename}`;

                return alias
                    ? `${alias}${basePath.replace(context, '').replace(/\.\.\//gim, '')}`
                    : basePath;
            },
        );

        this.getImportPathWithoutSubPath.mockImplementation(
            (
                contract: any,
                context: string,
                filename: string,
                alias?: string,
            ) => {
                const basePath = contract.subPath
                    ? `${contract.subPath
                          .split('/')
                          .map(() => '../')
                          .join('')}${context}/${filename}`
                    : `../${context}/${filename}`;

                return alias
                    ? `${alias}${basePath.replace(context, '').replace(/\.\.\//gim, '')}`
                    : basePath;
            },
        );

        this.getImportPathRelative.mockImplementation(
            (
                contract: any,
                contractTo: any,
                context: string,
                filename: string,
                alias?: string,
            ) => {
                if (contractTo.subPath === contract.subPath)
                    return `./${filename}`;

                const relativePath = contractTo.subPath
                    ? `${contractTo.subPath
                          .split('/')
                          .map(() => '../')
                          .join('')}${context}${contract.subPath}/${filename}`
                    : `../${context}/${filename}`;

                return alias
                    ? `${alias}${relativePath.replace(context, '').replace(/\.\.\//gim, '')}`
                    : relativePath;
            },
        );

        this.removeExtraSpaces.mockImplementation((code: string): string => {
            return code
                .replace(/\n{3,}/g, '\n\n')
                .replace(/(\n\s*\n\s*\n)/g, '\n\n');
        });

        this.removeTelemetry.mockImplementation((code: string): string => {
            return code.replace(/Telemetry\./g, '');
        });
    }
}

export class MockTranspile {
    public logger = { log: vi.fn(), error: vi.fn() };
    public transpilers: Array<any> = [];

    public add = vi.fn().mockImplementation((transpiler: any): void => {
        this.transpilers.push(transpiler);
    });

    public transpile = vi.fn().mockImplementation(async (): Promise<any[]> => {
        try {
            const transpilePromises = this.transpilers.map(
                (TranspilerClass) => {
                    if (typeof TranspilerClass === 'function') {
                        const transpiler = new TranspilerClass();
                        return transpiler.run();
                    }
                    return Promise.resolve();
                },
            );

            return Promise.all(transpilePromises);
        } catch (error) {
            this.logger.error(error);
            throw error;
        }
    });

    /**
     * Resets all mocks
     */
    public reset(): void {
        this.transpilers = [];
        this.logger.log.mockReset();
        this.logger.error.mockReset();
        this.add.mockReset();
        this.transpile.mockReset();

        // Restore implementations
        this.add.mockImplementation((transpiler: any): void => {
            this.transpilers.push(transpiler);
        });

        this.transpile.mockImplementation(async (): Promise<any[]> => {
            try {
                const transpilePromises = this.transpilers.map(
                    (TranspilerClass) => {
                        if (typeof TranspilerClass === 'function') {
                            const transpiler = new TranspilerClass();
                            return transpiler.run();
                        }
                        return Promise.resolve();
                    },
                );

                return Promise.all(transpilePromises);
            } catch (error) {
                this.logger.error(error);
                throw error;
            }
        });
    }

    /**
     * Returns mock module structure for the transpile module
     */
    public static getMockModule() {
        return {
            AbstractTranspile: MockAbstractTranspile,
            Transpile: MockTranspile,
        };
    }
}

/**
 * Setup for mocking the Transpile module
 *
 * @example
 * ```ts
 * import { mockTranspile } from '@cmmv/testing';
 *
 * vi.mock('@cmmv/core/lib/transpile', () => mockTranspile.getMockModule());
 *
 * describe('Your test', () => {
 *   const abstractTranspile = new MockAbstractTranspile();
 *   const transpileInstance = new MockTranspile();
 *
 *   beforeEach(() => {
 *     abstractTranspile.reset();
 *     transpileInstance.reset();
 *   });
 *
 *   it('tests transpile functionality', () => {
 *     // Your test
 *   });
 * });
 * ```
 */
export const mockTranspile = MockTranspile;
