export function getEnumValues(
    enumType: any | (() => any),
): string[] | number[] {
    if (typeof enumType === 'function') {
        return getEnumValues(enumType());
    }

    if (Array.isArray(enumType)) {
        return enumType as string[];
    }
    if (typeof enumType !== 'object') {
        return [];
    }

    const numericValues = Object.values(enumType)
        .filter((value) => typeof value === 'number')
        .map((value: any) => value.toString());

    return Object.keys(enumType)
        .filter((key) => !numericValues.includes(key))
        .map((key) => enumType[key]);
}

export function getEnumType(values: (string | number)[]): 'string' | 'number' {
    const hasString = values.some((value) => typeof value === 'string');
    return hasString ? 'string' : 'number';
}

export function addEnumArraySchema(
    paramDefinition: Partial<
        Record<'schema' | 'isArray' | 'enumName' | 'enumSchema', any>
    >,
    decoratorOptions: Partial<Record<'enum' | 'enumName' | 'enumSchema', any>>,
) {
    const paramSchema: any = paramDefinition.schema || {};
    paramDefinition.schema = paramSchema;
    paramSchema.type = 'array';
    delete paramDefinition.isArray;

    const enumValues = getEnumValues(decoratorOptions.enum);
    paramSchema.items = {
        type: getEnumType(enumValues),
        enum: enumValues,
    };

    if (decoratorOptions.enumName) {
        paramDefinition.enumName = decoratorOptions.enumName;
    }

    if (decoratorOptions.enumSchema) {
        paramDefinition.enumSchema = decoratorOptions.enumSchema;
    }
}

export function addEnumSchema(
    paramDefinition: Partial<Record<string, any>>,
    decoratorOptions: Partial<Record<string, any>>,
) {
    const paramSchema: any = paramDefinition.schema || {};
    const enumValues = getEnumValues(decoratorOptions.enum);

    paramDefinition.schema = paramSchema;
    paramSchema.enum = enumValues;
    paramSchema.type = getEnumType(enumValues);

    if (decoratorOptions.enumName) {
        paramDefinition.enumName = decoratorOptions.enumName;
    }

    if (decoratorOptions.enumSchema) {
        paramDefinition.enumSchema = decoratorOptions.enumSchema;
    }
}

export const isEnumArray = <T extends Partial<Record<'isArray' | 'enum', any>>>(
    obj: Record<string, any>,
): obj is T => obj.isArray && obj.enum;

export const isEnumDefined = <T extends Partial<Record<'enum', any>>>(
    obj: Record<string, any>,
): obj is T => obj.enum;

export const isEnumMetadata = (metadata: any) =>
    metadata.enum || (metadata.isArray && metadata.items?.['enum']);
