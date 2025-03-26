import { GraphQLService } from './graphql.service';
export declare class GraphQLController {
    private readonly graphQLService;
    constructor(graphQLService: GraphQLService);
    handlerGraphQL(data: any): Promise<void>;
}
