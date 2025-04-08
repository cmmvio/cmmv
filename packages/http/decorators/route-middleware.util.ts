export function createRouteMiddleware(middleware: any, descriptor: any) {
    const existingFields =
        Reflect.getMetadata('route_metadata', descriptor.value) || {};

    const newField = existingFields?.middleware
        ? { middleware: [...existingFields?.middleware, middleware] }
        : { middleware: [middleware] };

    Reflect.defineMetadata(
        'route_metadata',
        { ...existingFields, ...newField },
        descriptor.value,
    );
}
