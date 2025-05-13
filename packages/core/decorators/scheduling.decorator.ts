import { Scope } from '../lib/scope';

export const CRON_METADATA = Symbol('CRON_METADATA');

export function Cron(cronTime: string): MethodDecorator {
    return (
        target,
        propertyKey: string | symbol,
        descriptor: PropertyDescriptor,
    ) => {
        const method = descriptor.value;
        Reflect.defineMetadata(CRON_METADATA, cronTime, method);

        const crons = Scope.getArray('__crons') || [];

        const existingCronIndex = crons.findIndex(
            (cron) => cron.target === target && cron.method === method,
        );

        if (existingCronIndex < 0)
            Scope.addToArray('__crons', { target, method, cronTime });
    };
}
