"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.ResponseSchema = void 0;
const fast_json_stringify_1 = require("fast-json-stringify");
const fastJsonStringify = fast_json_stringify_1.default.default || fast_json_stringify_1.default;
exports.ResponseSchema = fastJsonStringify({
    title: 'Response Schema',
    type: 'object',
    properties: {
        status: {
            type: 'number',
            nullable: false,
        },
        processingTime: {
            type: 'number',
            nullable: false,
        },
        requestId: {
            type: 'string',
            nullable: true,
        },
        telemetry: {
            type: 'array',
            nullable: true,
        },
        result: {
            type: 'object',
            nullable: false,
            properties: {
                success: {
                    type: 'boolean',
                    nullable: false,
                },
                message: {
                    type: 'string',
                    nullable: true,
                },
                data: {
                    anyOf: [
                        {
                            type: 'array',
                            items: { type: 'object' },
                            nullable: true,
                        },
                        { type: 'object', nullable: true },
                    ],
                },
                pagination: {
                    type: 'object',
                    nullable: true,
                    properties: {
                        limit: { type: 'number', nullable: false },
                        offset: { type: 'number', nullable: false },
                        sortBy: { type: 'string', nullable: true },
                        sort: { type: 'string', nullable: true },
                        search: { type: 'string', nullable: true },
                        searchField: { type: 'string', nullable: true },
                        filters: { type: 'object', nullable: true },
                    },
                    required: ['limit', 'offset'],
                },
            },
            required: ['success'],
        },
    },
    required: ['status', 'processingTime', 'result'],
});
