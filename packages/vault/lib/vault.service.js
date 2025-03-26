"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.VaultService = void 0;
const tslib_1 = require("tslib");
const uuid_1 = require("uuid");
const elliptic_1 = require("elliptic");
const ec = new elliptic_1.ec('secp256k1');
const core_1 = require("@cmmv/core");
const repository_1 = require("@cmmv/repository");
const encryptor_1 = require("@cmmv/encryptor");
const http_1 = require("@cmmv/http");
let VaultService = class VaultService extends core_1.AbstractService {
    async createKeys() {
        const recipientKeyPair = ec.genKeyPair();
        const recipientPrivateKey = recipientKeyPair.getPrivate('hex', false);
        const recipientPublicKey = recipientKeyPair.getPublic('hex', false);
        return {
            namespace: (0, uuid_1.v4)(),
            privateKey: recipientPrivateKey,
            publicKey: recipientPublicKey,
        };
    }
    async insert(key, payload) {
        const VaultSecretEntity = repository_1.Repository.getEntity('VaultEntity');
        const namespace = core_1.Config.get('vault.namespace');
        const publicKey = core_1.Config.get('vault.publicKey');
        if (!publicKey || (publicKey.length !== 130 && publicKey.length !== 66))
            throw new http_1.HttpException('Invalid public key format: ' + publicKey, http_1.HttpStatus.FORBIDDEN);
        const encryptedData = typeof payload === 'string'
            ? encryptor_1.Encryptor.encryptPayload(publicKey, payload)
            : encryptor_1.Encryptor.encryptPayload(publicKey, JSON.stringify(payload));
        const result = await repository_1.Repository.insert(VaultSecretEntity, {
            key: (0, uuid_1.v5)(key, namespace),
            payload: encryptedData.payload,
            iv: encryptedData.iv,
            tag: encryptedData.authTag,
            ephemeral: encryptedData.ephemeralPublicKey,
        });
        return result;
    }
    async get(key) {
        const VaultSecretEntity = repository_1.Repository.getEntity('VaultEntity');
        const namespace = core_1.Config.get('vault.namespace');
        const privateKey = core_1.Config.get('vault.privateKey');
        const keyHash = (0, uuid_1.v5)(key, namespace);
        if (!privateKey || privateKey.length !== 64)
            throw new http_1.HttpException('Invalid private key format: ' + privateKey, http_1.HttpStatus.FORBIDDEN);
        const registy = await repository_1.Repository.findBy(VaultSecretEntity, {
            key: keyHash,
        });
        if (!registy)
            throw new http_1.HttpException(`Key '${key}' not exists`, http_1.HttpStatus.FORBIDDEN);
        const decryptedPayload = encryptor_1.Encryptor.decryptPayload(privateKey, {
            encrypted: registy.payload,
            iv: registy.iv,
            authTag: registy.tag,
        }, registy.ephemeral);
        return (0, core_1.isJSON)(decryptedPayload)
            ? JSON.parse(decryptedPayload)
            : decryptedPayload;
    }
    async remove(key) {
        const VaultSecretEntity = repository_1.Repository.getEntity('VaultEntity');
        const namespace = core_1.Config.get('vault.namespace');
        const keyHash = (0, uuid_1.v5)(key, namespace);
        const affected = await repository_1.Repository.delete(VaultSecretEntity, {
            key: keyHash,
        });
        if (affected <= 0)
            throw new http_1.HttpException(`Key '${key}' not exists`, http_1.HttpStatus.FORBIDDEN);
        return { success: affected > 0 };
    }
};
exports.VaultService = VaultService;
exports.VaultService = VaultService = tslib_1.__decorate([
    (0, core_1.Service)('vault')
], VaultService);
