export interface IThrottler {
    handler: string;
    ip: string;
    totalHits: number;
    limit: number;
    ttl: number;
    lastHit: number;
}
