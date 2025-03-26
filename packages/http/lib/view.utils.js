"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.getValueFromKey = getValueFromKey;
function getValueFromKey(data, key) {
    return key.split('.').reduce((acc, part) => acc && acc[part], data);
}
