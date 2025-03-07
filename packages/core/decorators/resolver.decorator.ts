import { Resolvers } from '../lib/resolvers';

export function Resolver(namespace: string) {
    return function (
        target: any,
        propertyKey: string,
        descriptor: PropertyDescriptor,
    ) {
        const originalMethod = descriptor.value;

        if (typeof originalMethod !== 'function')
            throw new Error(`@Resolver can only be used on methods.`);

        Resolvers.add(namespace, async (...args: any[]) => {
            return await originalMethod.apply(target, args);
        });
    };
}
