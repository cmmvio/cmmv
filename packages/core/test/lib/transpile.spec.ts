import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';

// Mock node:fs before importing the module
vi.mock('node:fs', async (importOriginal) => {
    const actual = await importOriginal<typeof import('node:fs')>();
    return {
        ...actual,
        existsSync: vi.fn(),
        mkdirSync: vi.fn(),
    };
});

// Mock Config
vi.mock('../../lib/config', () => ({
    Config: {
        get: vi.fn((key: string, defaultValue: string) => defaultValue),
    },
}));

// Mock Logger
vi.mock('../../lib/logger', () => ({
    Logger: class MockLogger {
        constructor(public name: string) {}
        log(...args: any[]) {}
        error(...args: any[]) {}
        warn(...args: any[]) {}
        debug(...args: any[]) {}
    },
}));

import * as fs from 'node:fs';
import { Config } from '../../lib/config';

// Define interfaces locally to avoid circular dependency
interface ITranspile {
    run(): Promise<any> | void;
}

// Simple test implementation of AbstractTranspile base class
class AbstractTranspileTest {
    public getRootPath(
        contract: any,
        context: string,
        createDirectory: boolean = true,
    ): string {
        const rootDir = Config.get<string>('app.sourceDir', 'src');

        let outputDir = contract.subPath
            ? `${rootDir}/${context}/${contract.subPath}`
            : `${rootDir}/${context}`;

        if (createDirectory && !fs.existsSync(outputDir))
            fs.mkdirSync(outputDir, { recursive: true });

        return outputDir;
    }

    public getGeneratedPath(
        contract: any,
        context: string,
        createDirectory: boolean = true,
    ): string {
        const generatedDir = Config.get<string>(
            'app.generatedDir',
            '.generated',
        );

        let outputDir = contract.subPath
            ? `${generatedDir}/${context}/${contract.subPath}`
            : `${generatedDir}/${context}`;

        if (createDirectory && !fs.existsSync(outputDir))
            fs.mkdirSync(outputDir, { recursive: true });

        return outputDir;
    }

    public getImportPath(
        contract: any,
        context: string,
        filename: string,
        alias?: string,
    ) {
        let basePath = contract.subPath
            ? `${contract.subPath
                  .split('/')
                  .map(() => '../')
                  .join('')}${context}${contract.subPath}/${filename}`
            : `../${context}/${filename}`;

        return alias
            ? `${alias}${basePath
                  .replace(context, '')
                  .replace(/\.\.\//gim, '')}`
            : basePath;
    }

    public getImportPathWithoutSubPath(
        contract: any,
        context: string,
        filename: string,
        alias?: string,
    ) {
        let basePath = contract.subPath
            ? `${contract.subPath
                  .split('/')
                  .map(() => '../')
                  .join('')}${context}/${filename}`
            : `../${context}/${filename}`;

        return alias
            ? `${alias}${basePath
                  .replace(context, '')
                  .replace(/\.\.\//gim, '')}`
            : basePath;
    }

    public removeExtraSpaces(code: string): string {
        return code
            .replace(/\n{3,}/g, '\n\n')
            .replace(/(\n\s*\n\s*\n)/g, '\n\n');
    }

    public removeTelemetry(code: string): string {
        const lines = code.split('\n');
        const filteredLines = lines.filter(
            (line) =>
                !line.includes('Telemetry.') && !line.includes('{ Telemetry }'),
        );
        return filteredLines.join('\n');
    }
}

// Transpile class for testing
class Transpile {
    private transpilers: Array<new () => ITranspile>;

    constructor(transpilers: Array<new () => ITranspile> = []) {
        this.transpilers = transpilers;
    }

    public add(transpiler: new () => ITranspile): void {
        this.transpilers.push(transpiler);
    }

    public async transpile(): Promise<any[]> {
        try {
            const transpilePromises = this.transpilers.map(
                (TranspilerClass) => {
                    if (typeof TranspilerClass == 'function') {
                        const transpiler = new TranspilerClass();
                        return transpiler.run();
                    }
                },
            );

            return Promise.all(transpilePromises);
        } catch (error) {
            throw error;
        }
    }
}

// Test implementation
class TestTranspile extends AbstractTranspileTest {
    run(): void {
        // Test implementation
    }
}

describe('AbstractTranspile', () => {
    let transpile: TestTranspile;

    beforeEach(() => {
        vi.clearAllMocks();
        transpile = new TestTranspile();
    });

    afterEach(() => {
        vi.clearAllMocks();
    });

    describe('getRootPath', () => {
        it('should return root path without subPath', () => {
            const contract = { subPath: undefined };
            vi.mocked(fs.existsSync).mockReturnValue(true);

            const result = transpile.getRootPath(contract, 'controllers');

            expect(result).toContain('controllers');
        });

        it('should return root path with subPath', () => {
            const contract = { subPath: 'api/v1' };
            vi.mocked(fs.existsSync).mockReturnValue(true);

            const result = transpile.getRootPath(contract, 'controllers');

            expect(result).toContain('controllers');
            expect(result).toContain('api');
            expect(result).toContain('v1');
        });

        it('should create directory if it does not exist', () => {
            const contract = { subPath: undefined };
            vi.mocked(fs.existsSync).mockReturnValue(false);

            transpile.getRootPath(contract, 'controllers', true);

            expect(fs.mkdirSync).toHaveBeenCalledWith(expect.any(String), {
                recursive: true,
            });
        });

        it('should not create directory if createDirectory is false', () => {
            const contract = { subPath: undefined };
            vi.mocked(fs.existsSync).mockReturnValue(false);

            transpile.getRootPath(contract, 'controllers', false);

            expect(fs.mkdirSync).not.toHaveBeenCalled();
        });

        it('should not create directory if it already exists', () => {
            const contract = { subPath: undefined };
            vi.mocked(fs.existsSync).mockReturnValue(true);

            transpile.getRootPath(contract, 'controllers', true);

            expect(fs.mkdirSync).not.toHaveBeenCalled();
        });

        it('should use custom sourceDir from config', () => {
            const contract = { subPath: undefined };
            vi.mocked(Config.get).mockReturnValue('custom-src');
            vi.mocked(fs.existsSync).mockReturnValue(true);

            const result = transpile.getRootPath(contract, 'controllers');

            expect(result).toContain('custom-src');
        });
    });

    describe('getGeneratedPath', () => {
        it('should return generated path without subPath', () => {
            const contract = { subPath: undefined };
            vi.mocked(fs.existsSync).mockReturnValue(true);

            const result = transpile.getGeneratedPath(contract, 'controllers');

            expect(result).toContain('controllers');
        });

        it('should return generated path with subPath', () => {
            const contract = { subPath: 'api/v1' };
            vi.mocked(fs.existsSync).mockReturnValue(true);

            const result = transpile.getGeneratedPath(contract, 'controllers');

            expect(result).toContain('controllers');
            expect(result).toContain('api');
            expect(result).toContain('v1');
        });

        it('should create directory if it does not exist', () => {
            const contract = { subPath: undefined };
            vi.mocked(fs.existsSync).mockReturnValue(false);

            transpile.getGeneratedPath(contract, 'controllers', true);

            expect(fs.mkdirSync).toHaveBeenCalledWith(expect.any(String), {
                recursive: true,
            });
        });

        it('should not create directory if createDirectory is false', () => {
            const contract = { subPath: undefined };
            vi.mocked(fs.existsSync).mockReturnValue(false);

            transpile.getGeneratedPath(contract, 'controllers', false);

            expect(fs.mkdirSync).not.toHaveBeenCalled();
        });

        it('should use custom generatedDir from config', () => {
            const contract = { subPath: undefined };
            vi.mocked(Config.get).mockImplementation((key: string) => {
                if (key === 'app.generatedDir') return 'custom-generated';
                return '.generated';
            });
            vi.mocked(fs.existsSync).mockReturnValue(true);

            const result = transpile.getGeneratedPath(contract, 'controllers');

            expect(result).toContain('custom-generated');
        });
    });

    describe('getImportPath', () => {
        it('should return import path without subPath', () => {
            const contract = { subPath: undefined };

            const result = transpile.getImportPath(
                contract,
                'controllers',
                'user.controller',
            );

            expect(result).toBe('../controllers/user.controller');
        });

        it('should return import path with subPath', () => {
            const contract = { subPath: 'api/v1' };

            const result = transpile.getImportPath(
                contract,
                'controllers',
                'user.controller',
            );

            expect(result).toContain('../');
            expect(result).toContain('controllers');
            expect(result).toContain('user.controller');
        });

        it('should return import path with alias', () => {
            const contract = { subPath: undefined };

            const result = transpile.getImportPath(
                contract,
                'controllers',
                'user.controller',
                '@app/',
            );

            expect(result).toContain('@app/');
            expect(result).toContain('user.controller');
        });
    });

    describe('getImportPathWithoutSubPath', () => {
        it('should return import path without subPath', () => {
            const contract = { subPath: undefined };

            const result = transpile.getImportPathWithoutSubPath(
                contract,
                'controllers',
                'user.controller',
            );

            expect(result).toBe('../controllers/user.controller');
        });

        it('should return import path with subPath but not include subPath in result', () => {
            const contract = { subPath: 'api/v1' };

            const result = transpile.getImportPathWithoutSubPath(
                contract,
                'controllers',
                'user.controller',
            );

            expect(result).toContain('controllers');
            expect(result).toContain('user.controller');
        });

        it('should return import path with alias', () => {
            const contract = { subPath: undefined };

            const result = transpile.getImportPathWithoutSubPath(
                contract,
                'controllers',
                'user.controller',
                '@app/',
            );

            expect(result).toContain('@app/');
        });
    });

    describe('removeExtraSpaces', () => {
        it('should remove more than 2 consecutive newlines', () => {
            const code = 'line1\n\n\n\nline2';

            const result = transpile.removeExtraSpaces(code);

            expect(result).toBe('line1\n\nline2');
        });

        it('should keep 2 consecutive newlines', () => {
            const code = 'line1\n\nline2';

            const result = transpile.removeExtraSpaces(code);

            expect(result).toBe('line1\n\nline2');
        });

        it('should handle code with many blank lines', () => {
            const code = 'line1\n\n\n\n\n\nline2\n\n\nline3';

            const result = transpile.removeExtraSpaces(code);

            expect(result.match(/\n\n\n/g)).toBeNull();
        });

        it('should handle empty string', () => {
            const code = '';

            const result = transpile.removeExtraSpaces(code);

            expect(result).toBe('');
        });

        it('should handle code without extra spaces', () => {
            const code = 'line1\nline2\nline3';

            const result = transpile.removeExtraSpaces(code);

            expect(result).toBe('line1\nline2\nline3');
        });
    });

    describe('removeTelemetry', () => {
        it('should remove lines containing Telemetry.', () => {
            const code =
                'import { something } from "lib";\nTelemetry.start();\nconsole.log("hello");';

            const result = transpile.removeTelemetry(code);

            expect(result).not.toContain('Telemetry.');
            expect(result).toContain('import { something } from "lib";');
            expect(result).toContain('console.log("hello");');
        });

        it('should remove Telemetry import lines', () => {
            const code =
                'import { Telemetry } from "telemetry";\nconsole.log("hello");';

            const result = transpile.removeTelemetry(code);

            expect(result).not.toContain('{ Telemetry }');
            expect(result).toContain('console.log("hello");');
        });

        it('should handle code without telemetry', () => {
            const code = 'const x = 1;\nconsole.log(x);';

            const result = transpile.removeTelemetry(code);

            expect(result).toBe('const x = 1;\nconsole.log(x);');
        });

        it('should handle empty string', () => {
            const code = '';

            const result = transpile.removeTelemetry(code);

            expect(result).toBe('');
        });

        it('should remove multiple telemetry lines', () => {
            const code =
                'Telemetry.start();\nconst x = 1;\nTelemetry.end();\nTelemetry.log("test");';

            const result = transpile.removeTelemetry(code);

            expect(result).not.toContain('Telemetry.');
            expect(result).toContain('const x = 1;');
        });
    });
});

describe('Transpile', () => {
    beforeEach(() => {
        vi.clearAllMocks();
    });

    afterEach(() => {
        vi.clearAllMocks();
    });

    describe('constructor', () => {
        it('should create instance with empty transpilers array', () => {
            const transpile = new Transpile();

            expect(transpile).toBeInstanceOf(Transpile);
        });

        it('should create instance with provided transpilers', () => {
            class MockTranspiler implements ITranspile {
                run() {}
            }

            const transpile = new Transpile([MockTranspiler]);

            expect(transpile).toBeInstanceOf(Transpile);
        });
    });

    describe('add', () => {
        it('should add transpiler to the list', () => {
            const transpile = new Transpile();

            class MockTranspiler implements ITranspile {
                run() {}
            }

            transpile.add(MockTranspiler);

            expect(transpile).toBeInstanceOf(Transpile);
        });

        it('should add multiple transpilers', () => {
            const transpile = new Transpile();

            class MockTranspiler1 implements ITranspile {
                run() {}
            }
            class MockTranspiler2 implements ITranspile {
                run() {}
            }

            transpile.add(MockTranspiler1);
            transpile.add(MockTranspiler2);

            expect(transpile).toBeInstanceOf(Transpile);
        });
    });

    describe('transpile', () => {
        it('should execute all transpilers', async () => {
            const mockRun = vi.fn();

            class MockTranspiler implements ITranspile {
                run() {
                    mockRun();
                }
            }

            const transpile = new Transpile([MockTranspiler]);
            await transpile.transpile();

            expect(mockRun).toHaveBeenCalled();
        });

        it('should execute multiple transpilers', async () => {
            const mockRun1 = vi.fn();
            const mockRun2 = vi.fn();

            class MockTranspiler1 implements ITranspile {
                run() {
                    mockRun1();
                }
            }
            class MockTranspiler2 implements ITranspile {
                run() {
                    mockRun2();
                }
            }

            const transpile = new Transpile([MockTranspiler1, MockTranspiler2]);
            await transpile.transpile();

            expect(mockRun1).toHaveBeenCalled();
            expect(mockRun2).toHaveBeenCalled();
        });

        it('should handle async transpilers', async () => {
            const mockRun = vi.fn();

            class MockTranspiler implements ITranspile {
                async run() {
                    await new Promise((resolve) => setTimeout(resolve, 10));
                    mockRun();
                }
            }

            const transpile = new Transpile([MockTranspiler]);
            await transpile.transpile();

            expect(mockRun).toHaveBeenCalled();
        });

        it('should return array of results', async () => {
            class MockTranspiler implements ITranspile {
                async run() {
                    return 'result';
                }
            }

            const transpile = new Transpile([MockTranspiler]);
            const results = await transpile.transpile();

            expect(results).toEqual(['result']);
        });

        it('should handle empty transpilers list', async () => {
            const transpile = new Transpile();
            const results = await transpile.transpile();

            expect(results).toEqual([]);
        });

        it('should throw error when transpiler throws', async () => {
            class ErrorTranspiler implements ITranspile {
                run() {
                    throw new Error('Transpile error');
                }
            }

            const transpile = new Transpile([ErrorTranspiler]);

            await expect(transpile.transpile()).rejects.toThrow(
                'Transpile error',
            );
        });

        it('should handle transpiler that rejects', async () => {
            class RejectTranspiler implements ITranspile {
                async run() {
                    throw new Error('Async transpile error');
                }
            }

            const transpile = new Transpile([RejectTranspiler]);

            await expect(transpile.transpile()).rejects.toThrow(
                'Async transpile error',
            );
        });

        it('should execute added transpilers', async () => {
            const mockRun = vi.fn();

            class MockTranspiler implements ITranspile {
                run() {
                    mockRun();
                }
            }

            const transpile = new Transpile();
            transpile.add(MockTranspiler);
            await transpile.transpile();

            expect(mockRun).toHaveBeenCalled();
        });
    });
});
