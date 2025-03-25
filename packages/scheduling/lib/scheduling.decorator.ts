import { Scope } from '@cmmv/core';

export const CRON_METADATA = Symbol('CRON_METADATA');

export function Cron(cronTime: string): MethodDecorator {
    return (
        target,
        propertyKey: string | symbol,
        descriptor: PropertyDescriptor,
    ) => {
        const method = descriptor.value;
        Reflect.defineMetadata(CRON_METADATA, cronTime, method);
        Scope.addToArray('__crons', { target, method, cronTime });
    };
}
