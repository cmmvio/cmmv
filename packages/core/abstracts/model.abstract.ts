import { plainToInstance, instanceToPlain } from 'class-transformer';

export class AbstractModel {
    public serialize() {
        return instanceToPlain(this);
    }

    public static sanitizeEntity<T>(
        ModelClass: new (partial: Partial<any>) => T,
        entity: any,
    ): T {
        const modelInstance = new ModelClass({});
        const modelKeys = Object.keys(modelInstance);

        const sanitizedData = Object.keys(entity)
            .filter((key) => modelKeys.includes(key))
            .reduce(
                (obj, key) => {
                    obj[key] = entity[key];
                    return obj;
                },
                {} as Record<string, any>,
            );

        return plainToInstance(ModelClass, sanitizedData, {
            exposeUnsetFields: false,
            enableImplicitConversion: true,
            excludeExtraneousValues: true,
        });
    }

    public static fromEntity(entity: any): any {}

    public static fromEntities(entities: Array<any>): Array<any> {
        return entities.map((item) => this.fromEntity(item));
    }
}
