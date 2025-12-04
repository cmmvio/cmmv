import { describe, it, expect, vi, beforeEach } from 'vitest';
import { IsString, IsNotEmpty, IsNumber, Min } from 'class-validator';
import 'reflect-metadata';
import { AbstractService } from '../../abstracts/services.abstract';

// Test service implementation
class TestService extends AbstractService {}

// Test DTO for validation
class TestDTO {
    @IsString()
    @IsNotEmpty()
    name: string;

    @IsNumber()
    @Min(0)
    value: number;

    afterValidation(item: this) {
        return item;
    }
}

// DTO without afterValidation
class SimpleDTO {
    @IsString()
    name: string;
}

describe('AbstractService', () => {
    let service: TestService;

    beforeEach(() => {
        service = new TestService();
    });

    describe('removeUndefined', () => {
        it('should remove undefined values from object', () => {
            const obj = {
                a: 'value',
                b: undefined,
                c: 123,
                d: undefined,
            };

            const result = service.removeUndefined(obj);

            expect(result).toEqual({
                a: 'value',
                c: 123,
            });
        });

        it('should keep null values', () => {
            const obj = {
                a: 'value',
                b: null,
                c: undefined,
            };

            const result = service.removeUndefined(obj);

            expect(result).toEqual({
                a: 'value',
                b: null,
            });
        });

        it('should keep falsy values except undefined', () => {
            const obj = {
                a: 0,
                b: '',
                c: false,
                d: undefined,
            };

            const result = service.removeUndefined(obj);

            expect(result).toEqual({
                a: 0,
                b: '',
                c: false,
            });
        });

        it('should return empty object when all values are undefined', () => {
            const obj = {
                a: undefined,
                b: undefined,
            };

            const result = service.removeUndefined(obj);

            expect(result).toEqual({});
        });

        it('should return same object when no undefined values', () => {
            const obj = {
                a: 'value',
                b: 123,
            };

            const result = service.removeUndefined(obj);

            expect(result).toEqual({
                a: 'value',
                b: 123,
            });
        });
    });

    describe('fixIds', () => {
        it('should convert _id to id', () => {
            const item = {
                _id: { toString: () => '123' },
                name: 'Test',
            };

            const result = service.fixIds(item);

            expect(result.id).toBe('123');
            expect(result._id).toBeUndefined();
        });

        it('should handle item without _id', () => {
            const item = {
                id: '456',
                name: 'Test',
            };

            const result = service.fixIds(item);

            expect(result.id).toBe('456');
        });

        it('should handle null item', () => {
            const result = service.fixIds(null);

            expect(result).toBeNull();
        });

        it('should handle nested objects', () => {
            const item = {
                _id: { toString: () => '123' },
                nested: {
                    _id: { toString: () => '456' },
                    value: 'nested value',
                },
            };

            const result = service.fixIds(item);

            expect(result.id).toBe('123');
            expect(result.nested.id).toBe('456');
        });

        it('should handle arrays', () => {
            const item = {
                _id: { toString: () => '123' },
                items: [
                    { _id: { toString: () => '1' }, name: 'First' },
                    { _id: { toString: () => '2' }, name: 'Second' },
                ],
            };

            const result = service.fixIds(item);

            expect(result.items[0].id).toBe('1');
            expect(result.items[1].id).toBe('2');
        });

        it('should convert userCreator to string', () => {
            const item = {
                _id: { toString: () => '123' },
                userCreator: { toString: () => 'user123' },
                nested: {
                    value: 'test',
                },
            };

            const result = service.fixIds(item);

            expect(result.userCreator).toBe('user123');
        });

        it('should convert userLastUpdate to string', () => {
            const item = {
                _id: { toString: () => '123' },
                userLastUpdate: { toString: () => 'user456' },
                nested: {
                    value: 'test',
                },
            };

            const result = service.fixIds(item);

            expect(result.userLastUpdate).toBe('user456');
        });
    });

    describe('appendUser', () => {
        it('should add userCreator to payload', () => {
            const payload = { name: 'Test' };
            const userId = 'user123';

            const result = service.appendUser(payload, userId);

            expect(result.userCreator).toBe('user123');
        });

        it('should overwrite existing userCreator', () => {
            const payload = { name: 'Test', userCreator: 'oldUser' };
            const userId = 'newUser';

            const result = service.appendUser(payload, userId);

            expect(result.userCreator).toBe('newUser');
        });

        it('should preserve other payload properties', () => {
            const payload = { name: 'Test', value: 123 };
            const userId = 'user123';

            const result = service.appendUser(payload, userId);

            expect(result.name).toBe('Test');
            expect(result.value).toBe(123);
            expect(result.userCreator).toBe('user123');
        });
    });

    describe('appendUpdateUser', () => {
        it('should add userLastUpdate to payload', () => {
            const payload = { name: 'Test' };
            const userId = 'user123';

            const result = service.appendUpdateUser(payload, userId);

            expect(result.userLastUpdate).toBe('user123');
        });

        it('should overwrite existing userLastUpdate', () => {
            const payload = { name: 'Test', userLastUpdate: 'oldUser' };
            const userId = 'newUser';

            const result = service.appendUpdateUser(payload, userId);

            expect(result.userLastUpdate).toBe('newUser');
        });

        it('should preserve other payload properties', () => {
            const payload = { name: 'Test', value: 123 };
            const userId = 'user123';

            const result = service.appendUpdateUser(payload, userId);

            expect(result.name).toBe('Test');
            expect(result.value).toBe(123);
            expect(result.userLastUpdate).toBe('user123');
        });
    });

    describe('validate', () => {
        it('should validate valid DTO', async () => {
            const dto = new TestDTO();
            dto.name = 'Valid Name';
            dto.value = 10;

            const result = await service.validate<TestDTO>(dto);

            expect(result.name).toBe('Valid Name');
            expect(result.value).toBe(10);
        });

        it('should throw error for invalid DTO', async () => {
            const dto = new TestDTO();
            dto.name = ''; // Invalid: empty string
            dto.value = 10;

            await expect(service.validate(dto)).rejects.toThrow();
        });

        it('should throw error for negative value', async () => {
            const dto = new TestDTO();
            dto.name = 'Valid';
            dto.value = -5; // Invalid: negative

            await expect(service.validate(dto)).rejects.toThrow();
        });

        it('should call afterValidation if exists', async () => {
            const dto = new TestDTO();
            dto.name = 'Test';
            dto.value = 5;
            dto.afterValidation = vi.fn().mockReturnValue(dto);

            await service.validate(dto);

            expect(dto.afterValidation).toHaveBeenCalled();
        });

        it('should work without afterValidation method', async () => {
            const dto = new SimpleDTO();
            dto.name = 'Test';

            const result = await service.validate<SimpleDTO>(dto);

            expect(result.name).toBe('Test');
        });

        it('should remove undefined values after validation', async () => {
            const dto = new TestDTO();
            dto.name = 'Test';
            dto.value = 10;
            (dto as any).undefinedField = undefined;

            const result = await service.validate<TestDTO>(dto);

            expect((result as any).undefinedField).toBeUndefined();
        });

        it('should skip missing properties in partial mode', async () => {
            const dto = new TestDTO();
            dto.name = 'Test';
            // value is not set (missing)

            const result = await service.validate<TestDTO>(dto, true);

            expect(result.name).toBe('Test');
        });
    });

    describe('name property', () => {
        it('should have optional name property for compatibility', () => {
            service.name = 'TestService';

            expect(service.name).toBe('TestService');
        });

        it('should be undefined by default', () => {
            expect(service.name).toBeUndefined();
        });
    });
});
