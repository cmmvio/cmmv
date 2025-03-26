"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.generateFingerprint = generateFingerprint;
const crypto = require("node:crypto");
const node_url_1 = require("node:url");
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
