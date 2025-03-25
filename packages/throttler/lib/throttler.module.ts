import { Module } from '@cmmv/core';

import { ThrottlerConfig } from './throttler.config';
import { ThrottlerService } from './throttler.service';

export const ThrottlerModule = new Module('throttler', {
    configs: [ThrottlerConfig],
    providers: [ThrottlerService],
});
