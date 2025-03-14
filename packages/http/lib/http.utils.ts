import * as crypto from 'node:crypto';
import { URL } from 'node:url';

export function generateFingerprint(req, usernameHashed) {
    const userAgent = req.headers['user-agent'] || '';
    const ip = req.ip || req.connection?.remoteAddress || '';
    const language = req.headers['accept-language'] || '';
    const referer = req.headers['referer']
        ? new URL(req.headers['referer']).origin
        : '';

    const rawFingerprint = `${userAgent}|${ip}|${language}|${referer}|${usernameHashed}`;
    return crypto.createHash('sha256').update(rawFingerprint).digest('hex');
}
