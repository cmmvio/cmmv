import { AbstractContract } from '@cmmv/core';
import { FormRegistry } from './form.registry';

export interface ElementOptions {
    type: ElementType;
    props?: ElementProps;
    placeholder?: string | number;
}

export interface ElementProps {
    [key: string]: any;
}

export interface FormOptions {
    contract: string;
    customPath?: string;
}

export enum ElementType {
    'Badge',
    'Button',
    'Flag',
    'Icon',
    'Loader',
    'ProgressBar',
    'ProgressCircular',
    'Alert',
    'Avatar',
    'Card',
    'Toolbar',
    'Autocomplete',
    'Checkbox',
    'Input',
    'OTP',
    'Radio',
    'Slider',
    'Textarea',
    'Toggle',
}

export interface ElementItem {
    propertyKey: string;
    options?: ElementOptions;
}

export const FORM_NAMESPACE = Symbol('form_namespace');
export const FORM_OPTIONS = Symbol('form_options');
export const FORM_ELEMENTS = Symbol('form_elements');

export function Form(namespace: string, options?: FormOptions): ClassDecorator {
    return (target: object) => {
        Reflect.defineMetadata(FORM_NAMESPACE, namespace, target);
        Reflect.defineMetadata(FORM_OPTIONS, options, target);
    };
}

export function FormElement(options?: ElementOptions): PropertyDecorator {
    return (target: object, propertyKey: string | symbol, context?: any) => {
        let elements: Set<ElementItem> = Reflect.getMetadata(
            FORM_ELEMENTS,
            target.constructor,
        );

        if (!elements || elements.size <= 0)
            elements = new Set<{ propertyKey }>();

        elements.add({
            propertyKey: propertyKey as string,
            options,
        });

        Reflect.defineMetadata(FORM_ELEMENTS, elements, target.constructor);
        FormRegistry.registerForm(target.constructor.name, target.constructor);
    };
}
