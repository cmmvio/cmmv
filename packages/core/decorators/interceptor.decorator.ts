import { Application } from '../application';

export function Interceptor(): MethodDecorator {
    return (
        target: any,
        propertyKey: string | symbol,
        descriptor: PropertyDescriptor,
    ) => {
        Application.setHTTPInterceptor(descriptor.value);
    };
}
