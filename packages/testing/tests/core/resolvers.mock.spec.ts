import { describe, it, expect, beforeEach, vi } from 'vitest';
import { MockResolvers, mockResolvers } from '../../core/resolvers.mock';

describe('MockResolvers', () => {
    beforeEach(() => {
        MockResolvers.reset();
    });

    it('should add a resolver', () => {
        const mockFn = vi.fn();
        MockResolvers.add('test.namespace', mockFn);

        expect(MockResolvers.resolvers.get('test.namespace')).toBe(mockFn);
        expect(MockResolvers.add).toHaveBeenCalledWith(
            'test.namespace',
            mockFn,
        );
    });

    it('should execute a resolver', async () => {
        const mockFn = vi.fn().mockResolvedValue('result');
        MockResolvers.add('test.namespace', mockFn);

        const args = { data: 'test' };
        await MockResolvers.execute('test.namespace', args);

        expect(mockFn).toHaveBeenCalledWith(args);
        expect(MockResolvers.execute).toHaveBeenCalledWith(
            'test.namespace',
            args,
        );
    });

    it('should not fail when executing non-existent resolver', async () => {
        const result = await MockResolvers.execute('non.existent');
        expect(result).toBeUndefined();
    });

    it('should check if resolver exists', () => {
        const mockFn = vi.fn();
        MockResolvers.add('test.namespace', mockFn);

        expect(MockResolvers.has('test.namespace')).toBe(true);
        expect(MockResolvers.has('non.existent')).toBe(false);
        expect(MockResolvers.has).toHaveBeenCalledWith('test.namespace');
        expect(MockResolvers.has).toHaveBeenCalledWith('non.existent');
    });

    it('should clear resolvers by namespace', () => {
        const mockFn1 = vi.fn();
        const mockFn2 = vi.fn();
        MockResolvers.add('test.namespace1', mockFn1);
        MockResolvers.add('test.namespace2', mockFn2);

        expect(MockResolvers.has('test.namespace1')).toBe(true);
        expect(MockResolvers.has('test.namespace2')).toBe(true);

        MockResolvers.clear('test.namespace1');

        expect(MockResolvers.has('test.namespace1')).toBe(false);
        expect(MockResolvers.has('test.namespace2')).toBe(true);
        expect(MockResolvers.clear).toHaveBeenCalledWith('test.namespace1');
    });

    it('should remove a resolver', () => {
        const mockFn = vi.fn();
        MockResolvers.add('test.namespace', mockFn);

        expect(MockResolvers.has('test.namespace')).toBe(true);

        const result = MockResolvers.remove('test.namespace');

        expect(result).toBe(true);
        expect(MockResolvers.has('test.namespace')).toBe(false);
        expect(MockResolvers.remove).toHaveBeenCalledWith('test.namespace');
    });

    it('should return false when removing non-existent resolver', () => {
        const result = MockResolvers.remove('non.existent');
        expect(result).toBe(false);
        expect(MockResolvers.remove).toHaveBeenCalledWith('non.existent');
    });

    it('should reset all resolvers and mocks', () => {
        const mockFn = vi.fn();
        MockResolvers.add('test.namespace', mockFn);

        expect(MockResolvers.resolvers.size).toBe(1);

        const addCallCount = MockResolvers.add.mock.calls.length;
        const hasCallCount = MockResolvers.has.mock.calls.length;

        MockResolvers.reset();

        expect(MockResolvers.resolvers.size).toBe(0);
        expect(MockResolvers.add.mock.calls.length).toBe(0);
        expect(MockResolvers.has.mock.calls.length).toBe(0);
    });

    it('should provide mock module structure', () => {
        const mockModule = MockResolvers.getMockModule();
        expect(mockModule).toHaveProperty('Resolvers', MockResolvers);
    });

    it('should expose mockResolvers as an alias', () => {
        expect(mockResolvers).toBe(MockResolvers);
    });
});
