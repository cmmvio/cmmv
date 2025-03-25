import { Module } from '@cmmv/core';
import { CacheConfig } from './cache.config';
import { CacheService } from './cache.service';

export const CacheModule = new Module('cache', {
    configs: [CacheConfig],
    providers: [CacheService],
});
