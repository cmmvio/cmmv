"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.VaultConfig = void 0;
exports.VaultConfig = {
    vault: {
        namespace: {
            required: true,
            type: 'string',
        },
        publicKey: {
            required: false,
            type: 'string',
        },
        privateKey: {
            required: false,
            type: 'string',
        },
    },
};
