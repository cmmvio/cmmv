import { describe, it, expect, beforeEach, vi } from 'vitest';
import { AppRegistry } from '../../registries/app.registry';

describe('AppRegistry', () => {
    beforeEach(() => {
        AppRegistry.clear();
    });

    describe('register', () => {
        it('should register a new application instance', () => {
            const mockApp = { name: 'test-app' };
            AppRegistry.register('test-scope', mockApp, 'agent');

            expect(AppRegistry.has('test-scope')).toBe(true);
            expect(AppRegistry.get('test-scope')).toBe(mockApp);
        });

        it('should throw error when registering duplicate scopeId', () => {
            const mockApp = { name: 'test-app' };
            AppRegistry.register('test-scope', mockApp, 'agent');

            expect(() => {
                AppRegistry.register(
                    'test-scope',
                    { name: 'another-app' },
                    'agent',
                );
            }).toThrow("Application scope 'test-scope' already exists");
        });

        it('should register with correct scope info', () => {
            const mockApp = { name: 'test-app' };
            AppRegistry.register(
                'test-scope',
                mockApp,
                'agent',
                'parent-scope',
            );

            const info = AppRegistry.getInfo('test-scope');
            expect(info).toBeDefined();
            expect(info?.scopeId).toBe('test-scope');
            expect(info?.scope).toBe('agent');
            expect(info?.parentScopeId).toBe('parent-scope');
            expect(info?.isInitialized).toBe(false);
            expect(info?.isDisposed).toBe(false);
            expect(info?.createdAt).toBeInstanceOf(Date);
        });
    });

    describe('get', () => {
        it('should return undefined for non-existent scope', () => {
            expect(AppRegistry.get('non-existent')).toBeUndefined();
        });

        it('should return registered application instance', () => {
            const mockApp = { name: 'test-app' };
            AppRegistry.register('test-scope', mockApp, 'agent');

            expect(AppRegistry.get('test-scope')).toBe(mockApp);
        });
    });

    describe('has', () => {
        it('should return false for non-existent scope', () => {
            expect(AppRegistry.has('non-existent')).toBe(false);
        });

        it('should return true for registered scope', () => {
            AppRegistry.register('test-scope', {}, 'agent');
            expect(AppRegistry.has('test-scope')).toBe(true);
        });
    });

    describe('markInitialized', () => {
        it('should mark scope as initialized', () => {
            AppRegistry.register('test-scope', {}, 'agent');
            AppRegistry.markInitialized('test-scope');

            const info = AppRegistry.getInfo('test-scope');
            expect(info?.isInitialized).toBe(true);
        });

        it('should do nothing for non-existent scope', () => {
            expect(() => {
                AppRegistry.markInitialized('non-existent');
            }).not.toThrow();
        });
    });

    describe('dispose', () => {
        it('should dispose a scope and remove it from registry', async () => {
            const mockApp = {
                dispose: vi.fn().mockResolvedValue(undefined),
            };
            AppRegistry.register('test-scope', mockApp, 'agent');

            const result = await AppRegistry.dispose('test-scope');

            expect(result).toBe(true);
            expect(mockApp.dispose).toHaveBeenCalled();
            expect(AppRegistry.has('test-scope')).toBe(false);
        });

        it('should return false for non-existent scope', async () => {
            const result = await AppRegistry.dispose('non-existent');
            expect(result).toBe(false);
        });

        it('should work even if app has no dispose method', async () => {
            AppRegistry.register('test-scope', {}, 'agent');
            const result = await AppRegistry.dispose('test-scope');

            expect(result).toBe(true);
            expect(AppRegistry.has('test-scope')).toBe(false);
        });
    });

    describe('disposeAll', () => {
        it('should dispose all scopes except singleton', async () => {
            AppRegistry.registerSingleton({ name: 'singleton' });
            AppRegistry.register('agent-1', {}, 'agent');
            AppRegistry.register('agent-2', {}, 'agent');

            await AppRegistry.disposeAll();

            expect(AppRegistry.has(AppRegistry.getSingletonId())).toBe(true);
            expect(AppRegistry.has('agent-1')).toBe(false);
            expect(AppRegistry.has('agent-2')).toBe(false);
        });
    });

    describe('registerSingleton', () => {
        it('should register singleton instance', () => {
            const mockApp = { name: 'singleton-app' };
            AppRegistry.registerSingleton(mockApp);

            expect(AppRegistry.getSingleton()).toBe(mockApp);
        });

        it('should update existing singleton', () => {
            AppRegistry.registerSingleton({ name: 'old-singleton' });
            const newApp = { name: 'new-singleton' };
            AppRegistry.registerSingleton(newApp);

            expect(AppRegistry.getSingleton()).toBe(newApp);
        });
    });

    describe('getAllScopeIds', () => {
        it('should return all registered scope IDs', () => {
            AppRegistry.register('scope-1', {}, 'agent');
            AppRegistry.register('scope-2', {}, 'agent');
            AppRegistry.register('scope-3', {}, 'request');

            const scopeIds = AppRegistry.getAllScopeIds();
            expect(scopeIds).toContain('scope-1');
            expect(scopeIds).toContain('scope-2');
            expect(scopeIds).toContain('scope-3');
            expect(scopeIds).toHaveLength(3);
        });
    });

    describe('getByType', () => {
        it('should return scopes filtered by type', () => {
            AppRegistry.register('agent-1', {}, 'agent');
            AppRegistry.register('agent-2', {}, 'agent');
            AppRegistry.register('request-1', {}, 'request');

            const agentScopes = AppRegistry.getByType('agent');
            expect(agentScopes).toHaveLength(2);
            expect(agentScopes.every((s) => s.scope === 'agent')).toBe(true);

            const requestScopes = AppRegistry.getByType('request');
            expect(requestScopes).toHaveLength(1);
            expect(requestScopes[0].scope).toBe('request');
        });
    });

    describe('count', () => {
        it('should return correct count of registered scopes', () => {
            expect(AppRegistry.count()).toBe(0);

            AppRegistry.register('scope-1', {}, 'agent');
            expect(AppRegistry.count()).toBe(1);

            AppRegistry.register('scope-2', {}, 'agent');
            expect(AppRegistry.count()).toBe(2);
        });
    });

    describe('clear', () => {
        it('should remove all registrations', () => {
            AppRegistry.register('scope-1', {}, 'agent');
            AppRegistry.register('scope-2', {}, 'agent');

            AppRegistry.clear();

            expect(AppRegistry.count()).toBe(0);
        });
    });
});
