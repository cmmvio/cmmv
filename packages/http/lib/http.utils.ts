import * as crypto from 'node:crypto';
import { URL } from 'node:url';

export function generateFingerprint(req, usernameHashed) {
    const userAgent = req.headers['user-agent'] || '';
    const ip =
        req.headers['cf-connecting-ip'] ||
        req.headers['X-Real-IP'] ||
        req.headers['X-Forwarded-For'] ||
        req.connection.remoteAddress ||
        req.ip;
    const language = req.headers['accept-language'] || '';
    const referer = req.headers['referer']
        ? new URL(req.headers['referer']).origin
        : '';

    const rawFingerprint = `${userAgent}|${ip}|${language}|${referer}|${usernameHashed}`;
    return crypto.createHash('sha256').update(rawFingerprint).digest('hex');
}
