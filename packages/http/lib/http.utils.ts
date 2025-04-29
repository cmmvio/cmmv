import * as crypto from 'node:crypto';

export function generateFingerprint(req, usernameHashed) {
    const userAgent = req.headers['user-agent'] || '';
    const ip =
        req.headers['cf-connecting-ip'] ||
        req.headers['X-Real-IP'] ||
        req.headers['X-Forwarded-For'] ||
        req.connection.remoteAddress ||
        req.ip;
    const language = req.headers['accept-language'] || '';

    const rawFingerprint = `${userAgent}|${ip}|${language}|${usernameHashed}`;
    return crypto.createHash('sha256').update(rawFingerprint).digest('hex');
}
