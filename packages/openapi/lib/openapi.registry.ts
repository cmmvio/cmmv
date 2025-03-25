import { GenericRegistry } from '@cmmv/core';

export class OpenAPIRegistry extends GenericRegistry {
    public static appendMetadataObject(
        target: any,
        key: string,
        object: object,
    ) {
        this.controllerMetadata(target, {
            [key]: object,
        });
    }
}
