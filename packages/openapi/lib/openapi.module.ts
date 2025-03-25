import { Module } from '@cmmv/core';

import { OpenAPIConfig } from './openapi.config';
import { OpenAPIService } from './openapi.service';
import { OpenAPIController } from './openapi.controller';

export const OpenAPIModule = new Module('openapi', {
    configs: [OpenAPIConfig],
    providers: [OpenAPIService],
    controllers: [OpenAPIController],
});
