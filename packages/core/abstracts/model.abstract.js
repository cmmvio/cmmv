"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.AbstractModel = void 0;
const class_transformer_1 = require("class-transformer");
class AbstractModel {
    serialize() {
        return (0, class_transformer_1.instanceToPlain)(this);
    }
    static sanitizeEntity(ModelClass, entity) {
        const modelInstance = new ModelClass({});
        const modelKeys = Object.keys(modelInstance);
        const sanitizedData = Object.keys(entity)
            .filter((key) => modelKeys.includes(key))
            .reduce((obj, key) => {
            obj[key] = entity[key];
            return obj;
        }, {});
        return (0, class_transformer_1.plainToInstance)(ModelClass, sanitizedData, {
            exposeUnsetFields: false,
            enableImplicitConversion: true,
            excludeExtraneousValues: true,
        });
    }
    static fromEntity(entity) { }
    static fromEntities(entities) {
        return entities.map((item) => this.fromEntity(item));
    }
    afterValidation(item) {
        return item;
    }
}
exports.AbstractModel = AbstractModel;
