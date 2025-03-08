//@see https://github.com/nestjs/swagger/blob/master/lib/decorators/helpers.ts

export function MixedDecorator<T = any>(
    metakey: string,
    metadata: T,
): MethodDecorator & ClassDecorator {
    return (
        target: object,
        key?: string | symbol,
        descriptor?: TypedPropertyDescriptor<any>,
    ): any => {
        if (descriptor) {
            let metadatas: any;

            if (Array.isArray(metadata)) {
                const previousMetadata =
                    Reflect.getMetadata(metakey, descriptor.value) || [];
                metadatas = [...previousMetadata, ...metadata];
            } else {
                const previousMetadata =
                    Reflect.getMetadata(metakey, descriptor.value) || {};
                metadatas = { ...previousMetadata, ...metadata };
            }

            Reflect.defineMetadata(metakey, metadatas, descriptor.value);
            return descriptor;
        }

        let metadatas: any;

        if (Array.isArray(metadata)) {
            const previousMetadata = Reflect.getMetadata(metakey, target) || [];
            metadatas = [...previousMetadata, ...metadata];
        } else {
            const previousMetadata = Reflect.getMetadata(metakey, target) || {};
            metadatas = Object.assign(
                Object.assign({}, previousMetadata),
                metadata,
            );
        }

        Reflect.defineMetadata(metakey, metadatas, target);
        return target;
    };
}
