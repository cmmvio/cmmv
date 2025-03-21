export const SchemaGetAll = [
    {
        name: 'limit',
        in: 'query',
        required: false,
        default: 10,
        schema: {
            type: 'number',
        },
    },
    {
        name: 'offset',
        in: 'query',
        required: false,
        default: 0,
        schema: {
            type: 'number',
        },
    },
    {
        name: 'sortBy',
        in: 'query',
        required: false,
        default: 'id',
        schema: {
            type: 'string',
        },
    },
    {
        name: 'sort',
        in: 'query',
        required: false,
        default: 'asc',
        schema: {
            type: 'string',
            enum: ['asc', 'desc'],
        },
    },
    {
        name: 'search',
        in: 'query',
        required: false,
        schema: {
            type: 'string',
        },
    },
    {
        name: 'searchField',
        in: 'query',
        required: false,
        schema: {
            type: 'string',
        },
    },
];

export const SchemaGetIn = [
    {
        name: 'ids',
        in: 'query',
        required: true,
        schema: {
            type: 'array',
            items: {
                type: 'string',
            },
        },
    },
];
