import { Service, AbstractService, Interceptor, Config } from '@cmmv/core';

import { IThrottler } from './throttler.interface';

import { ThrottlerException } from './throttler.exception';

@Service('throttler')
export class ThrottlerService extends AbstractService {
    public static _storage: Map<string, IThrottler> = new Map();
    public static _gcInterval: number = 1000 * 30;
    public static _gcIntervalId: NodeJS.Timeout;

    public static async loadConfig(): Promise<void> {
        const gcInterval = Config.get('throttler.gcInterval', 1000 * 30);
        ThrottlerService._gcInterval = gcInterval;

        ThrottlerService._gcIntervalId = setInterval(() => {
            ThrottlerService.gc();
        }, ThrottlerService._gcInterval);
    }

    @Interceptor()
    async interceptor(
        path: string,
        {
            req,
            res,
            next,
            handler,
        }: { req: any; res: any; next: any; handler: any },
    ) {
        const ip = req.headers['x-forwarded-for'] || req.socket.remoteAddress;
        const requestSignature = `${req.method}::${handler.name}::${ip}`;
        return ThrottlerService.validateRequest(
            requestSignature,
            handler.name,
            ip,
        );
    }

    public static validateRequest(
        requestSignature: string,
        handlerName: string,
        ip: string,
    ): boolean {
        const throttler = ThrottlerService.getThrottler(requestSignature);

        if (throttler) {
            if (throttler.lastHit + throttler.ttl < Date.now()) {
                throttler.totalHits = 1;
                throttler.lastHit = Date.now();
            }

            if (throttler.totalHits >= throttler.limit)
                throw new ThrottlerException();

            throttler.totalHits++;
            throttler.lastHit = Date.now();
            ThrottlerService.setThrottler(requestSignature, throttler);
        } else {
            const limit = Config.get('throttler.limit', 10);
            const ttl = Config.get('throttler.ttl', 1000 * 5);

            ThrottlerService.setThrottler(requestSignature, {
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

    public static getThrottler(requestSignature: string): IThrottler {
        return this._storage.get(requestSignature);
    }

    public static setThrottler(
        requestSignature: string,
        throttler: IThrottler,
    ) {
        this._storage.set(requestSignature, throttler);
    }

    public static deleteThrottler(path: string) {
        this._storage.delete(path);
    }

    public static gc() {
        const now = Date.now();

        for (const [key, throttler] of this._storage.entries()) {
            if (throttler.lastHit + throttler.ttl < now) {
                this._storage.delete(key);
            }
        }
    }

    public static clearThrottler() {
        this._storage.clear();
    }
}
