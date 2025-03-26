export declare class OpenAPIService {
    processOpenAPI(): Promise<void>;
    findContract(contractName: string): any;
    getRequestResponse(route: any): {
        request: any;
        response: any;
        parameters: any[];
    };
}
