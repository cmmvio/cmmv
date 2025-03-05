import { AbstractService, Config } from '@cmmv/core';
import { RepositorySchema } from './repository.service';

import { ObjectId } from 'mongodb';

export abstract class AbstractRepositoryService extends AbstractService {
    protected schema: RepositorySchema<any, any>;

    override fixIds(item: any, subtree: boolean = false) {
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
                } else if (item[key] instanceof ObjectId) {
                    item[key] = item[key].toString();
                } else if (typeof item[key] === 'object' && !subtree) {
                    item[key] = this.fixIds(item[key], true);
                }
            }
        }

        return item;
    }

    protected fromPartial<T>(model: any, data: any, req: any): T {
        if (model && model.fromPartial)
            return model?.fromPartial(this.extraData(data, req));
        else return data;
    }

    protected toModel(model: any, data: any) {
        const dataFixed =
            Config.get('repository.type') === 'mongodb'
                ? this.fixIds(data)
                : data;

        return model && model.fromEntity
            ? model.fromEntity(dataFixed)
            : dataFixed;
    }

    protected extraData(newItem: any, req: any) {
        const userId: string = req?.user?.id;

        if (typeof userId === 'string') {
            try {
                newItem.userCreator =
                    Config.get('repository.type') === 'mongodb'
                        ? new ObjectId(userId)
                        : userId;
            } catch (error) {
                console.warn('Error assigning userCreator:', error);
            }
        }

        return newItem;
    }
}
