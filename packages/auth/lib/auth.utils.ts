import { promisify } from 'node:util';
import { URL } from 'node:url';
import * as crypto from 'crypto';
import * as jwt from 'jsonwebtoken';

import { Config } from '@cmmv/core';

import { IJWTDecoded } from './auth.interface';

/**
 * Verify a JWT token
 * @param token - The token
 * @returns The decoded token
 */
export async function jwtVerify(token: string): Promise<IJWTDecoded> {
    const jwtSecret = Config.get<string>('auth.jwtSecret');

    if (!jwtSecret) throw new Error('JWT secret is not configured');

    try {
        const decoded = await promisify(jwt.verify)(
            token.replace('Bearer ', ''),
            jwtSecret,
        );
        return decoded as IJWTDecoded;
    } catch {
        throw new Error('Invalid or expired token');
    }
}

/**
 * Encrypt a JWT data
 * @param text - The text
 * @param secret - The secret
 * @returns The encrypted data
 */
export function encryptJWTData(text: string, secret: string): string {
    try {
        const iv = crypto.randomBytes(12);
        const cipher = crypto.createCipheriv(
            'aes-256-gcm',
            crypto.createHash('sha256').update(secret).digest(),
            iv,
        );
        let encrypted = cipher.update(text, 'utf8', 'hex');
        encrypted += cipher.final('hex');
        const authTag = cipher.getAuthTag().toString('hex');
        return `${iv.toString('hex')}:${encrypted}:${authTag}`;
    } catch {
        return '';
    }
}

/**
 * Decrypt a JWT data
 * @param encryptedText - The encrypted text
 * @param secret - The secret
 * @returns The decrypted data
 */
export function decryptJWTData(encryptedText: string, secret: string) {
    try {
        const [iv, encrypted, authTag] = encryptedText
            .split(':')
            .map((part) => Buffer.from(part, 'hex'));
        const decipher = crypto.createDecipheriv(
            'aes-256-gcm',
            crypto.createHash('sha256').update(secret).digest(),
            iv,
        );
        decipher.setAuthTag(authTag);
        let decrypted = decipher.update(
            encrypted.toString('hex'),
            'hex',
            'utf8',
        );
        decrypted += decipher.final('utf8');
        return decrypted;
    } catch {
        return '';
    }
}

/**
 * Generate a fingerprint
 * @param req - The request
 * @param usernameHashed - The username hashed
 * @returns The fingerprint
 */
export function generateFingerprint(req, usernameHashed) {
    const userAgent = req.headers['user-agent'] || '';
    const ip =
        req.headers['cf-connecting-ip'] ||
        req.headers['X-Real-IP'] ||
        req.headers['X-Forwarded-For'] ||
        req.connection?.remoteAddress ||
        req.ip;
    const language = req.headers['accept-language'] || '';

    const rawFingerprint = `${userAgent}|${ip}|${language}|${usernameHashed}`;
    return crypto.createHash('sha256').update(rawFingerprint).digest('hex');
}
