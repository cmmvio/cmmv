import { EventsRegistry } from '../registries/events.registry';

export function OnEvent(message: string): MethodDecorator {
    return function (
        target: any,
        propertyKey: string | symbol,
        descriptor: PropertyDescriptor,
    ) {
        const originalMethod = descriptor.value;

        if (typeof originalMethod !== 'function')
            throw new Error(`@Hook can only be used on methods.`);

        EventsRegistry.registerHandler(
            message,
            propertyKey.toString(),
            descriptor.value,
        );
    };
}
