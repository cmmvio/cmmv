"use strict";
//@see https://github.com/nestjs/swagger/blob/master/lib/decorators/helpers.ts
Object.defineProperty(exports, "__esModule", { value: true });
exports.MixedDecorator = MixedDecorator;
function MixedDecorator(metakey, metadata) {
    return (target, key, descriptor) => {
        if (descriptor) {
            let metadatas;
            if (Array.isArray(metadata)) {
                const previousMetadata = Reflect.getMetadata(metakey, descriptor.value) || [];
                metadatas = [...previousMetadata, ...metadata];
            }
            else {
                const previousMetadata = Reflect.getMetadata(metakey, descriptor.value) || {};
                metadatas = { ...previousMetadata, ...metadata };
            }
            Reflect.defineMetadata(metakey, metadatas, descriptor.value);
            return descriptor;
        }
        let metadatas;
        if (Array.isArray(metadata)) {
            const previousMetadata = Reflect.getMetadata(metakey, target) || [];
            metadatas = [...previousMetadata, ...metadata];
        }
        else {
            const previousMetadata = Reflect.getMetadata(metakey, target) || {};
            metadatas = Object.assign(Object.assign({}, previousMetadata), metadata);
        }
        Reflect.defineMetadata(metakey, metadatas, target);
        return target;
    };
}
