import { describe, it, expect, beforeEach, vi } from 'vitest';
import {
    ScopeContext,
    runWithApplicationScope,
    runWithApplicationScopeSync,
} from '../../utils/scope.context';
import { AppRegistry } from '../../registries/app.registry';

describe('ScopeContext', () => {
    beforeEach(() => {
        AppRegistry.clear();
    });

    describe('getCurrentScopeId', () => {
        it('should return undefined when not in a scope', () => {
            expect(ScopeContext.getCurrentScopeId()).toBeUndefined();
        });

        it('should return scopeId when in a scope', () => {
            ScopeContext.run('test-scope', () => {
                expect(ScopeContext.getCurrentScopeId()).toBe('test-scope');
            });
        });
    });

    describe('isInScope', () => {
        it('should return false when not in a scope', () => {
            expect(ScopeContext.isInScope()).toBe(false);
        });

        it('should return true when in a scope', () => {
            ScopeContext.run('test-scope', () => {
                expect(ScopeContext.isInScope()).toBe(true);
            });
        });
    });

    describe('run', () => {
        it('should execute callback within scope context', () => {
            const result = ScopeContext.run('test-scope', () => {
                return ScopeContext.getCurrentScopeId();
            });

            expect(result).toBe('test-scope');
        });

        it('should restore context after execution', () => {
            ScopeContext.run('test-scope', () => {
                expect(ScopeContext.getCurrentScopeId()).toBe('test-scope');
            });

            expect(ScopeContext.getCurrentScopeId()).toBeUndefined();
        });

        it('should support nested scopes', () => {
            ScopeContext.run('outer-scope', () => {
                expect(ScopeContext.getCurrentScopeId()).toBe('outer-scope');

                ScopeContext.run('inner-scope', () => {
                    expect(ScopeContext.getCurrentScopeId()).toBe(
                        'inner-scope',
                    );
                });

                expect(ScopeContext.getCurrentScopeId()).toBe('outer-scope');
            });
        });

        it('should include metadata', () => {
            ScopeContext.run(
                'test-scope',
                () => {
                    expect(ScopeContext.getMetadata('key')).toBe('value');
                },
                { key: 'value' },
            );
        });
    });

    describe('runAsync', () => {
        it('should execute async callback within scope context', async () => {
            const result = await ScopeContext.runAsync(
                'test-scope',
                async () => {
                    await new Promise((resolve) => setTimeout(resolve, 10));
                    return ScopeContext.getCurrentScopeId();
                },
            );

            expect(result).toBe('test-scope');
        });

        it('should maintain context across async operations', async () => {
            await ScopeContext.runAsync('test-scope', async () => {
                expect(ScopeContext.getCurrentScopeId()).toBe('test-scope');
                await new Promise((resolve) => setTimeout(resolve, 10));
                expect(ScopeContext.getCurrentScopeId()).toBe('test-scope');
            });
        });
    });

    describe('getContext', () => {
        it('should return undefined when not in a scope', () => {
            expect(ScopeContext.getContext()).toBeUndefined();
        });

        it('should return context data when in a scope', () => {
            ScopeContext.run(
                'test-scope',
                () => {
                    const context = ScopeContext.getContext();
                    expect(context?.scopeId).toBe('test-scope');
                },
                { extra: 'data' },
            );
        });
    });

    describe('metadata', () => {
        it('should set and get metadata', () => {
            ScopeContext.run('test-scope', () => {
                ScopeContext.setMetadata('key1', 'value1');
                ScopeContext.setMetadata('key2', { nested: true });

                expect(ScopeContext.getMetadata('key1')).toBe('value1');
                expect(ScopeContext.getMetadata('key2')).toEqual({
                    nested: true,
                });
            });
        });

        it('should return undefined for non-existent metadata', () => {
            ScopeContext.run('test-scope', () => {
                expect(
                    ScopeContext.getMetadata('non-existent'),
                ).toBeUndefined();
            });
        });
    });

    describe('getCurrentApplication', () => {
        it('should return singleton when not in scope', () => {
            const singleton = { name: 'singleton' };
            AppRegistry.registerSingleton(singleton);

            expect(ScopeContext.getCurrentApplication()).toBe(singleton);
        });

        it('should return scoped app when in scope', () => {
            const singleton = { name: 'singleton' };
            const scopedApp = { name: 'scoped' };

            AppRegistry.registerSingleton(singleton);
            AppRegistry.register('test-scope', scopedApp, 'agent');

            ScopeContext.run('test-scope', () => {
                expect(ScopeContext.getCurrentApplication()).toBe(scopedApp);
            });
        });

        it('should fallback to singleton if scoped app not found', () => {
            const singleton = { name: 'singleton' };
            AppRegistry.registerSingleton(singleton);

            ScopeContext.run('non-existent-scope', () => {
                expect(ScopeContext.getCurrentApplication()).toBe(singleton);
            });
        });
    });
});

describe('runWithApplicationScope', () => {
    beforeEach(() => {
        AppRegistry.clear();
    });

    it('should throw error if scope not found', async () => {
        await expect(
            runWithApplicationScope('non-existent', async () => {}),
        ).rejects.toThrow("Application scope 'non-existent' not found");
    });

    it('should run callback within registered scope', async () => {
        AppRegistry.register('test-scope', {}, 'agent');

        let scopeId: string | undefined;
        await runWithApplicationScope('test-scope', async () => {
            scopeId = ScopeContext.getCurrentScopeId();
        });

        expect(scopeId).toBe('test-scope');
    });

    it('should pass metadata to context', async () => {
        AppRegistry.register('test-scope', {}, 'agent');

        let metaValue: string | undefined;
        await runWithApplicationScope(
            'test-scope',
            async () => {
                metaValue = ScopeContext.getMetadata('key');
            },
            { key: 'test-value' },
        );

        expect(metaValue).toBe('test-value');
    });
});

describe('runWithApplicationScopeSync', () => {
    beforeEach(() => {
        AppRegistry.clear();
    });

    it('should throw error if scope not found', () => {
        expect(() => {
            runWithApplicationScopeSync('non-existent', () => {});
        }).toThrow("Application scope 'non-existent' not found");
    });

    it('should run callback within registered scope', () => {
        AppRegistry.register('test-scope', {}, 'agent');

        const result = runWithApplicationScopeSync('test-scope', () => {
            return ScopeContext.getCurrentScopeId();
        });

        expect(result).toBe('test-scope');
    });
});
