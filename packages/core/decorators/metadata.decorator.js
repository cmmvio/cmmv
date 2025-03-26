"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.SetMetadata = void 0;
const SetMetadata = (metadataKey, metadataValue) => {
    const decoratorFactory = (target, key, descriptor) => {
        if (descriptor) {
            Reflect.defineMetadata(metadataKey, metadataValue, descriptor.value);
            return descriptor;
        }
        Reflect.defineMetadata(metadataKey, metadataValue, target);
        return target;
    };
    decoratorFactory.KEY = metadataKey;
    return decoratorFactory;
};
exports.SetMetadata = SetMetadata;
