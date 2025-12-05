import { describe, it, expect, beforeEach } from 'vitest';
import 'reflect-metadata';
import { MixedDecorator } from '../../decorators/mixed.decorator';

describe('MixedDecorator', () => {
    const TEST_METAKEY = 'test:metadata';

    beforeEach(() => {
        // Clear any existing metadata
    });

    describe('as ClassDecorator', () => {
        it('should set metadata on class with object', () => {
            @MixedDecorator(TEST_METAKEY, { key: 'value' })
            class TestClass {}

            const metadata = Reflect.getMetadata(TEST_METAKEY, TestClass);
            expect(metadata).toEqual({ key: 'value' });
        });

        it('should merge object metadata with existing metadata', () => {
            @MixedDecorator(TEST_METAKEY, { key1: 'value1' })
            @MixedDecorator(TEST_METAKEY, { key2: 'value2' })
            class TestClass {}

            const metadata = Reflect.getMetadata(TEST_METAKEY, TestClass);
            expect(metadata).toEqual({ key1: 'value1', key2: 'value2' });
        });

        it('should set metadata on class with array', () => {
            @MixedDecorator(TEST_METAKEY, ['item1', 'item2'])
            class TestClass {}

            const metadata = Reflect.getMetadata(TEST_METAKEY, TestClass);
            expect(metadata).toEqual(['item1', 'item2']);
        });

        it('should merge array metadata with existing array', () => {
            @MixedDecorator(TEST_METAKEY, ['item3', 'item4'])
            @MixedDecorator(TEST_METAKEY, ['item1', 'item2'])
            class TestClass {}

            const metadata = Reflect.getMetadata(TEST_METAKEY, TestClass);
            expect(metadata).toEqual(['item1', 'item2', 'item3', 'item4']);
        });

        it('should return the target class', () => {
            const decorator = MixedDecorator(TEST_METAKEY, { key: 'value' });

            class TestClass {}

            const result = decorator(TestClass);
            expect(result).toBe(TestClass);
        });
    });

    describe('as MethodDecorator', () => {
        it('should set metadata on method with object', () => {
            class TestClass {
                @MixedDecorator(TEST_METAKEY, { key: 'value' })
                testMethod() {}
            }

            const metadata = Reflect.getMetadata(
                TEST_METAKEY,
                TestClass.prototype.testMethod,
            );
            expect(metadata).toEqual({ key: 'value' });
        });

        it('should merge object metadata on method', () => {
            class TestClass {
                @MixedDecorator(TEST_METAKEY, { key2: 'value2' })
                @MixedDecorator(TEST_METAKEY, { key1: 'value1' })
                testMethod() {}
            }

            const metadata = Reflect.getMetadata(
                TEST_METAKEY,
                TestClass.prototype.testMethod,
            );
            expect(metadata).toEqual({ key1: 'value1', key2: 'value2' });
        });

        it('should set metadata on method with array', () => {
            class TestClass {
                @MixedDecorator(TEST_METAKEY, ['item1', 'item2'])
                testMethod() {}
            }

            const metadata = Reflect.getMetadata(
                TEST_METAKEY,
                TestClass.prototype.testMethod,
            );
            expect(metadata).toEqual(['item1', 'item2']);
        });

        it('should merge array metadata on method', () => {
            class TestClass {
                @MixedDecorator(TEST_METAKEY, ['item3', 'item4'])
                @MixedDecorator(TEST_METAKEY, ['item1', 'item2'])
                testMethod() {}
            }

            const metadata = Reflect.getMetadata(
                TEST_METAKEY,
                TestClass.prototype.testMethod,
            );
            expect(metadata).toEqual(['item1', 'item2', 'item3', 'item4']);
        });

        it('should return the descriptor', () => {
            const descriptor = {
                value: () => {},
                writable: true,
                enumerable: false,
                configurable: true,
            };

            const decorator = MixedDecorator(TEST_METAKEY, { key: 'value' });
            const result = decorator({}, 'testMethod', descriptor);

            expect(result).toBe(descriptor);
        });
    });

    describe('edge cases', () => {
        it('should handle empty object metadata', () => {
            @MixedDecorator(TEST_METAKEY, {})
            class TestClass {}

            const metadata = Reflect.getMetadata(TEST_METAKEY, TestClass);
            expect(metadata).toEqual({});
        });

        it('should handle empty array metadata', () => {
            @MixedDecorator(TEST_METAKEY, [])
            class TestClass {}

            const metadata = Reflect.getMetadata(TEST_METAKEY, TestClass);
            expect(metadata).toEqual([]);
        });

        it('should handle nested object metadata', () => {
            @MixedDecorator(TEST_METAKEY, { nested: { deep: 'value' } })
            class TestClass {}

            const metadata = Reflect.getMetadata(TEST_METAKEY, TestClass);
            expect(metadata).toEqual({ nested: { deep: 'value' } });
        });

        it('should handle different metakeys independently', () => {
            const METAKEY_1 = 'test:meta1';
            const METAKEY_2 = 'test:meta2';

            @MixedDecorator(METAKEY_1, { key1: 'value1' })
            @MixedDecorator(METAKEY_2, { key2: 'value2' })
            class TestClass {}

            expect(Reflect.getMetadata(METAKEY_1, TestClass)).toEqual({
                key1: 'value1',
            });
            expect(Reflect.getMetadata(METAKEY_2, TestClass)).toEqual({
                key2: 'value2',
            });
        });
    });
});
