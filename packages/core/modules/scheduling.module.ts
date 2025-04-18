import { Module } from '../lib/module';

import { SchedulingService } from '../services/scheduling.service';

export const SchedulingModule = new Module('scheduling', {
    providers: [SchedulingService],
});
