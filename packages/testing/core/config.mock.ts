import { vi } from 'vitest';

export class MockConfig {
    public static configData: Record<string, any> = {};

    public static loadConfig = vi.fn();

    public static get = vi
        .fn()
        .mockImplementation(
            <T = any>(key: string, defaultValue?: any): T | null | any => {
                const value = key
                    .split('.')
                    .reduce(
                        (o, k) =>
                            o && o[k] !== undefined && o[k] !== null
                                ? o[k]
                                : null,
                        MockConfig.configData,
                    ) as T;
                return value !== null ? value : defaultValue;
            },
        );

    public static has = vi.fn().mockImplementation((key: string): boolean => {
        return (
            key
                .split('.')
                .reduce(
                    (o, k) => (o && k in o ? o[k] : undefined),
                    MockConfig.configData,
                ) !== undefined
        );
    });

    public static set = vi
        .fn()
        .mockImplementation((key: string, value: any): void => {
            const keys = key.split('.');
            let obj = MockConfig.configData;

            while (keys.length > 1) {
                const k = keys.shift()!;
                obj[k] = obj[k] || {};
                obj = obj[k];
            }

            obj[keys[0]] = value;
        });

    public static delete = vi.fn().mockImplementation((key: string): void => {
        const keys = key.split('.');
        let obj = MockConfig.configData;

        while (keys.length > 1) {
            const k = keys.shift()!;
            if (!(k in obj)) return;
            obj = obj[k];
        }

        delete obj[keys[0]];
    });

    public static getAll = vi
        .fn()
        .mockImplementation((): Record<string, any> => {
            return { ...MockConfig.configData };
        });

    public static assign = vi
        .fn()
        .mockImplementation((config: Record<string, any>): void => {
            MockConfig.configData = { ...MockConfig.configData, ...config };
        });

    public static clear = vi.fn().mockImplementation((): void => {
        MockConfig.configData = {};
    });

    public static validateConfigs = vi.fn();

    public static envMap = vi.fn();

    public static setup(config: Record<string, any> = {}): void {
        MockConfig.configData = { ...config };
    }

    public static reset(): void {
        MockConfig.configData = {};
        MockConfig.loadConfig.mockReset();
        MockConfig.get.mockReset();
        MockConfig.has.mockReset();
        MockConfig.set.mockReset();
        MockConfig.delete.mockReset();
        MockConfig.getAll.mockReset();
        MockConfig.assign.mockReset();
        MockConfig.clear.mockReset();
        MockConfig.validateConfigs.mockReset();
        MockConfig.envMap.mockReset();

        MockConfig.get.mockImplementation(
            <T = any>(key: string, defaultValue?: any): T | null | any => {
                const value = key
                    .split('.')
                    .reduce(
                        (o, k) =>
                            o && o[k] !== undefined && o[k] !== null
                                ? o[k]
                                : null,
                        MockConfig.configData,
                    ) as T;
                return value !== null ? value : defaultValue;
            },
        );

        MockConfig.has.mockImplementation((key: string): boolean => {
            return (
                key
                    .split('.')
                    .reduce(
                        (o, k) => (o && k in o ? o[k] : undefined),
                        MockConfig.configData,
                    ) !== undefined
            );
        });

        MockConfig.set.mockImplementation((key: string, value: any): void => {
            const keys = key.split('.');
            let obj = MockConfig.configData;

            while (keys.length > 1) {
                const k = keys.shift()!;
                obj[k] = obj[k] || {};
                obj = obj[k];
            }

            obj[keys[0]] = value;
        });

        MockConfig.delete.mockImplementation((key: string): void => {
            const keys = key.split('.');
            let obj = MockConfig.configData;

            while (keys.length > 1) {
                const k = keys.shift()!;
                if (!(k in obj)) return;
                obj = obj[k];
            }

            delete obj[keys[0]];
        });

        MockConfig.getAll.mockImplementation((): Record<string, any> => {
            return { ...MockConfig.configData };
        });

        MockConfig.assign.mockImplementation(
            (config: Record<string, any>): void => {
                MockConfig.configData = { ...MockConfig.configData, ...config };
            },
        );

        MockConfig.clear.mockImplementation((): void => {
            MockConfig.configData = {};
        });
    }

    public static getMockModule() {
        return {
            Config: MockConfig,
        };
    }
}

export const mockConfig = MockConfig;
