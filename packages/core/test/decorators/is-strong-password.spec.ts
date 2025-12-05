import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import 'reflect-metadata';

// Mock class-validator
vi.mock('class-validator', () => ({
    registerDecorator: vi.fn(),
    ValidationArguments: {},
    ValidationOptions: {},
}));

// Mock Config
vi.mock('../../lib/config', () => ({
    Config: {
        get: vi.fn((key: string, defaultValue: any) => {
            const configMap: Record<string, any> = {
                'password.requireUpperCase': true,
                'password.requireLowerCase': true,
                'password.requireNumber': true,
                'password.requireSpecialChar': true,
                'password.minLength': 8,
            };
            return configMap[key] ?? defaultValue;
        }),
    },
}));

import { IsStrongPassword } from '../../decorators/is-strong-password.decorator';
import { Config } from '../../lib/config';
import { registerDecorator } from 'class-validator';

describe('IsStrongPassword Decorator', () => {
    let validatorFn: (value: any, args: any) => boolean;
    let defaultMessageFn: (args: any) => string;

    beforeEach(() => {
        vi.clearAllMocks();

        // Capture the validator when registerDecorator is called
        vi.mocked(registerDecorator).mockImplementation((options: any) => {
            validatorFn = options.validator.validate;
            defaultMessageFn = options.validator.defaultMessage;
        });
    });

    afterEach(() => {
        vi.clearAllMocks();
    });

    describe('decorator registration', () => {
        it('should call registerDecorator', () => {
            class TestClass {
                @IsStrongPassword()
                password: string;
            }

            expect(registerDecorator).toHaveBeenCalled();
        });

        it('should register with correct name', () => {
            class TestClass {
                @IsStrongPassword()
                password: string;
            }

            expect(registerDecorator).toHaveBeenCalledWith(
                expect.objectContaining({
                    name: 'isStrongPassword',
                }),
            );
        });

        it('should register with correct target', () => {
            class TestClass {
                @IsStrongPassword()
                password: string;
            }

            expect(registerDecorator).toHaveBeenCalledWith(
                expect.objectContaining({
                    target: TestClass,
                }),
            );
        });

        it('should register with correct property name', () => {
            class TestClass {
                @IsStrongPassword()
                password: string;
            }

            expect(registerDecorator).toHaveBeenCalledWith(
                expect.objectContaining({
                    propertyName: 'password',
                }),
            );
        });

        it('should pass validation options', () => {
            const options = { message: 'Custom message' };

            class TestClass {
                @IsStrongPassword(options)
                password: string;
            }

            expect(registerDecorator).toHaveBeenCalledWith(
                expect.objectContaining({
                    options: options,
                }),
            );
        });
    });

    describe('validator function', () => {
        beforeEach(() => {
            class TestClass {
                @IsStrongPassword()
                password: string;
            }
        });

        describe('with all requirements enabled', () => {
            it('should return true for valid strong password', () => {
                const result = validatorFn('StrongPass1!', {});

                expect(result).toBe(true);
            });

            it('should return false for password without uppercase', () => {
                const result = validatorFn('weakpass1!', {});

                expect(result).toBe(false);
            });

            it('should return false for password without lowercase', () => {
                const result = validatorFn('WEAKPASS1!', {});

                expect(result).toBe(false);
            });

            it('should return false for password without number', () => {
                const result = validatorFn('WeakPass!!', {});

                expect(result).toBe(false);
            });

            it('should return false for password without special char', () => {
                const result = validatorFn('WeakPass12', {});

                expect(result).toBe(false);
            });

            it('should return false for password too short', () => {
                const result = validatorFn('Wp1!', {});

                expect(result).toBe(false);
            });

            it('should return false for non-string value', () => {
                expect(validatorFn(12345, {})).toBe(false);
                expect(validatorFn(null, {})).toBe(false);
                expect(validatorFn(undefined, {})).toBe(false);
                expect(validatorFn({}, {})).toBe(false);
                expect(validatorFn([], {})).toBe(false);
            });
        });

        describe('special characters', () => {
            it('should accept ! as special character', () => {
                const result = validatorFn('StrongPass1!', {});
                expect(result).toBe(true);
            });

            it('should accept @ as special character', () => {
                const result = validatorFn('StrongPass1@', {});
                expect(result).toBe(true);
            });

            it('should accept # as special character', () => {
                const result = validatorFn('StrongPass1#', {});
                expect(result).toBe(true);
            });

            it('should accept $ as special character', () => {
                const result = validatorFn('StrongPass1$', {});
                expect(result).toBe(true);
            });

            it('should accept % as special character', () => {
                const result = validatorFn('StrongPass1%', {});
                expect(result).toBe(true);
            });

            it('should accept ^ as special character', () => {
                const result = validatorFn('StrongPass1^', {});
                expect(result).toBe(true);
            });

            it('should accept & as special character', () => {
                const result = validatorFn('StrongPass1&', {});
                expect(result).toBe(true);
            });

            it('should accept * as special character', () => {
                const result = validatorFn('StrongPass1*', {});
                expect(result).toBe(true);
            });

            it('should accept ( and ) as special characters', () => {
                const result = validatorFn('StrongPass1()', {});
                expect(result).toBe(true);
            });

            it('should accept , as special character', () => {
                const result = validatorFn('StrongPass1,', {});
                expect(result).toBe(true);
            });

            it('should accept . as special character', () => {
                const result = validatorFn('StrongPass1.', {});
                expect(result).toBe(true);
            });

            it('should accept ? as special character', () => {
                const result = validatorFn('StrongPass1?', {});
                expect(result).toBe(true);
            });

            it('should accept " as special character', () => {
                const result = validatorFn('StrongPass1"', {});
                expect(result).toBe(true);
            });

            it('should accept : as special character', () => {
                const result = validatorFn('StrongPass1:', {});
                expect(result).toBe(true);
            });

            it('should accept { and } as special characters', () => {
                const result = validatorFn('StrongPass1{}', {});
                expect(result).toBe(true);
            });

            it('should accept | as special character', () => {
                const result = validatorFn('StrongPass1|', {});
                expect(result).toBe(true);
            });

            it('should accept < and > as special characters', () => {
                const result = validatorFn('StrongPass1<>', {});
                expect(result).toBe(true);
            });
        });

        describe('password length', () => {
            it('should reject password with 7 characters', () => {
                const result = validatorFn('Pass1!a', {});
                expect(result).toBe(false);
            });

            it('should accept password with exactly 8 characters', () => {
                const result = validatorFn('Pass1!ab', {});
                expect(result).toBe(true);
            });

            it('should accept password with more than 8 characters', () => {
                const result = validatorFn('VeryLongStrongPassword123!', {});
                expect(result).toBe(true);
            });
        });
    });

    describe('default message', () => {
        beforeEach(() => {
            class TestClass {
                @IsStrongPassword()
                password: string;
            }
        });

        it('should return appropriate default message', () => {
            const message = defaultMessageFn({});

            expect(message).toContain('8 characters');
            expect(message).toContain('uppercase');
            expect(message).toContain('lowercase');
            expect(message).toContain('numbers');
            expect(message).toContain('special characters');
        });
    });

    describe('configurable requirements', () => {
        it('should skip uppercase check when disabled', () => {
            vi.mocked(Config.get).mockImplementation(
                (key: string, defaultValue: any) => {
                    if (key === 'password.requireUpperCase') return false;
                    if (key === 'password.requireLowerCase') return true;
                    if (key === 'password.requireNumber') return true;
                    if (key === 'password.requireSpecialChar') return true;
                    if (key === 'password.minLength') return 8;
                    return defaultValue;
                },
            );

            class TestClass {
                @IsStrongPassword()
                password: string;
            }

            // Lowercase only should pass when uppercase is not required
            const result = validatorFn('lowercase1!', {});
            expect(result).toBe(true);
        });

        it('should skip lowercase check when disabled', () => {
            vi.mocked(Config.get).mockImplementation(
                (key: string, defaultValue: any) => {
                    if (key === 'password.requireUpperCase') return true;
                    if (key === 'password.requireLowerCase') return false;
                    if (key === 'password.requireNumber') return true;
                    if (key === 'password.requireSpecialChar') return true;
                    if (key === 'password.minLength') return 8;
                    return defaultValue;
                },
            );

            class TestClass {
                @IsStrongPassword()
                password: string;
            }

            // Uppercase only should pass when lowercase is not required
            const result = validatorFn('UPPERCASE1!', {});
            expect(result).toBe(true);
        });

        it('should skip number check when disabled', () => {
            vi.mocked(Config.get).mockImplementation(
                (key: string, defaultValue: any) => {
                    if (key === 'password.requireUpperCase') return true;
                    if (key === 'password.requireLowerCase') return true;
                    if (key === 'password.requireNumber') return false;
                    if (key === 'password.requireSpecialChar') return true;
                    if (key === 'password.minLength') return 8;
                    return defaultValue;
                },
            );

            class TestClass {
                @IsStrongPassword()
                password: string;
            }

            const result = validatorFn('Password!', {});
            expect(result).toBe(true);
        });

        it('should skip special char check when disabled', () => {
            vi.mocked(Config.get).mockImplementation(
                (key: string, defaultValue: any) => {
                    if (key === 'password.requireUpperCase') return true;
                    if (key === 'password.requireLowerCase') return true;
                    if (key === 'password.requireNumber') return true;
                    if (key === 'password.requireSpecialChar') return false;
                    if (key === 'password.minLength') return 8;
                    return defaultValue;
                },
            );

            class TestClass {
                @IsStrongPassword()
                password: string;
            }

            const result = validatorFn('Password1', {});
            expect(result).toBe(true);
        });

        it('should use custom min length', () => {
            vi.mocked(Config.get).mockImplementation(
                (key: string, defaultValue: any) => {
                    if (key === 'password.requireUpperCase') return true;
                    if (key === 'password.requireLowerCase') return true;
                    if (key === 'password.requireNumber') return true;
                    if (key === 'password.requireSpecialChar') return true;
                    if (key === 'password.minLength') return 12;
                    return defaultValue;
                },
            );

            class TestClass {
                @IsStrongPassword()
                password: string;
            }

            // 8 chars should now fail with min 12
            const result = validatorFn('Pass12!a', {});
            expect(result).toBe(false);

            // 12 chars should pass
            const result2 = validatorFn('Password12!a', {});
            expect(result2).toBe(true);
        });
    });

    describe('edge cases', () => {
        beforeEach(() => {
            vi.mocked(Config.get).mockImplementation(
                (key: string, defaultValue: any) => {
                    if (key === 'password.requireUpperCase') return true;
                    if (key === 'password.requireLowerCase') return true;
                    if (key === 'password.requireNumber') return true;
                    if (key === 'password.requireSpecialChar') return true;
                    if (key === 'password.minLength') return 8;
                    return defaultValue;
                },
            );

            class TestClass {
                @IsStrongPassword()
                password: string;
            }
        });

        it('should handle empty string', () => {
            const result = validatorFn('', {});
            expect(result).toBe(false);
        });

        it('should handle whitespace-only string', () => {
            const result = validatorFn('        ', {});
            expect(result).toBe(false);
        });

        it('should handle unicode characters', () => {
            const result = validatorFn('Pässword1!', {});
            expect(result).toBe(true);
        });

        it('should handle very long passwords', () => {
            const longPassword = 'A'.repeat(50) + 'a'.repeat(50) + '1!';
            const result = validatorFn(longPassword, {});
            expect(result).toBe(true);
        });
    });
});
