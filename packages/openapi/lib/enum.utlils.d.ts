export declare function getEnumValues(enumType: any | (() => any)): string[] | number[];
export declare function getEnumType(values: (string | number)[]): 'string' | 'number';
export declare function addEnumArraySchema(paramDefinition: Partial<Record<'schema' | 'isArray' | 'enumName' | 'enumSchema', any>>, decoratorOptions: Partial<Record<'enum' | 'enumName' | 'enumSchema', any>>): void;
export declare function addEnumSchema(paramDefinition: Partial<Record<string, any>>, decoratorOptions: Partial<Record<string, any>>): void;
export declare const isEnumArray: <T extends Partial<Record<"isArray" | "enum", any>>>(obj: Record<string, any>) => obj is T;
export declare const isEnumDefined: <T extends Partial<Record<"enum", any>>>(obj: Record<string, any>) => obj is T;
export declare const isEnumMetadata: (metadata: any) => any;
