import { Module } from '@cmmv/core';

import { SchedulingService } from './scheduling.service';

export const SchedulingModule = new Module('scheduling', {
    providers: [SchedulingService],
});
