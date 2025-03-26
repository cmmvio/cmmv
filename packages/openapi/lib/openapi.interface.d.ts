export type SwaggerEnumType = string[] | number[] | (string | number)[] | Record<number, string>;
export interface IOpenAPISchemaOptions {
    name?: string;
    description?: string;
}
export interface IOpenAPIPropertyOptions {
    name?: string;
    type?: any;
    enum?: string[] | object;
    enumName?: string;
    example?: any;
    properties?: IOpenAPIObjectType;
    required?: boolean;
    readOnly?: boolean;
    items?: IOpenAPIPropertyOptions;
    $ref?: string;
    default?: any;
}
export interface IOpenAPIObjectType {
    [key: string]: IOpenAPIPropertyOptions;
}
export type SecuritySchemeType = 'apiKey' | 'http' | 'oauth2' | 'openIdConnect';
export interface IOpenAPISecuritySchema {
    type?: SecuritySchemeType;
    description?: string;
    name?: string;
    in?: string;
    scheme?: string;
    bearerFormat?: string;
    flows?: IOAuthFlows;
    openIdConnectUrl?: string;
    'x-tokenName'?: string;
}
export interface IOAuthFlows {
    implicit?: IOAuthFlow;
    password?: IOAuthFlow;
    clientCredentials?: IOAuthFlow;
    authorizationCode?: IOAuthFlow;
}
export interface IOAuthFlow {
    authorizationUrl?: string;
    tokenUrl?: string;
    refreshUrl?: string;
    scopes: ScopesObject;
}
export type ScopesObject = Record<string, any>;
export type SecurityRequirementObject = Record<string, string[]>;
export type ParametersType = 'header' | 'query' | 'path' | 'cookie';
export interface IOpenAPIParameter {
    in: ParametersType;
    name: string;
    description?: string;
    required?: boolean;
    schema?: IOpenAPIParameterSchema[];
    example?: any;
    allowEmptyValue?: boolean;
    explode?: boolean;
    deprecated?: boolean;
}
export interface IOpenAPIParameterSchema {
    type: any;
    minimum?: number;
    maximum?: number;
    default?: any;
    enum?: string[] | number[];
    format?: any;
    nullable?: boolean;
    minItems?: number;
    items?: {
        type: any;
    };
}
