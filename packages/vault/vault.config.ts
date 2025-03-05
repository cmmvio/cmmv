import { ConfigSchema } from '@cmmv/core';

export const VaultConfig: ConfigSchema = {
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
