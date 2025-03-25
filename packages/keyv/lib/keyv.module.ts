import { Module } from '@cmmv/core';
import { KeyvConfig } from './keyv.config';
import { KeyvService } from './keyv.service';

export const KeyvModule = new Module('keyv', {
    configs: [KeyvConfig],
    providers: [KeyvService],
});
