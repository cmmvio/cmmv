"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.IsStrongPassword = IsStrongPassword;
const class_validator_1 = require("class-validator");
const config_1 = require("../lib/config");
function IsStrongPassword(validationOptions) {
    return function (object, propertyName) {
        (0, class_validator_1.registerDecorator)({
            name: 'isStrongPassword',
            target: object.constructor,
            propertyName: propertyName,
            options: validationOptions,
            validator: {
                validate(value, args) {
                    if (typeof value !== 'string')
                        return false;
                    const requireUpperCase = config_1.Config.get('password.requireUpperCase', true);
                    const requireLowerCase = config_1.Config.get('password.requireLowerCase', true);
                    const requireNumber = config_1.Config.get('password.requireNumber', true);
                    const requireSpecialChar = config_1.Config.get('password.requireSpecialChar', true);
                    const minLength = config_1.Config.get('password.minLength', 8);
                    const hasUpperCase = requireUpperCase
                        ? /[A-Z].*/.test(value)
                        : true;
                    const hasLowerCase = requireLowerCase
                        ? /[a-z]/.test(value)
                        : true;
                    const hasNumber = requireNumber ? /\d/.test(value) : true;
                    const hasSpecialChar = requireSpecialChar
                        ? /[!@#$%^&*(),.?":{}|<>]/.test(value)
                        : true;
                    const hasMinLength = value.length >= minLength;
                    return (hasUpperCase &&
                        hasLowerCase &&
                        hasNumber &&
                        hasSpecialChar &&
                        hasMinLength);
                },
                defaultMessage(args) {
                    return 'Password must be at least 8 characters long, include uppercase, lowercase, numbers, and special characters.';
                },
            },
        });
    };
}
