import { Singleton } from '@cmmv/core';
export declare class RepositoryMigration extends Singleton {
    /**
     * Generate a TypeORM migration file based on changes between contract versions
     * @param currentContract The current state of the contract
     * @param updatedContract The updated state of the contract (null if contract is being removed)
     * @returns Path to the generated migration file
     */
    static generateMigration(currentContract: any, updatedContract: any): Promise<string>;
    /**
     * Detect changes between two versions of a contract
     * @param currentContract The current state of the contract
     * @param updatedContract The updated state of the contract
     * @returns The changes to create the migration for
     */
    private static detectChanges;
    /**
     * Check if a field has been modified
     * @param oldField The old field
     * @param newField The new field
     * @returns True if the field has been modified, false otherwise
     */
    private static fieldHasChanged;
    /**
     * Check if an index has been modified
     * @param oldIndex The old index
     * @param newIndex The new index
     * @returns True if the index has been modified, false otherwise
     */
    private static indexHasChanged;
    /**
     * Create a migration file in the `/src/migrations` directory
     * @param contract The contract to create the migration for
     * @param changes The changes to create the migration for
     * @param isNewContract Whether this is a new contract
     * @returns The path to the created migration file
     */
    private static createMigrationFile;
    /**
     * Generate the content of the migration file
     * @param className The name of the migration class
     * @param changes The changes to create the migration for
     * @returns The content of the migration file
     */
    private static generateMigrationContent;
    /**
     * Generate TypeORM code to add columns
     * @param tableName The name of the table to modify
     * @param fields The fields to add
     * @returns The TypeORM code to add columns
     */
    private static generateAddColumnsCode;
    /**
     * Generate TypeORM code to drop columns
     * @param tableName The name of the table to modify
     * @param fields The fields to drop
     * @returns The TypeORM code to drop columns
     */
    private static generateDropColumnsCode;
    /**
     * Generate TypeORM code to alter columns
     * @param tableName The name of the table to modify
     * @param modifiedFields The fields to alter
     * @param direction The direction of the migration
     * @returns The TypeORM code to alter columns
     */
    private static generateAlterColumnsCode;
    /**
     * Generate TypeORM code to create indexes
     * @param tableName The name of the table to modify
     * @param indexes The indexes to create
     * @returns The TypeORM code to create indexes
     */
    private static generateCreateIndexesCode;
    /**
     * Generate TypeORM code to drop indexes
     * @param tableName The name of the table to modify
     * @param indexes The indexes to drop
     * @returns The TypeORM code to drop indexes
     */
    private static generateDropIndexesCode;
    /**
     * Generate TypeORM code to modify indexes
     * @param tableName The name of the table to modify
     * @param modifiedIndexes The indexes to modify
     * @param direction The direction of the migration
     * @returns The TypeORM code to modify indexes
     */
    private static generateModifyIndexesCode;
    /**
     * Generate a TypeORM column definition from a field object
     * @param field The field to generate the definition for
     * @returns The TypeORM column definition
     */
    private static generateColumnDefinition;
    /**
     * Generate a TypeORM index definition from an index object
     * @param index The index to generate the definition for
     * @returns The TypeORM index definition
     */
    private static generateIndexDefinition;
    /**
     * Get the database table name from a contract
     * @param contract The contract to get the table name from
     * @returns The database table name
     */
    private static getTableName;
    /**
     * Convert a string to snake_case
     * @param str The string to convert
     * @returns The snake_case string
     */
    private static toSnakeCase;
    /**
     * Indent multiline code by a specified number of spaces
     * @param code The code to indent
     * @param spaces The number of spaces to indent
     * @returns The indented code
     */
    private static indentCode;
    /**
     * Generate a migration file for creating a new table
     * @param className The class name of the migration
     * @param changes The changes to apply
     * @returns The migration file content
     */
    private static generateCreateTableMigration;
    /**
     * Create a migration file specifically for dropping a table
     * @param contract The contract whose table is being dropped
     * @returns Path to the generated migration file
     */
    private static createDropTableMigrationFile;
    /**
     * Generate a migration file specifically for dropping a table
     * @param className The name of the migration class
     * @param tableName The name of the table to drop
     * @param contract The original contract for recreating the table in down migration
     * @returns The contents of the migration file
     */
    private static generateDropTableMigration;
}
