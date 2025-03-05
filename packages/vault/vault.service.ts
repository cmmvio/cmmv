import { v5 as uuidv5, v4 as uuidv4 } from 'uuid';
import { ec as EC } from 'elliptic';
const ec = new EC('secp256k1');

import { Service, AbstractService, Config, Logger, isJSON } from '@cmmv/core';

import { IInsertResponse, Repository } from '@cmmv/repository';

import { Encryptor } from '@cmmv/encryptor';
import { HttpCode, HttpException, HttpStatus } from '@cmmv/http';

@Service('vault')
export class VaultService extends AbstractService {
    private logger = new Logger('VaultService');

    async createKeys() {
        const recipientKeyPair = ec.genKeyPair();
        const recipientPrivateKey = recipientKeyPair.getPrivate('hex', false);
        const recipientPublicKey = recipientKeyPair.getPublic('hex', false);

        return {
            namespace: uuidv4(),
            privateKey: recipientPrivateKey,
            publicKey: recipientPublicKey,
        };
    }

    async insert(
        key: string,
        payload: string | object,
    ): Promise<IInsertResponse | null> {
        const VaultSecretEntity = Repository.getEntity('VaultEntity');
        const namespace = Config.get<string>('vault.namespace');
        const publicKey = Config.get<string>('vault.publicKey');

        if (!publicKey || (publicKey.length !== 130 && publicKey.length !== 66))
            throw new HttpException(
                'Invalid public key format: ' + publicKey,
                HttpStatus.FORBIDDEN,
            );

        const encryptedData =
            typeof payload === 'string'
                ? Encryptor.encryptPayload(publicKey, payload)
                : Encryptor.encryptPayload(publicKey, JSON.stringify(payload));

        const result = await Repository.insert(VaultSecretEntity, {
            key: uuidv5(key, namespace),
            payload: encryptedData.payload,
            iv: encryptedData.iv,
            tag: encryptedData.authTag,
            ephemeral: encryptedData.ephemeralPublicKey,
        });

        return result;
    }

    async get(key: string): Promise<string | object | null> {
        const VaultSecretEntity = Repository.getEntity('VaultEntity');
        const namespace = Config.get<string>('vault.namespace');
        const privateKey = Config.get<string>('vault.privateKey');
        const keyHash = uuidv5(key, namespace);

        if (!privateKey || privateKey.length !== 64)
            throw new HttpException(
                'Invalid private key format: ' + privateKey,
                HttpStatus.FORBIDDEN,
            );

        const registy = await Repository.findBy(VaultSecretEntity, {
            key: keyHash,
        });

        if (!registy)
            throw new HttpException(
                `Key '${key}' not exists`,
                HttpStatus.FORBIDDEN,
            );

        const decryptedPayload = Encryptor.decryptPayload(
            privateKey,
            {
                encrypted: registy.payload,
                iv: registy.iv,
                authTag: registy.tag,
            },
            registy.ephemeral,
        );

        return isJSON(decryptedPayload)
            ? JSON.parse(decryptedPayload)
            : decryptedPayload;
    }

    async remove(key: string): Promise<object> {
        const VaultSecretEntity = Repository.getEntity('VaultEntity');
        const namespace = Config.get<string>('vault.namespace');
        const keyHash = uuidv5(key, namespace);
        const affected = await Repository.delete(VaultSecretEntity, {
            key: keyHash,
        });

        if (affected <= 0)
            throw new HttpException(
                `Key '${key}' not exists`,
                HttpStatus.FORBIDDEN,
            );

        return { success: affected > 0 };
    }
}
