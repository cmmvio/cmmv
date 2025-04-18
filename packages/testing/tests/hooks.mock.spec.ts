import { describe, it, expect, beforeEach, vi } from 'vitest';
import { MockHooks, MockHooksType } from '../lib/hooks.mock';

describe('MockHooks', () => {
    beforeEach(() => {
        MockHooks.reset();
    });

    it('should add a hook', () => {
        const mockFn = vi.fn();
        MockHooks.add(MockHooksType.Log, mockFn);

        expect(MockHooks.events.get(MockHooksType.Log)).toContain(mockFn);
        expect(MockHooks.add).toHaveBeenCalledWith(MockHooksType.Log, mockFn);
    });

    it('should execute hooks', async () => {
        const mockFn1 = vi.fn();
        const mockFn2 = vi.fn();

        MockHooks.add(MockHooksType.Log, mockFn1);
        MockHooks.add(MockHooksType.Log, mockFn2);

        await MockHooks.execute(MockHooksType.Log, 'test data');

        expect(mockFn1).toHaveBeenCalledWith('test data');
        expect(mockFn2).toHaveBeenCalledWith('test data');
        expect(MockHooks.execute).toHaveBeenCalledWith(
            MockHooksType.Log,
            'test data',
        );
    });

    it('should check if hook exists', () => {
        const mockFn = vi.fn();
        MockHooks.add(MockHooksType.Log, mockFn);

        expect(MockHooks.has(MockHooksType.Log)).toBe(true);
        expect(MockHooks.has(MockHooksType.onError)).toBe(false);
        expect(MockHooks.has).toHaveBeenCalledWith(MockHooksType.Log);
        expect(MockHooks.has).toHaveBeenCalledWith(MockHooksType.onError);
    });

    it('should clear hooks for a specific event', () => {
        const mockFn = vi.fn();
        MockHooks.add(MockHooksType.Log, mockFn);
        MockHooks.add(MockHooksType.onError, vi.fn());

        expect(MockHooks.has(MockHooksType.Log)).toBe(true);

        MockHooks.clear(MockHooksType.Log);

        expect(MockHooks.has(MockHooksType.Log)).toBe(false);
        expect(MockHooks.has(MockHooksType.onError)).toBe(true);
        expect(MockHooks.clear).toHaveBeenCalledWith(MockHooksType.Log);
    });

    it('should remove a specific hook function', () => {
        const mockFn1 = vi.fn();
        const mockFn2 = vi.fn();

        MockHooks.add(MockHooksType.Log, mockFn1);
        MockHooks.add(MockHooksType.Log, mockFn2);

        expect(MockHooks.events.get(MockHooksType.Log)).toContain(mockFn1);
        expect(MockHooks.events.get(MockHooksType.Log)).toContain(mockFn2);

        const result = MockHooks.remove(MockHooksType.Log, mockFn1);

        expect(result).toBe(true);
        expect(MockHooks.events.get(MockHooksType.Log)).not.toContain(mockFn1);
        expect(MockHooks.events.get(MockHooksType.Log)).toContain(mockFn2);
        expect(MockHooks.remove).toHaveBeenCalledWith(
            MockHooksType.Log,
            mockFn1,
        );
    });

    it('should return false when trying to remove a non-existent hook', () => {
        const mockFn1 = vi.fn();
        const mockFn2 = vi.fn();

        MockHooks.add(MockHooksType.Log, mockFn1);

        const result = MockHooks.remove(MockHooksType.Log, mockFn2);

        expect(result).toBe(false);
        expect(MockHooks.remove).toHaveBeenCalledWith(
            MockHooksType.Log,
            mockFn2,
        );
    });

    it('should reset all hooks and mock implementations', () => {
        const mockFn = vi.fn();
        MockHooks.add(MockHooksType.Log, mockFn);

        expect(MockHooks.has(MockHooksType.Log)).toBe(true);

        // Guardar estado dos contadores
        const addCallCount = MockHooks.add.mock.calls.length;
        const hasCallCount = MockHooks.has.mock.calls.length;

        MockHooks.reset();

        // Verificar que os dados foram limpos
        expect(MockHooks.events.size).toBe(0);
        expect(MockHooks.has(MockHooksType.Log)).toBe(false);

        // Verificar que os contadores foram resetados
        expect(MockHooks.add.mock.calls.length).toBe(0);
        expect(MockHooks.has.mock.calls.length).toBe(1); // Da chamada acima
    });

    it('should provide mock module structure', () => {
        const mockModule = MockHooks.getMockModule();
        expect(mockModule).toHaveProperty('Hooks', MockHooks);
        expect(mockModule).toHaveProperty('HooksType', MockHooksType);
    });

    it('should correctly define hook types', () => {
        expect(MockHooksType.Log).toBe('Log');
        expect(MockHooksType.onError).toBe('onError');
        expect(MockHooksType.onInitialize).toBe('onInitialize');
        expect(MockHooksType.onPreInitialize).toBe('onPreInitialize');
        expect(MockHooksType.onListen).toBe('onListen');
        expect(MockHooksType.onHTTPServerInit).toBe('onHTTPServerInit');
        expect(MockHooksType.onSettingChange).toBe('onSettingChange');
    });
});
