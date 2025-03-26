"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.AbstractRepositoryService = void 0;
const core_1 = require("@cmmv/core");
const mongodb_1 = require("mongodb");
class AbstractRepositoryService extends core_1.AbstractService {
    /**
     * Fix the IDs for the repository
     * @param item - The item to fix the IDs for
     * @param subtree - Whether to fix the IDs for the subtree
     * @returns The item with the fixed IDs
     */
    fixIds(item, subtree = false) {
        if (item && typeof item === 'object') {
            if (item._id) {
                item.id = item._id.toString();
                delete item._id;
            }
            for (const key in item) {
                if (Array.isArray(item[key])) {
                    item[key] = item[key].map((element) => this.fixIds(element));
                }
                else if (item[key] instanceof mongodb_1.ObjectId) {
                    item[key] = item[key].toString();
                }
                else if (typeof item[key] === 'object' && !subtree) {
                    item[key] = this.fixIds(item[key], true);
                }
            }
        }
        return item;
    }
    /**
     * Convert a partial model to a model
     * @param model - The model to convert
     * @param data - The data to convert
     * @param req - The request object
     * @returns The converted model
     */
    fromPartial(model, data, req) {
        if (model && model.fromPartial)
            return model?.fromPartial(this.extraData(data, req));
        else
            return data;
    }
    /**
     * Convert a data to a model
     * @param model - The model to convert
     * @param data - The data to convert
     * @returns The converted model
     */
    toModel(model, data) {
        const dataFixed = core_1.Config.get('repository.type') === 'mongodb'
            ? this.fixIds(data)
            : data;
        return model && model.fromEntity
            ? model.fromEntity(dataFixed)
            : dataFixed;
    }
    /**
     * Extra the data
     * @param newItem - The new item
     * @param req - The request object
     * @returns The extra data
     */
    extraData(newItem, req) {
        const userId = req?.user?.id;
        if (typeof userId === 'string') {
            try {
                newItem.userCreator =
                    core_1.Config.get('repository.type') === 'mongodb'
                        ? new mongodb_1.ObjectId(userId)
                        : userId;
            }
            catch (error) {
                console.warn('Error assigning userCreator:', error);
            }
        }
        return newItem;
    }
}
exports.AbstractRepositoryService = AbstractRepositoryService;
