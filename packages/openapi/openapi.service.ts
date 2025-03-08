import * as fs from 'node:fs';
import * as path from 'node:path';
import * as yaml from 'js-yaml';

import { Service, Hook, HooksType, Config } from '@cmmv/core';

import { OpenAPIRegistry } from './openapi.registry';

@Service('openapi')
export class OpenAPIService {
    @Hook(HooksType.onInitialize)
    public async processOpenAPI() {
        const controllers = OpenAPIRegistry.getControllers();
        const generalInfo = Config.get('openapi');
        const schema = {
            ...generalInfo,
            paths: {},
            components: {
                schemas: {},
                securitySchemes: {},
            },
            security: [],
        };

        //Schema
        for (let [cls, controller] of controllers) {
            if (controller.options.apiType === 'schema') {
                schema.components.schemas[controller.options.name] = {
                    properties: {
                        ...controller.properties,
                    },
                    required: controller.properties
                        ? Object.entries(controller.properties)
                              .filter(
                                  ([_, value]: any) => value.required === true,
                              )
                              .map(([key]) => key)
                        : null,
                };
            }
        }

        const openAPIPath = path.resolve(
            __dirname,
            '../../public/openapi.json',
        );
        fs.writeFileSync(openAPIPath, JSON.stringify(schema, null, 2));

        fs.writeFileSync(
            openAPIPath.replace('.json', '.yml'),
            yaml.dump(schema, {
                indent: 2,
            }),
        );
    }
}
