import { ArgsType, Field, Int, ObjectType } from 'type-graphql';

import GraphQLJSON from 'graphql-type-json';

export interface GraphQLContext {
    req: Request;
    token?: string;
    refreshToken?: string;
}

export interface IPaginationArgs {
    limit?: number;
    offset?: number;
    sortBy?: string;
    sort?: string;
    search?: string;
    searchField?: string;
    filters?: Record<string, any>;
}

@ObjectType()
export class PaginationResponse implements IPaginationArgs {
    @Field(() => Int, {
        description:
            'Maximum number of items to be returned per page. Default: 10.',
    })
    limit?: number;

    @Field(() => Int, {
        description:
            'Number of items to be skipped before returning results. Default: 0.',
    })
    offset?: number;

    @Field({
        description: "Field used to sort the results. Default: 'id'.",
    })
    sortBy?: string;

    @Field({
        description:
            "Sorting order: 'asc' (ascending) or 'desc' (descending). Default: 'asc'.",
    })
    sort?: string;

    @Field({
        description: 'Search term to filter results.',
        nullable: true,
    })
    search?: string;

    @Field({
        description: 'Specific field where the search should be applied.',
        nullable: true,
    })
    searchField?: string;

    @Field(() => GraphQLJSON, {
        description:
            'Flexible filter object where the key is the field name and the value is the filter condition.',
        nullable: true,
    })
    filters?: Record<string, any>;
}

@ArgsType()
export class PaginationArgs {
    @Field(() => Int, {
        description:
            'Maximum number of items to be returned per page. Default: 10.',
        nullable: true,
        defaultValue: 10,
    })
    limit?: number;

    @Field({
        description:
            'Number of items to be skipped before returning results. Default: 0.',
        nullable: true,
        defaultValue: 0,
    })
    offset?: number;

    @Field({
        description: "Field used to sort the results. Default: 'id'.",
        nullable: true,
        defaultValue: 'id',
    })
    sortBy?: string;

    @Field({
        description:
            "Sorting order: 'asc' (ascending) or 'desc' (descending). Default: 'asc'.",
        nullable: true,
        defaultValue: 'asc',
    })
    sort?: string;

    @Field({
        description: 'Search term to filter results.',
        nullable: true,
    })
    search?: string;

    @Field({
        description: 'Specific field where the search should be applied.',
        nullable: true,
    })
    searchField?: string;

    @Field(() => GraphQLJSON, {
        description:
            'Flexible filter object where the key is the field name and the value is the filter condition.',
        nullable: true,
    })
    filters?: Record<string, any>;
}
