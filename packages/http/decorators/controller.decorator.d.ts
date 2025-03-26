export declare function Controller(prefix?: string): ClassDecorator;
export interface RouterMetadata {
    contract?: new () => any;
    summary?: string;
    schema?: RouterSchema;
    exposeFilters?: boolean;
    exclude?: boolean;
    externalDocs?: string;
    docs?: {
        body?: object;
        headers?: object;
        return?: object;
    };
}
export declare enum RouterSchema {
    GetAll = 0,
    GetByID = 1,
    GetIn = 2,
    Raw = 3,
    Insert = 4,
    Update = 5,
    Delete = 6,
    Import = 7,
    Export = 8
}
export declare function Get(metadata?: RouterMetadata): MethodDecorator;
export declare function Get(path: string, metadata?: RouterMetadata): MethodDecorator;
export declare function Post(metadata?: RouterMetadata): MethodDecorator;
export declare function Post(path: string, metadata?: RouterMetadata): MethodDecorator;
export declare function Put(metadata?: RouterMetadata): MethodDecorator;
export declare function Put(path: string, metadata?: RouterMetadata): MethodDecorator;
export declare function Delete(metadata?: RouterMetadata): MethodDecorator;
export declare function Delete(path: string, metadata?: RouterMetadata): MethodDecorator;
export declare function Patch(metadata?: RouterMetadata): MethodDecorator;
export declare function Patch(path: string, metadata?: RouterMetadata): MethodDecorator;
export declare function Redirect(url: string, statusCode: 301 | 302 | 307 | 308): MethodDecorator;
export declare function HttpCode(statusCode: number): MethodDecorator;
export declare function Body(): ParameterDecorator;
export declare function Queries(): ParameterDecorator;
export declare function Param(paramName: string): ParameterDecorator;
export declare function Query(queryName: string): ParameterDecorator;
export declare function Header(headerName: string): ParameterDecorator;
export declare function Headers(): ParameterDecorator;
export declare function Request(): ParameterDecorator;
export declare function Req(): ParameterDecorator;
export declare function Response(): ParameterDecorator;
export declare function Res(): ParameterDecorator;
export declare function Next(): ParameterDecorator;
export declare function Session(): ParameterDecorator;
export declare function User(): ParameterDecorator;
export declare function Ip(): ParameterDecorator;
export declare function HostParam(): ParameterDecorator;
