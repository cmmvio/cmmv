"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.AuthOptService = void 0;
const tslib_1 = require("tslib");
const speakeasy = require("speakeasy");
const styled_qr_code_node_1 = require("@loskir/styled-qr-code-node");
const repository_1 = require("@cmmv/repository");
const core_1 = require("@cmmv/core");
const auth_utils_1 = require("../lib/auth.utils");
const http_1 = require("@cmmv/http");
let AuthOptService = class AuthOptService extends core_1.AbstractService {
    async generateOptSecret(token) {
        const UserEntity = repository_1.Repository.getEntity('UserEntity');
        const decoded = await (0, auth_utils_1.jwtVerify)(token);
        const jwtSecret = core_1.Config.get('auth.jwtSecret');
        const issuer = core_1.Config.get('auth.optSecret.issuer', 'Cmmv');
        const algorithm = core_1.Config.get('auth.optSecret.algorithm', 'sha1');
        const qrCodeOptions = core_1.Config.get('auth.qrCode', {});
        const account = await repository_1.Repository.findBy(UserEntity, repository_1.Repository.queryBuilder({
            id: decoded.id,
            optSecretVerify: true,
        }));
        decoded.username = (0, auth_utils_1.decryptJWTData)(decoded.username, jwtSecret);
        if (account)
            throw new Error('The user already has an active OPT.');
        const defaultqrCodeOptions = {
            type: 'canvas',
            shape: 'square',
            width: 300,
            height: 300,
            margin: 0,
            ...qrCodeOptions,
        };
        const secret = speakeasy.generateSecret({
            name: issuer,
        });
        const otpUrl = speakeasy.otpauthURL({
            secret: secret.base32,
            label: decoded.username || 'User',
            encoding: 'base32',
            issuer,
            algorithm,
        });
        const result = await repository_1.Repository.updateById(UserEntity, decoded.id, {
            optSecret: secret.base32,
            optSecretVerify: false,
        });
        if (!result)
            throw new Error('Unable to generate QR code');
        const qrCode = new styled_qr_code_node_1.QRCodeCanvas({
            ...defaultqrCodeOptions,
            data: otpUrl,
        });
        return qrCode.toDataUrl();
    }
    async validateOptSecret(token, secret) {
        const UserEntity = repository_1.Repository.getEntity('UserEntity');
        const algorithm = core_1.Config.get('auth.optSecret.algorithm', 'sha1');
        const decoded = await (0, auth_utils_1.jwtVerify)(token);
        const account = await repository_1.Repository.findBy(UserEntity, repository_1.Repository.queryBuilder({
            id: decoded.id,
            optSecretVerify: true,
        }));
        if (!account)
            throw new http_1.HttpException('Invalid user or without active OPT.', http_1.HttpStatus.UNAUTHORIZED);
        const verify = speakeasy.totp.verify({
            secret: account.optSecret,
            encoding: 'base32',
            token: secret,
            algorithm,
        });
        if (!verify)
            throw new Error('Invalid code');
        return { success: true };
    }
    async updateOptSecret(token, secret) {
        const UserEntity = repository_1.Repository.getEntity('UserEntity');
        const algorithm = core_1.Config.get('auth.optSecret.algorithm', 'sha1');
        const decoded = await (0, auth_utils_1.jwtVerify)(token);
        const account = await repository_1.Repository.findBy(UserEntity, repository_1.Repository.queryBuilder({
            id: decoded.id,
            optSecretVerify: false,
        }));
        if (!account)
            throw new http_1.HttpException('Invalid user or without active OPT.', http_1.HttpStatus.UNAUTHORIZED);
        const verify = speakeasy.totp.verify({
            secret: account.optSecret,
            encoding: 'base32',
            token: secret,
            algorithm,
        });
        if (!verify)
            throw new Error('Invalid code');
        const result = await repository_1.Repository.updateById(UserEntity, decoded.id, {
            optSecretVerify: true,
        });
        if (!result)
            throw new Error('Unable to activate OPT');
        return { success: true };
    }
    async removeOptSecret(token, secret) {
        const UserEntity = repository_1.Repository.getEntity('UserEntity');
        const algorithm = core_1.Config.get('auth.optSecret.algorithm', 'sha1');
        const decoded = await (0, auth_utils_1.jwtVerify)(token);
        const account = await repository_1.Repository.findBy(UserEntity, repository_1.Repository.queryBuilder({
            id: decoded.id,
            optSecretVerify: true,
        }));
        if (!account)
            throw new http_1.HttpException('Invalid user or without active OPT.', http_1.HttpStatus.UNAUTHORIZED);
        const verify = speakeasy.totp.verify({
            secret: account.optSecret,
            encoding: 'base32',
            token: secret,
            algorithm,
        });
        if (!verify)
            throw new Error('Invalid code');
        const result = await repository_1.Repository.updateById(UserEntity, decoded.id, {
            optSecretVerify: false,
        });
        if (!result)
            throw new Error('Unable to activate OPT');
        return { success: true };
    }
};
exports.AuthOptService = AuthOptService;
exports.AuthOptService = AuthOptService = tslib_1.__decorate([
    (0, core_1.Service)('auth_opt')
], AuthOptService);
