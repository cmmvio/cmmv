export type CustomDecorator<TKey = string> = MethodDecorator & ClassDecorator & {
    KEY: TKey;
};
export declare const SetMetadata: <K = string, V = any>(metadataKey: K, metadataValue: V) => CustomDecorator<K>;
