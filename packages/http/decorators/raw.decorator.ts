/**
 * Mark the method as raw
 * @returns The raw decorator
 */
export function Raw(): MethodDecorator {
    return (target, propertyKey: string | symbol, descriptor: any) => {
        Reflect.defineMetadata('raw', true, descriptor.value);
    };
}
