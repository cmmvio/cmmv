import { AbstractService } from '@cmmv/core';
import { ObjectId } from 'mongodb';

export abstract class AbstractRepositoryService extends AbstractService {
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
}
