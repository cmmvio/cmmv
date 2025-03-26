export declare const SchemaGetAll: ({
    name: string;
    in: string;
    required: boolean;
    default: number;
    schema: {
        type: string;
        enum?: undefined;
    };
} | {
    name: string;
    in: string;
    required: boolean;
    default: string;
    schema: {
        type: string;
        enum?: undefined;
    };
} | {
    name: string;
    in: string;
    required: boolean;
    default: string;
    schema: {
        type: string;
        enum: string[];
    };
} | {
    name: string;
    in: string;
    required: boolean;
    schema: {
        type: string;
        enum?: undefined;
    };
    default?: undefined;
})[];
export declare const SchemaGetIn: {
    name: string;
    in: string;
    required: boolean;
    schema: {
        type: string;
        items: {
            type: string;
        };
    };
}[];
