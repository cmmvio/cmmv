import { AbstractTranspile, ITranspile } from '@cmmv/core';
export declare class RepositoryTranspile extends AbstractTranspile implements ITranspile {
    /**
     * Run the transpile process
     */
    run(): void;
    /**
     * Generate the entities
     * @param contract - The contract to generate the entities for
     */
    private generateEntities;
    /**
     * Generate the services
     * @param contract - The contract to generate the services for
     */
    private generateServices;
    /**
     * Generate the indexes
     * @param entityName - The name of the entity
     * @param fields - The fields of the entity
     * @param contract - The contract to generate the indexes for
     */
    private generateIndexes;
    /**
     * Generate the field
     * @param field - The field to generate
     * @returns The field
     */
    private generateField;
    /**
     * Generate the column options
     * @param field - The field to generate the column options for
     * @returns The column options
     */
    private generateColumnOptions;
    /**
     * Map the proto type to the ts type
     * @param protoType - The proto type
     * @param field - The field to map the proto type to
     * @returns The ts type
     */
    private mapToTsType;
    /**
     * Map the proto type to the typeorm type
     * @param type - The type
     * @param field - The field to map the proto type to
     * @returns The typeorm type
     */
    private mapToTypeORMType;
    /**
     * Generate the typeorm imports
     * @param contract - The contract to generate the typeorm imports for
     * @returns The typeorm imports
     */
    private generateTypeORMImports;
    /**
     * Generate the extra fields
     * @param contract - The contract to generate the extra fields for
     * @returns The extra fields
     */
    private generateExtraFields;
    /**
     * Generate the extra import
     * @param contract - The contract to generate the extra import for
     */
    private generateExtraImport;
    /**
     * Generate the entities import
     * @param contract - The contract to generate the entities import for
     * @param extraImports - The extra imports to generate
     * @returns The entities import
     */
    private generateEntitiesImport;
}
