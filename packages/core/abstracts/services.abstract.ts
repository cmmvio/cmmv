import { validate } from 'class-validator';

export abstract class AbstractService {
    name?: string; //compatibility

    removeUndefined(obj: any) {
        return Object.fromEntries(
            Object.entries(obj).filter(([_, value]) => value !== undefined),
        );
    }

    fixIds(item: any, subtree: boolean = false): any {
        if (item && typeof item === 'object') {
            if (item._id) {
                item.id = item._id.toString();
                delete item._id;
            }

            for (const key in item) {
                if (Array.isArray(item[key])) {
                    item[key] = item[key].map((element: any) =>
                        this.fixIds(element),
                    );
                } else if (typeof item[key] === 'object' && !subtree) {
                    item[key] = this.fixIds(item[key], true);

                    if (item.userCreator)
                        item.userCreator = item.userCreator.toString();

                    if (item.userLastUpdate)
                        item.userLastUpdate = item.userLastUpdate.toString();
                }
            }
        }

        return item;
    }

    appendUser(payload: any, userId: any) {
        payload.userCreator = userId;
        return payload;
    }

    appendUpdateUser(payload: any, userId: any) {
        payload.userLastUpdate = userId;
        return payload;
    }

    async validate<T>(item: any, partial: boolean = false): Promise<T> {
        const errors = await validate(item, {
            forbidUnknownValues: false,
            skipNullProperties: partial,
            skipMissingProperties: partial,
            stopAtFirstError: true,
        });

        if (errors.length > 0)
            throw new Error(Object.values(errors[0].constraints).join(', '));

        if (typeof item.afterValidation === 'function')
            item = item.afterValidation(item);

        item = this.removeUndefined(item);

        return item as T;
    }
}
