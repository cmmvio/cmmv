import {
    registerDecorator,
    ValidationArguments,
    ValidationOptions,
} from 'class-validator';

import { Config } from '../lib/config';

export function IsStrongPassword(validationOptions?: ValidationOptions) {
    return function (object: Object, propertyName: string) {
        registerDecorator({
            name: 'isStrongPassword',
            target: object.constructor,
            propertyName: propertyName,
            options: validationOptions,
            validator: {
                validate(value: any, args: ValidationArguments) {
                    if (typeof value !== 'string') return false;

                    const requireUpperCase = Config.get<boolean>(
                        'password.requireUpperCase',
                        true,
                    );
                    const requireLowerCase = Config.get<boolean>(
                        'password.requireLowerCase',
                        true,
                    );
                    const requireNumber = Config.get<boolean>(
                        'password.requireNumber',
                        true,
                    );
                    const requireSpecialChar = Config.get<boolean>(
                        'password.requireSpecialChar',
                        true,
                    );
                    const minLength = Config.get<number>(
                        'password.minLength',
                        8,
                    );

                    const hasUpperCase = requireUpperCase
                        ? /[A-Z]/.test(value)
                        : true;
                    const hasLowerCase = requireLowerCase
                        ? /[a-z]/.test(value)
                        : true;
                    const hasNumber = requireNumber
                        ? /[0-9]/.test(value)
                        : true;
                    const hasSpecialChar = requireSpecialChar
                        ? /[!@#$%^&*(),.?":{}|<>]/.test(value)
                        : true;
                    const hasMinLength = value.length >= minLength;

                    return (
                        hasUpperCase &&
                        hasLowerCase &&
                        hasNumber &&
                        hasSpecialChar &&
                        hasMinLength
                    );
                },
                defaultMessage(args: ValidationArguments) {
                    return 'Password must be at least 8 characters long, include uppercase, lowercase, numbers, and special characters.';
                },
            },
        });
    };
}
