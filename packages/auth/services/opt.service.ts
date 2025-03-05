import * as speakeasy from 'speakeasy';
import { QRCodeCanvas } from '@loskir/styled-qr-code-node';

import { Repository } from '@cmmv/repository';

import { Service, AbstractService, Config } from '@cmmv/core';

import { jwtVerify, decryptJWTData } from '../lib/auth.utils';

import { IJWTDecoded } from '../lib/auth.interface';
import { HttpCode, HttpException, HttpStatus } from '@cmmv/http';

@Service('opt')
export class AuthOptService extends AbstractService {
    public async generateOptSecret(token: string) {
        const UserEntity = Repository.getEntity('UserEntity');
        const decoded: IJWTDecoded = await jwtVerify(token);
        const jwtSecret = Config.get<string>('auth.jwtSecret');
        const issuer = Config.get('auth.optSecret.issuer', 'Cmmv');
        const algorithm = Config.get('auth.optSecret.algorithm', 'sha1');
        const qrCodeOptions = Config.get<object>('auth.qrCode', {});

        const account: any = await Repository.findBy(
            UserEntity,
            Repository.queryBuilder({
                id: decoded.id,
                optSecretVerify: true,
            }),
        );

        decoded.username = decryptJWTData(decoded.username, jwtSecret);

        if (account) throw new Error('The user already has an active OPT.');

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

        const result = await Repository.updateById(UserEntity, decoded.id, {
            optSecret: secret.base32,
            optSecretVerify: false,
        });

        if (!result) throw new Error('Unable to generate QR code');

        const qrCode = new QRCodeCanvas({
            ...defaultqrCodeOptions,
            data: otpUrl,
        });

        return qrCode.toDataUrl();
    }

    public async validateOptSecret(token: string, secret: string) {
        const UserEntity = Repository.getEntity('UserEntity');
        const algorithm = Config.get('auth.optSecret.algorithm', 'sha1');
        const decoded: IJWTDecoded = await jwtVerify(token);

        const account: any = await Repository.findBy(
            UserEntity,
            Repository.queryBuilder({
                id: decoded.id,
                optSecretVerify: true,
            }),
        );

        if (!account)
            throw new HttpException(
                'Invalid user or without active OPT.',
                HttpStatus.UNAUTHORIZED,
            );

        const verify = speakeasy.totp.verify({
            secret: account.optSecret,
            encoding: 'base32',
            token: secret,
            algorithm,
        });

        if (!verify) throw new Error('Invalid code');

        return { success: true };
    }

    public async updateOptSecret(token: string, secret: string) {
        const UserEntity = Repository.getEntity('UserEntity');
        const algorithm = Config.get('auth.optSecret.algorithm', 'sha1');
        const decoded: IJWTDecoded = await jwtVerify(token);

        const account: any = await Repository.findBy(
            UserEntity,
            Repository.queryBuilder({
                id: decoded.id,
                optSecretVerify: false,
            }),
        );

        if (!account)
            throw new HttpException(
                'Invalid user or without active OPT.',
                HttpStatus.UNAUTHORIZED,
            );

        const verify = speakeasy.totp.verify({
            secret: account.optSecret,
            encoding: 'base32',
            token: secret,
            algorithm,
        });

        if (!verify) throw new Error('Invalid code');

        const result = await Repository.updateById(UserEntity, decoded.id, {
            optSecretVerify: true,
        });

        if (!result) throw new Error('Unable to activate OPT');

        return { success: true };
    }

    public async removeOptSecret(token: string, secret: string) {
        const UserEntity = Repository.getEntity('UserEntity');
        const algorithm = Config.get('auth.optSecret.algorithm', 'sha1');
        const decoded: IJWTDecoded = await jwtVerify(token);

        const account: any = await Repository.findBy(
            UserEntity,
            Repository.queryBuilder({
                id: decoded.id,
                optSecretVerify: true,
            }),
        );

        if (!account)
            throw new HttpException(
                'Invalid user or without active OPT.',
                HttpStatus.UNAUTHORIZED,
            );

        const verify = speakeasy.totp.verify({
            secret: account.optSecret,
            encoding: 'base32',
            token: secret,
            algorithm,
        });

        if (!verify) throw new Error('Invalid code');

        const result = await Repository.updateById(UserEntity, decoded.id, {
            optSecretVerify: false,
        });

        if (!result) throw new Error('Unable to activate OPT');

        return { success: true };
    }
}
