"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.jwtVerify = jwtVerify;
exports.encryptJWTData = encryptJWTData;
exports.decryptJWTData = decryptJWTData;
exports.generateFingerprint = generateFingerprint;
const node_util_1 = require("node:util");
const node_url_1 = require("node:url");
const crypto = require("crypto");
const jwt = require("jsonwebtoken");
const core_1 = require("@cmmv/core");
async function jwtVerify(token) {
    const jwtSecret = core_1.Config.get('auth.jwtSecret');
    if (!jwtSecret)
        throw new Error('JWT secret is not configured');
    try {
        const decoded = await (0, node_util_1.promisify)(jwt.verify)(token.replace('Bearer ', ''), jwtSecret);
        return decoded;
    }
    catch {
        throw new Error('Invalid or expired token');
    }
}
function encryptJWTData(text, secret) {
    try {
        const iv = crypto.randomBytes(12);
        const cipher = crypto.createCipheriv('aes-256-gcm', crypto.createHash('sha256').update(secret).digest(), iv);
        let encrypted = cipher.update(text, 'utf8', 'hex');
        encrypted += cipher.final('hex');
        const authTag = cipher.getAuthTag().toString('hex');
        return `${iv.toString('hex')}:${encrypted}:${authTag}`;
    }
    catch {
        return '';
    }
}
function decryptJWTData(encryptedText, secret) {
    try {
        const [iv, encrypted, authTag] = encryptedText
            .split(':')
            .map((part) => Buffer.from(part, 'hex'));
        const decipher = crypto.createDecipheriv('aes-256-gcm', crypto.createHash('sha256').update(secret).digest(), iv);
        decipher.setAuthTag(authTag);
        let decrypted = decipher.update(encrypted.toString('hex'), 'hex', 'utf8');
        decrypted += decipher.final('utf8');
        return decrypted;
    }
    catch {
        return '';
    }
}
function generateFingerprint(req, usernameHashed) {
    const userAgent = req.headers['user-agent'] || '';
    const ip = req.ip || req.connection?.remoteAddress || '';
    const language = req.headers['accept-language'] || '';
    const referer = req.headers['referer']
        ? new node_url_1.URL(req.headers['referer']).origin
        : '';
    const rawFingerprint = `${userAgent}|${ip}|${language}|${referer}|${usernameHashed}`;
    return crypto.createHash('sha256').update(rawFingerprint).digest('hex');
}
