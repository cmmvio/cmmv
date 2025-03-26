"use strict";
var ThrottlerService_1;
Object.defineProperty(exports, "__esModule", { value: true });
exports.ThrottlerService = void 0;
const tslib_1 = require("tslib");
const core_1 = require("@cmmv/core");
const throttler_exception_1 = require("./throttler.exception");
let ThrottlerService = ThrottlerService_1 = class ThrottlerService extends core_1.AbstractService {
    static async loadConfig() {
        const gcInterval = core_1.Config.get('throttler.gcInterval', 1000 * 30);
        ThrottlerService_1._gcInterval = gcInterval;
        ThrottlerService_1._gcIntervalId = setInterval(() => {
            ThrottlerService_1.gc();
        }, ThrottlerService_1._gcInterval);
    }
    async interceptor(path, { req, res, next, handler, }) {
        const ip = req.headers['x-forwarded-for'] || req.socket.remoteAddress;
        const requestSignature = `${req.method}::${handler.name}::${ip}`;
        return ThrottlerService_1.validateRequest(requestSignature, handler.name, ip);
    }
    static validateRequest(requestSignature, handlerName, ip) {
        const throttler = ThrottlerService_1.getThrottler(requestSignature);
        if (throttler) {
            if (throttler.lastHit + throttler.ttl < Date.now()) {
                throttler.totalHits = 1;
                throttler.lastHit = Date.now();
            }
            if (throttler.totalHits >= throttler.limit)
                throw new throttler_exception_1.ThrottlerException();
            throttler.totalHits++;
            throttler.lastHit = Date.now();
            ThrottlerService_1.setThrottler(requestSignature, throttler);
        }
        else {
            const limit = core_1.Config.get('throttler.limit', 10);
            const ttl = core_1.Config.get('throttler.ttl', 1000 * 5);
            ThrottlerService_1.setThrottler(requestSignature, {
                handler: handlerName,
                ip,
                totalHits: 1,
                limit,
                ttl,
                lastHit: Date.now(),
            });
        }
        return false;
    }
    static getThrottler(requestSignature) {
        return this._storage.get(requestSignature);
    }
    static setThrottler(requestSignature, throttler) {
        this._storage.set(requestSignature, throttler);
    }
    static deleteThrottler(path) {
        this._storage.delete(path);
    }
    static gc() {
        const now = Date.now();
        for (const [key, throttler] of this._storage.entries()) {
            if (throttler.lastHit + throttler.ttl < now) {
                this._storage.delete(key);
            }
        }
    }
    static clearThrottler() {
        this._storage.clear();
    }
};
exports.ThrottlerService = ThrottlerService;
ThrottlerService._storage = new Map();
ThrottlerService._gcInterval = 1000 * 30;
tslib_1.__decorate([
    (0, core_1.Interceptor)(),
    tslib_1.__metadata("design:type", Function),
    tslib_1.__metadata("design:paramtypes", [String, Object]),
    tslib_1.__metadata("design:returntype", Promise)
], ThrottlerService.prototype, "interceptor", null);
exports.ThrottlerService = ThrottlerService = ThrottlerService_1 = tslib_1.__decorate([
    (0, core_1.Service)('throttler')
], ThrottlerService);
