import { describe, it, expect, vi, beforeEach } from 'vitest';
import { Expose } from 'class-transformer';
import 'reflect-metadata';
import { AbstractModel } from '../../abstracts/model.abstract';

// Test model class
class TestModel extends AbstractModel {
    @Expose()
    id: string;

    @Expose()
    name: string;

    @Expose()
    email: string;

    constructor(partial: Partial<TestModel> = {}) {
        super();
        Object.assign(this, partial);
    }

    static fromEntity(entity: any): TestModel {
        return new TestModel(entity);
    }
}

// Model without extra fields
class SimpleModel extends AbstractModel {
    @Expose()
    value: number;

    constructor(partial: Partial<SimpleModel> = {}) {
        super();
        Object.assign(this, partial);
    }
}

describe('AbstractModel', () => {
    describe('serialize', () => {
        it('should serialize model instance to plain object', () => {
            const model = new TestModel({
                id: '123',
                name: 'Test',
                email: 'test@example.com',
            });

            const result = model.serialize();

            expect(result).toEqual({
                id: '123',
                name: 'Test',
                email: 'test@example.com',
            });
        });

        it('should serialize empty model', () => {
            const model = new TestModel();

            const result = model.serialize();

            expect(result).toBeDefined();
            expect(typeof result).toBe('object');
        });

        it('should serialize model with partial data', () => {
            const model = new TestModel({ name: 'Partial' });

            const result = model.serialize();

            expect(result.name).toBe('Partial');
        });
    });

    describe('sanitizeEntity', () => {
        it('should sanitize entity with valid keys only', () => {
            const entity = {
                id: '123',
                name: 'Test',
                email: 'test@example.com',
                extraField: 'should be removed',
                anotherExtra: 123,
            };

            const result = AbstractModel.sanitizeEntity(TestModel, entity);

            expect(result).toBeInstanceOf(TestModel);
            expect((result as any).extraField).toBeUndefined();
            expect((result as any).anotherExtra).toBeUndefined();
        });

        it('should handle empty entity', () => {
            const entity = {};

            const result = AbstractModel.sanitizeEntity(TestModel, entity);

            expect(result).toBeInstanceOf(TestModel);
        });

        it('should handle entity with no matching keys', () => {
            const entity = {
                unknownKey1: 'value1',
                unknownKey2: 'value2',
            };

            const result = AbstractModel.sanitizeEntity(TestModel, entity);

            expect(result).toBeInstanceOf(TestModel);
        });

        it('should preserve valid values', () => {
            const entity = {
                id: 'valid-id',
                name: 'Valid Name',
                email: 'valid@email.com',
            };

            const result = AbstractModel.sanitizeEntity(TestModel, entity);

            expect((result as any).id).toBe('valid-id');
            expect((result as any).name).toBe('Valid Name');
            expect((result as any).email).toBe('valid@email.com');
        });

        it('should work with different model types', () => {
            const entity = {
                value: 42,
                extraField: 'extra',
            };

            const result = AbstractModel.sanitizeEntity(SimpleModel, entity);

            expect(result).toBeInstanceOf(SimpleModel);
            expect((result as any).value).toBe(42);
            expect((result as any).extraField).toBeUndefined();
        });
    });

    describe('fromEntity', () => {
        it('should return undefined by default', () => {
            const result = AbstractModel.fromEntity({ id: '123' });

            expect(result).toBeUndefined();
        });

        it('should be overridable in subclass', () => {
            const result = TestModel.fromEntity({
                id: '123',
                name: 'Test',
            });

            expect(result).toBeInstanceOf(TestModel);
            expect(result.id).toBe('123');
            expect(result.name).toBe('Test');
        });
    });

    describe('fromEntities', () => {
        it('should map array of entities using fromEntity', () => {
            const entities = [
                { id: '1', name: 'First' },
                { id: '2', name: 'Second' },
                { id: '3', name: 'Third' },
            ];

            const results = TestModel.fromEntities(entities);

            expect(results).toHaveLength(3);
            expect(results[0]).toBeInstanceOf(TestModel);
            expect(results[1]).toBeInstanceOf(TestModel);
            expect(results[2]).toBeInstanceOf(TestModel);
        });

        it('should handle empty array', () => {
            const results = TestModel.fromEntities([]);

            expect(results).toEqual([]);
        });

        it('should return array of undefined when using default fromEntity', () => {
            const results = AbstractModel.fromEntities([
                { id: '1' },
                { id: '2' },
            ]);

            expect(results).toHaveLength(2);
            expect(results[0]).toBeUndefined();
            expect(results[1]).toBeUndefined();
        });
    });

    describe('afterValidation', () => {
        it('should return the same item by default', () => {
            const model = new TestModel({ id: '123', name: 'Test' });

            const result = model.afterValidation(model);

            expect(result).toBe(model);
        });

        it('should be callable without modification', () => {
            const model = new TestModel({
                id: '456',
                name: 'Another',
                email: 'another@test.com',
            });

            const result = model.afterValidation(model);

            expect(result.id).toBe('456');
            expect(result.name).toBe('Another');
            expect(result.email).toBe('another@test.com');
        });
    });

    describe('inheritance', () => {
        it('should allow creating custom model classes', () => {
            class CustomModel extends AbstractModel {
                @Expose()
                customField: string;

                constructor(partial: Partial<CustomModel> = {}) {
                    super();
                    Object.assign(this, partial);
                }
            }

            const model = new CustomModel({ customField: 'custom value' });

            expect(model).toBeInstanceOf(AbstractModel);
            expect(model.customField).toBe('custom value');
        });

        it('should allow overriding afterValidation', () => {
            class ValidatedModel extends AbstractModel {
                @Expose()
                value: number;

                constructor(partial: Partial<ValidatedModel> = {}) {
                    super();
                    Object.assign(this, partial);
                }

                afterValidation(item: this): this {
                    if (item.value < 0) {
                        item.value = 0;
                    }
                    return item;
                }
            }

            const model = new ValidatedModel({ value: -5 });
            const result = model.afterValidation(model);

            expect(result.value).toBe(0);
        });
    });
});
