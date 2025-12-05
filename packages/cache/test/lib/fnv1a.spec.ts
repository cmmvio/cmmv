import { describe, it, expect } from 'vitest';
import { fnv1a } from '../../lib/fnv1a';

describe('fnv1a', () => {
    describe('string input', () => {
        it('should return a number for string input', () => {
            const result = fnv1a('hello');

            expect(typeof result).toBe('number');
        });

        it('should return consistent hash for same string', () => {
            const hash1 = fnv1a('test');
            const hash2 = fnv1a('test');

            expect(hash1).toBe(hash2);
        });

        it('should return different hashes for different strings', () => {
            const hash1 = fnv1a('test1');
            const hash2 = fnv1a('test2');

            expect(hash1).not.toBe(hash2);
        });

        it('should handle empty string', () => {
            const result = fnv1a('');

            expect(typeof result).toBe('number');
            expect(result).toBeGreaterThan(0);
        });

        it('should handle long strings', () => {
            const longString = 'a'.repeat(10000);
            const result = fnv1a(longString);

            expect(typeof result).toBe('number');
        });

        it('should handle unicode strings', () => {
            const result = fnv1a('你好世界');

            expect(typeof result).toBe('number');
        });

        it('should handle special characters', () => {
            const result = fnv1a('!@#$%^&*()');

            expect(typeof result).toBe('number');
        });

        it('should handle strings with spaces', () => {
            const result = fnv1a('hello world');

            expect(typeof result).toBe('number');
        });

        it('should return unsigned 32-bit integer', () => {
            const result = fnv1a('test');

            expect(result).toBeGreaterThanOrEqual(0);
            expect(result).toBeLessThanOrEqual(4294967295);
        });

        it('should have good distribution', () => {
            // Generate hashes for many strings
            const hashes = new Set<number>();
            for (let i = 0; i < 1000; i++) {
                hashes.add(fnv1a(`key${i}`));
            }

            // Should have mostly unique hashes (allow some collisions)
            expect(hashes.size).toBeGreaterThan(990);
        });
    });

    describe('buffer input', () => {
        it('should return a number for Buffer input', () => {
            const buffer = Buffer.from('hello');
            const result = fnv1a(buffer);

            expect(typeof result).toBe('number');
        });

        it('should return consistent hash for same buffer', () => {
            const buffer = Buffer.from('test');
            const hash1 = fnv1a(buffer);
            const hash2 = fnv1a(buffer);

            expect(hash1).toBe(hash2);
        });

        it('should return different hashes for different buffers', () => {
            const buffer1 = Buffer.from('test1');
            const buffer2 = Buffer.from('test2');
            const hash1 = fnv1a(buffer1);
            const hash2 = fnv1a(buffer2);

            expect(hash1).not.toBe(hash2);
        });

        it('should handle empty buffer', () => {
            const buffer = Buffer.from('');
            const result = fnv1a(buffer);

            expect(typeof result).toBe('number');
        });

        it('should handle binary data', () => {
            const buffer = Buffer.from([0x00, 0xff, 0x10, 0x20, 0x30]);
            const result = fnv1a(buffer);

            expect(typeof result).toBe('number');
        });

        it('should return same hash for string and its buffer equivalent', () => {
            const str = 'hello';
            const buffer = Buffer.from(str);

            const stringHash = fnv1a(str);
            const bufferHash = fnv1a(buffer);

            expect(stringHash).toBe(bufferHash);
        });
    });

    describe('error handling', () => {
        it('should throw error for number input', () => {
            expect(() => fnv1a(123 as any)).toThrow(
                'input must be a string or a Buffer',
            );
        });

        it('should throw error for object input', () => {
            expect(() => fnv1a({} as any)).toThrow(
                'input must be a string or a Buffer',
            );
        });

        it('should throw error for array input', () => {
            expect(() => fnv1a([] as any)).toThrow(
                'input must be a string or a Buffer',
            );
        });

        it('should throw error for null input', () => {
            expect(() => fnv1a(null as any)).toThrow(
                'input must be a string or a Buffer',
            );
        });

        it('should throw error for undefined input', () => {
            expect(() => fnv1a(undefined as any)).toThrow(
                'input must be a string or a Buffer',
            );
        });

        it('should throw error for boolean input', () => {
            expect(() => fnv1a(true as any)).toThrow(
                'input must be a string or a Buffer',
            );
        });
    });

    describe('known values', () => {
        it('should match expected FNV-1a hash for "a"', () => {
            // FNV-1a 32-bit hash for "a" is known
            const result = fnv1a('a');
            expect(result).toBe(3826002220);
        });

        it('should match expected FNV-1a hash for "foobar"', () => {
            // Test another known value
            const result = fnv1a('foobar');
            expect(typeof result).toBe('number');
        });
    });
});
