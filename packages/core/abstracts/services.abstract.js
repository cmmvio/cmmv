"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.AbstractService = void 0;
const class_validator_1 = require("class-validator");
class AbstractService {
    removeUndefined(obj) {
        return Object.fromEntries(Object.entries(obj).filter(([_, value]) => value !== undefined));
    }
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
                else if (typeof item[key] === 'object' && !subtree) {
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
    appendUser(payload, userId) {
        payload.userCreator = userId;
        return payload;
    }
    appendUpdateUser(payload, userId) {
        payload.userLastUpdate = userId;
        return payload;
    }
    async validate(item, partial = false) {
        const errors = await (0, class_validator_1.validate)(item, {
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
        return item;
    }
}
exports.AbstractService = AbstractService;
