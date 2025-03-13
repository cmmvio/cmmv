import { Controller, Post, Body, Get, Query } from '@cmmv/http';

import { GraphQLService } from './graphql.service';

@Controller('graphql')
export class GraphQLController {
    constructor(private readonly graphQLService: GraphQLService) {}

    @Get({ exclude: true })
    async handlerGraphQL(@Body() data: any) {}
}
