import { describe, it, expect, beforeEach, vi } from 'vitest';
import { ApplicationFactory } from '../application.factory';
import { AppRegistry } from '../registries/app.registry';
import { ScopeContext } from '../utils/scope.context';

// Mock Application class to avoid full initialization
vi.mock('../application', () => ({
    Application: vi
        .fn()
        .mockImplementation((settings, compile, scopeConfig) => ({
            settings,
            compile,
            _scope: scopeConfig?.scope || 'singleton',
            _scopeId: scopeConfig?.scopeId || '__singleton__',
            scope: scopeConfig?.scope || 'singleton',
            scopeId: scopeConfig?.scopeId || '__singleton__',
            dispose: vi.fn().mockResolvedValue(undefined),
        })),
    IApplicationSettings: {},
}));

describe('ApplicationFactory', () => {
    beforeEach(() => {
        AppRegistry.clear();
        vi.clearAllMocks();
    });

    describe('create', () => {
        it('should create singleton application by default', () => {
            const app = ApplicationFactory.create({});

            expect(app.scope).toBe('singleton');
            expect(AppRegistry.getSingleton()).toBeDefined();
        });

        it('should create agent-scoped application with scopeId', () => {
            const app = ApplicationFactory.create({
                scope: 'agent',
                scopeId: 'my-agent',
            });

            expect(app.scope).toBe('agent');
            expect(app.scopeId).toBe('my-agent');
            expect(AppRegistry.has('my-agent')).toBe(true);
        });

        it('should throw error for agent scope without scopeId', () => {
            expect(() => {
                ApplicationFactory.create({
                    scope: 'agent',
                });
            }).toThrow("scopeId is required for 'agent' scope");
        });

        it('should auto-generate scopeId for request scope', () => {
            const app = ApplicationFactory.create({
                scope: 'request',
            });

            expect(app.scope).toBe('request');
            expect(app.scopeId).toMatch(/^request-/);
        });

        it('should throw error for duplicate agent scopeId', () => {
            ApplicationFactory.create({
                scope: 'agent',
                scopeId: 'my-agent',
            });

            expect(() => {
                ApplicationFactory.create({
                    scope: 'agent',
                    scopeId: 'my-agent',
                });
            }).toThrow("Application scope 'my-agent' already exists");
        });
    });

    describe('get', () => {
        it('should return undefined for non-existent scope', () => {
            expect(ApplicationFactory.get('non-existent')).toBeUndefined();
        });

        it('should return registered application', () => {
            const app = ApplicationFactory.create({
                scope: 'agent',
                scopeId: 'my-agent',
            });

            expect(ApplicationFactory.get('my-agent')).toBe(app);
        });
    });

    describe('has', () => {
        it('should return false for non-existent scope', () => {
            expect(ApplicationFactory.has('non-existent')).toBe(false);
        });

        it('should return true for registered scope', () => {
            ApplicationFactory.create({
                scope: 'agent',
                scopeId: 'my-agent',
            });

            expect(ApplicationFactory.has('my-agent')).toBe(true);
        });
    });

    describe('dispose', () => {
        it('should dispose scoped application', async () => {
            ApplicationFactory.create({
                scope: 'agent',
                scopeId: 'my-agent',
            });

            const result = await ApplicationFactory.dispose('my-agent');

            expect(result).toBe(true);
            expect(ApplicationFactory.has('my-agent')).toBe(false);
        });

        it('should return false for non-existent scope', async () => {
            const result = await ApplicationFactory.dispose('non-existent');
            expect(result).toBe(false);
        });
    });

    describe('disposeAll', () => {
        it('should dispose all non-singleton scopes', async () => {
            ApplicationFactory.create({});
            ApplicationFactory.create({
                scope: 'agent',
                scopeId: 'agent-1',
            });
            ApplicationFactory.create({
                scope: 'agent',
                scopeId: 'agent-2',
            });

            await ApplicationFactory.disposeAll();

            expect(ApplicationFactory.getSingleton()).toBeDefined();
            expect(ApplicationFactory.has('agent-1')).toBe(false);
            expect(ApplicationFactory.has('agent-2')).toBe(false);
        });
    });

    describe('getAllScopeIds', () => {
        it('should return all registered scope IDs', () => {
            ApplicationFactory.create({});
            ApplicationFactory.create({
                scope: 'agent',
                scopeId: 'agent-1',
            });

            const scopeIds = ApplicationFactory.getAllScopeIds();

            expect(scopeIds).toContain('__singleton__');
            expect(scopeIds).toContain('agent-1');
        });
    });

    describe('getByType', () => {
        it('should return scopes filtered by type', () => {
            ApplicationFactory.create({});
            ApplicationFactory.create({
                scope: 'agent',
                scopeId: 'agent-1',
            });
            ApplicationFactory.create({
                scope: 'agent',
                scopeId: 'agent-2',
            });

            const agentScopes = ApplicationFactory.getByType('agent');

            expect(agentScopes).toHaveLength(2);
            expect(agentScopes.every((s) => s.scope === 'agent')).toBe(true);
        });
    });

    describe('current', () => {
        it('should return singleton when not in scope context', () => {
            const singleton = ApplicationFactory.create({});

            expect(ApplicationFactory.current()).toBe(singleton);
        });

        it('should return scoped app when in scope context', () => {
            ApplicationFactory.create({});
            const scopedApp = ApplicationFactory.create({
                scope: 'agent',
                scopeId: 'my-agent',
            });

            ScopeContext.run('my-agent', () => {
                expect(ApplicationFactory.current()).toBe(scopedApp);
            });
        });
    });

    describe('runInScope', () => {
        it('should run callback within scope', async () => {
            ApplicationFactory.create({
                scope: 'agent',
                scopeId: 'my-agent',
            });

            let capturedScopeId: string | undefined;
            await ApplicationFactory.runInScope('my-agent', async () => {
                capturedScopeId = ScopeContext.getCurrentScopeId();
            });

            expect(capturedScopeId).toBe('my-agent');
        });
    });

    describe('count', () => {
        it('should return correct count', () => {
            expect(ApplicationFactory.count()).toBe(0);

            ApplicationFactory.create({});
            expect(ApplicationFactory.count()).toBe(1);

            ApplicationFactory.create({
                scope: 'agent',
                scopeId: 'my-agent',
            });
            expect(ApplicationFactory.count()).toBe(2);
        });
    });
});
