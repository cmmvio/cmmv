export interface CacheOptions {
    ttl?: number;
    compress?: boolean;
    schema?: any;
}
export declare function Cache(key: string, options?: CacheOptions): MethodDecorator;
