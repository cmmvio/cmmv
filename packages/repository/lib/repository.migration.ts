import { Singleton } from '@cmmv/core';

export class RepositoryMigration extends Singleton {
    /**
     * Generate a TypeORM migration file based on changes between contract versions
     * @param currentContract The current state of the contract
     * @param updatedContract The updated state of the contract (null if contract is being removed)
     * @returns Path to the generated migration file
     */
    static async generateMigration(
        currentContract: any,
        updatedContract: any,
    ): Promise<string> {
        if (currentContract && !updatedContract) {
            const tableName = this.getTableName(currentContract);
            const migrationFile =
                await this.createDropTableMigrationFile(currentContract);
            return migrationFile;
        }

        if (!updatedContract || updatedContract.options?.moduleContract)
            return null;

        if (!currentContract) {
            const changes = {
                hasChanges: true,
                tableName: this.getTableName(updatedContract),
                addedFields: updatedContract.fields || [],
                removedFields: [],
                modifiedFields: [],
                addedIndexes: updatedContract.indexs || [],
                removedIndexes: [],
                modifiedIndexes: [],
            };

            const migrationFile = await this.createMigrationFile(
                updatedContract,
                changes,
                true,
            );
            return migrationFile;
        }

        const changes = this.detectChanges(currentContract, updatedContract);

        if (!changes.hasChanges) return null;

        const migrationFile = await this.createMigrationFile(
            updatedContract,
            changes,
        );
        return migrationFile;
    }

    /**
     * Detect changes between two versions of a contract
     * @param currentContract The current state of the contract
     * @param updatedContract The updated state of the contract
     * @returns The changes to create the migration for
     */
    private static detectChanges(
        currentContract: any,
        updatedContract: any,
    ): any {
        const changes = {
            hasChanges: false,
            tableName: this.getTableName(updatedContract),
            addedFields: [],
            removedFields: [],
            modifiedFields: [],
            addedIndexes: [],
            removedIndexes: [],
            modifiedIndexes: [],
        };

        const currentFields = currentContract.fields || [];
        const updatedFields = updatedContract.fields || [];

        const currentFieldsMap = new Map(
            currentFields.map((field) => [field.propertyKey, field]),
        );

        const updatedFieldsMap = new Map(
            updatedFields.map((field) => [field.propertyKey, field]),
        );

        for (const [key, field] of updatedFieldsMap.entries()) {
            if (!currentFieldsMap.has(key)) {
                changes.addedFields.push(field);
                changes.hasChanges = true;
            }
        }

        for (const [key, field] of currentFieldsMap.entries()) {
            if (!updatedFieldsMap.has(key)) {
                changes.removedFields.push(field);
                changes.hasChanges = true;
            }
        }

        for (const [key, updatedField] of updatedFieldsMap.entries()) {
            if (currentFieldsMap.has(key)) {
                const currentField = currentFieldsMap.get(key);
                if (this.fieldHasChanged(currentField, updatedField)) {
                    changes.modifiedFields.push({
                        old: currentField,
                        new: updatedField,
                    });
                    changes.hasChanges = true;
                }
            }
        }

        const currentIndexes = currentContract.indexs || [];
        const updatedIndexes = updatedContract.indexs || [];

        const currentIndexesMap = new Map(
            currentIndexes.map((index) => [index.name, index]),
        );

        const updatedIndexesMap = new Map(
            updatedIndexes.map((index) => [index.name, index]),
        );

        for (const [name, index] of updatedIndexesMap.entries()) {
            if (!currentIndexesMap.has(name)) {
                changes.addedIndexes.push(index);
                changes.hasChanges = true;
            }
        }

        for (const [name, index] of currentIndexesMap.entries()) {
            if (!updatedIndexesMap.has(name)) {
                changes.removedIndexes.push(index);
                changes.hasChanges = true;
            }
        }

        for (const [name, updatedIndex] of updatedIndexesMap.entries()) {
            if (currentIndexesMap.has(name)) {
                const currentIndex = currentIndexesMap.get(name);
                if (this.indexHasChanged(currentIndex, updatedIndex)) {
                    changes.modifiedIndexes.push({
                        old: currentIndex,
                        new: updatedIndex,
                    });
                    changes.hasChanges = true;
                }
            }
        }

        return changes;
    }

    /**
     * Check if a field has been modified
     * @param oldField The old field
     * @param newField The new field
     * @returns True if the field has been modified, false otherwise
     */
    private static fieldHasChanged(oldField: any, newField: any): boolean {
        if (oldField.protoType !== newField.protoType) return true;
        if (oldField.protoRepeated !== newField.protoRepeated) return true;
        if (oldField.nullable !== newField.nullable) return true;
        if (oldField.unique !== newField.unique) return true;
        if (
            JSON.stringify(oldField.defaultValue) !==
            JSON.stringify(newField.defaultValue)
        )
            return true;

        const oldValidations = JSON.stringify(oldField.validations || []);
        const newValidations = JSON.stringify(newField.validations || []);
        if (oldValidations !== newValidations) return true;

        return false;
    }

    /**
     * Check if an index has been modified
     * @param oldIndex The old index
     * @param newIndex The new index
     * @returns True if the index has been modified, false otherwise
     */
    private static indexHasChanged(oldIndex: any, newIndex: any): boolean {
        const oldFields = oldIndex.fields || [];
        const newFields = newIndex.fields || [];

        if (oldFields.length !== newFields.length) return true;

        for (let i = 0; i < oldFields.length; i++)
            if (oldFields[i] !== newFields[i]) return true;

        const oldOptions = oldIndex.options || {};
        const newOptions = newIndex.options || {};

        if (oldOptions.unique !== newOptions.unique) return true;
        if (oldOptions.spatial !== newOptions.spatial) return true;
        if (oldOptions.fulltext !== newOptions.fulltext) return true;
        if (oldOptions.parser !== newOptions.parser) return true;
        if (oldOptions.where !== newOptions.where) return true;
        if (oldOptions.sparse !== newOptions.sparse) return true;
        if (oldOptions.background !== newOptions.background) return true;

        return false;
    }

    /**
     * Create a migration file in the `/src/migrations` directory
     * @param contract The contract to create the migration for
     * @param changes The changes to create the migration for
     * @param isNewContract Whether this is a new contract
     * @returns The path to the created migration file
     */
    private static async createMigrationFile(
        contract: any,
        changes: any,
        isNewContract: boolean = false,
    ): Promise<string> {
        const fs = require('fs');
        const path = require('path');
        const timestamp = new Date().getTime();
        const contractName = contract.contractName.replace(/Contract$/, '');
        const migrationName = `${timestamp}-${contractName}`;
        const migrationDir = path.resolve(process.cwd(), 'src/migrations');

        if (!fs.existsSync(migrationDir))
            fs.mkdirSync(migrationDir, { recursive: true });

        const migrationPath = path.join(migrationDir, `${migrationName}.ts`);
        const migrationContent = isNewContract
            ? this.generateCreateTableMigration(
                  migrationName,
                  changes,
                  timestamp,
                  contractName,
              )
            : this.generateMigrationContent(
                  migrationName,
                  changes,
                  timestamp,
                  contractName,
              );

        fs.writeFileSync(migrationPath, migrationContent);

        return migrationPath;
    }

    /**
     * Generate the content of the migration file
     * @param className The name of the migration class
     * @param changes The changes to create the migration for
     * @returns The content of the migration file
     */
    private static generateMigrationContent(
        className: string,
        changes: any,
        timestamp: number,
        contractName: string,
    ): string {
        const {
            tableName,
            addedFields,
            removedFields,
            modifiedFields,
            addedIndexes,
            removedIndexes,
            modifiedIndexes,
        } = changes;

        let upMethodContent = '';
        let downMethodContent = '';

        if (addedFields.length > 0) {
            upMethodContent += this.generateAddColumnsCode(
                tableName,
                addedFields,
            );
            downMethodContent += this.generateDropColumnsCode(
                tableName,
                addedFields,
            );
        }

        if (removedFields.length > 0) {
            upMethodContent += this.generateDropColumnsCode(
                tableName,
                removedFields,
            );
            downMethodContent += this.generateAddColumnsCode(
                tableName,
                removedFields,
            );
        }

        if (modifiedFields.length > 0) {
            upMethodContent += this.generateAlterColumnsCode(
                tableName,
                modifiedFields,
                'up',
            );
            downMethodContent += this.generateAlterColumnsCode(
                tableName,
                modifiedFields,
                'down',
            );
        }

        if (addedIndexes.length > 0) {
            upMethodContent += this.generateCreateIndexesCode(
                tableName,
                addedIndexes,
            );
            downMethodContent += this.generateDropIndexesCode(
                tableName,
                addedIndexes,
            );
        }

        if (removedIndexes.length > 0) {
            upMethodContent += this.generateDropIndexesCode(
                tableName,
                removedIndexes,
            );
            downMethodContent += this.generateCreateIndexesCode(
                tableName,
                removedIndexes,
            );
        }

        if (modifiedIndexes.length > 0) {
            upMethodContent += this.generateModifyIndexesCode(
                tableName,
                modifiedIndexes,
                'up',
            );
            downMethodContent += this.generateModifyIndexesCode(
                tableName,
                modifiedIndexes,
                'down',
            );
        }

        return `import { MigrationInterface, QueryRunner, Table, TableColumn, TableIndex } from "typeorm";

export class Update${contractName}${timestamp} implements MigrationInterface {
    public async up(queryRunner: QueryRunner): Promise<void> {
${this.indentCode(upMethodContent, 8)}
    }

    public async down(queryRunner: QueryRunner): Promise<void> {
${this.indentCode(downMethodContent, 8)}
    }
}
`;
    }

    /**
     * Generate TypeORM code to add columns
     * @param tableName The name of the table to modify
     * @param fields The fields to add
     * @returns The TypeORM code to add columns
     */
    private static generateAddColumnsCode(
        tableName: string,
        fields: any[],
    ): string {
        if (fields.length === 0) return '';

        let code = `// Add columns\n`;

        for (const field of fields) {
            const columnDef = this.generateColumnDefinition(field);
            code += `await queryRunner.addColumn("${tableName}", ${columnDef});\n`;
        }

        return code + '\n';
    }

    /**
     * Generate TypeORM code to drop columns
     * @param tableName The name of the table to modify
     * @param fields The fields to drop
     * @returns The TypeORM code to drop columns
     */
    private static generateDropColumnsCode(
        tableName: string,
        fields: any[],
    ): string {
        if (fields.length === 0) return '';

        let code = `// Drop columns\n`;

        for (const field of fields)
            code += `await queryRunner.dropColumn("${tableName}", "${field.propertyKey}");\n`;

        return code + '\n';
    }

    /**
     * Generate TypeORM code to alter columns
     * @param tableName The name of the table to modify
     * @param modifiedFields The fields to alter
     * @param direction The direction of the migration
     * @returns The TypeORM code to alter columns
     */
    private static generateAlterColumnsCode(
        tableName: string,
        modifiedFields: any[],
        direction: 'up' | 'down',
    ): string {
        if (modifiedFields.length === 0) return '';

        let code = `// Alter columns\n`;

        for (const modField of modifiedFields) {
            const field = direction === 'up' ? modField.new : modField.old;
            const columnDef = this.generateColumnDefinition(field);
            code += `await queryRunner.changeColumn("${tableName}", "${field.propertyKey}", ${columnDef});\n`;
        }

        return code + '\n';
    }

    /**
     * Generate TypeORM code to create indexes
     * @param tableName The name of the table to modify
     * @param indexes The indexes to create
     * @returns The TypeORM code to create indexes
     */
    private static generateCreateIndexesCode(
        tableName: string,
        indexes: any[],
    ): string {
        if (indexes.length === 0) return '';

        let code = `// Create indexes\n`;

        for (const index of indexes) {
            const indexDef = this.generateIndexDefinition(index);
            code += `await queryRunner.createIndex("${tableName}", ${indexDef});\n`;
        }

        return code + '\n';
    }

    /**
     * Generate TypeORM code to drop indexes
     * @param tableName The name of the table to modify
     * @param indexes The indexes to drop
     * @returns The TypeORM code to drop indexes
     */
    private static generateDropIndexesCode(
        tableName: string,
        indexes: any[],
    ): string {
        if (indexes.length === 0) return '';

        let code = `// Drop indexes\n`;

        for (const index of indexes)
            code += `await queryRunner.dropIndex("${tableName}", "${index.name}");\n`;

        return code + '\n';
    }

    /**
     * Generate TypeORM code to modify indexes
     * @param tableName The name of the table to modify
     * @param modifiedIndexes The indexes to modify
     * @param direction The direction of the migration
     * @returns The TypeORM code to modify indexes
     */
    private static generateModifyIndexesCode(
        tableName: string,
        modifiedIndexes: any[],
        direction: 'up' | 'down',
    ): string {
        if (modifiedIndexes.length === 0) return '';

        let code = `// Modify indexes\n`;

        for (const modIndex of modifiedIndexes) {
            const oldIndex = modIndex.old;
            const newIndex = direction === 'up' ? modIndex.new : modIndex.old;

            code += `await queryRunner.dropIndex("${tableName}", "${oldIndex.name}");\n`;
            const indexDef = this.generateIndexDefinition(newIndex);
            code += `await queryRunner.createIndex("${tableName}", ${indexDef});\n`;
        }

        return code + '\n';
    }

    /**
     * Generate a TypeORM column definition from a field object
     * @param field The field to generate the definition for
     * @returns The TypeORM column definition
     */
    private static generateColumnDefinition(field: any): string {
        const typeMapping: any = {
            string: 'varchar',
            text: 'text',
            boolean: 'boolean',
            bool: 'boolean',
            int32: 'int',
            int64: 'bigint',
            float: 'float',
            double: 'double',
            number: 'float',
            date: 'date',
            timestamp: 'timestamp',
            time: 'time',
            json: 'json',
            uuid: 'uuid',
            bigint: 'bigint',
            simpleArray: 'simple-array',
        };

        const type = typeMapping[field.protoType] || 'varchar';
        const isArray = field.protoRepeated;

        return `new TableColumn({
        name: "${field.propertyKey}",
        type: "${type}",
        isArray: ${isArray},
        isNullable: ${field.nullable !== false ? 'true' : 'false'},
        isUnique: ${field.unique === true ? 'true' : 'false'},
        default: ${field.defaultValue ? JSON.stringify(field.defaultValue) : 'undefined'}
    })`;
    }

    /**
     * Generate a TypeORM index definition from an index object
     * @param index The index to generate the definition for
     * @returns The TypeORM index definition
     */
    private static generateIndexDefinition(index: any): string {
        const fields = index.fields || [];
        const options = index.options || {};

        return `new TableIndex({
        name: "${index.name}",
        columnNames: ${JSON.stringify(fields)},
        isUnique: ${options.unique ? 'true' : 'false'},
        isSpatial: ${options.spatial ? 'true' : 'false'},
        isFulltext: ${options.fulltext ? 'true' : 'false'},
        where: ${options.where ? `"${options.where}"` : 'undefined'}
    })`;
    }

    /**
     * Get the database table name from a contract
     * @param contract The contract to get the table name from
     * @returns The database table name
     */
    private static getTableName(contract: any): string {
        if (contract.options?.databaseSchemaName)
            return contract.options.databaseSchemaName;

        const baseName =
            contract.controllerName ||
            contract.contractName.replace(/Contract$/, '');
        return this.toSnakeCase(baseName);
    }

    /**
     * Convert a string to snake_case
     * @param str The string to convert
     * @returns The snake_case string
     */
    private static toSnakeCase(str: string): string {
        return str
            .replace(/([A-Z])/g, '_$1')
            .replace(/^_/, '')
            .toLowerCase();
    }

    /**
     * Indent multiline code by a specified number of spaces
     * @param code The code to indent
     * @param spaces The number of spaces to indent
     * @returns The indented code
     */
    private static indentCode(code: string, spaces: number): string {
        const indent = ' '.repeat(spaces);
        return code
            .split('\n')
            .map((line) => (line ? indent + line : line))
            .join('\n');
    }

    /**
     * Generate a migration file for creating a new table
     * @param className The class name of the migration
     * @param changes The changes to apply
     * @returns The migration file content
     */
    private static generateCreateTableMigration(
        className: string,
        changes: any,
        timestamp: number,
        contractName: string,
    ): string {
        const { tableName, addedFields, addedIndexes } = changes;

        const columnDefs = addedFields
            .map((field) => {
                const typeMapping: any = {
                    string: 'varchar',
                    text: 'text',
                    boolean: 'boolean',
                    bool: 'boolean',
                    int32: 'int',
                    int64: 'bigint',
                    float: 'float',
                    double: 'double',
                    number: 'float',
                    date: 'date',
                    timestamp: 'timestamp',
                    time: 'time',
                    json: 'json',
                    uuid: 'uuid',
                    bigint: 'bigint',
                    simpleArray: 'simple-array',
                };

                const type = typeMapping[field.protoType] || 'varchar';
                const isArray = field.protoRepeated;

                return `{
        name: "${field.propertyKey}",
        type: "${type}",
        isArray: ${isArray},
        isNullable: ${field.nullable !== false ? 'true' : 'false'},
        isUnique: ${field.unique === true ? 'true' : 'false'},
        default: ${field.defaultValue ? JSON.stringify(field.defaultValue) : 'undefined'}
    }`;
            })
            .join(',\n            ');

        const indexDefs = addedIndexes
            .map((index) => {
                const fields = index.fields || [];
                const options = index.options || {};

                return `{
        name: "${index.name}",
        columnNames: ${JSON.stringify(fields)},
        isUnique: ${options.unique ? 'true' : 'false'},
        isSpatial: ${options.spatial ? 'true' : 'false'},
        isFulltext: ${options.fulltext ? 'true' : 'false'},
        where: ${options.where ? `"${options.where}"` : 'undefined'}
    }`;
            })
            .join(',\n            ');

        const upContent = `// Create new table
const table = new Table({
    name: "${tableName}",
    columns: [
            ${columnDefs}
    ]${
        addedIndexes.length > 0
            ? `,
    indices: [
            ${indexDefs}
    ]`
            : ''
    }
});

await queryRunner.createTable(table);`;

        const downContent = `// Drop table
await queryRunner.dropTable("${tableName}");`;

        return `import { MigrationInterface, QueryRunner, Table } from "typeorm";

export class Create${contractName}${timestamp} implements MigrationInterface {
    public async up(queryRunner: QueryRunner): Promise<void> {
${this.indentCode(upContent, 8)}
    }

    public async down(queryRunner: QueryRunner): Promise<void> {
${this.indentCode(downContent, 8)}
    }
}
`;
    }

    /**
     * Create a migration file specifically for dropping a table
     * @param contract The contract whose table is being dropped
     * @returns Path to the generated migration file
     */
    private static async createDropTableMigrationFile(
        contract: any,
    ): Promise<string> {
        const fs = require('fs');
        const path = require('path');
        const timestamp = new Date().getTime();
        const contractName = contract.contractName.replace(/Contract$/, '');
        const tableName = this.getTableName(contract);
        const migrationName = `${timestamp}-${contractName}`;
        const migrationDir = path.resolve(process.cwd(), 'src/migrations');

        if (!fs.existsSync(migrationDir))
            fs.mkdirSync(migrationDir, { recursive: true });

        const migrationPath = path.join(migrationDir, `${migrationName}.ts`);
        const migrationContent = this.generateDropTableMigration(
            migrationName,
            tableName,
            contract,
        );

        fs.writeFileSync(migrationPath, migrationContent);

        return migrationPath;
    }

    /**
     * Generate a migration file specifically for dropping a table
     * @param className The name of the migration class
     * @param tableName The name of the table to drop
     * @param contract The original contract for recreating the table in down migration
     * @returns The contents of the migration file
     */
    private static generateDropTableMigration(
        className: string,
        tableName: string,
        contract: any,
    ): string {
        const fields = contract.fields || [];
        const indexes = contract.indexs || [];

        const upContent = `// Drop table
await queryRunner.dropTable("${tableName}");`;

        const columnDefs = fields
            .map((field) => {
                const typeMapping: any = {
                    string: 'varchar',
                    text: 'text',
                    boolean: 'boolean',
                    bool: 'boolean',
                    int32: 'int',
                    int64: 'bigint',
                    float: 'float',
                    double: 'double',
                    number: 'float',
                    date: 'date',
                    timestamp: 'timestamp',
                    time: 'time',
                    json: 'json',
                    uuid: 'uuid',
                    bigint: 'bigint',
                    simpleArray: 'simple-array',
                };

                const type = typeMapping[field.protoType] || 'varchar';
                const isArray = field.protoRepeated;

                return `{
        name: "${field.propertyKey}",
        type: "${type}",
        isArray: ${isArray},
        isNullable: ${field.nullable !== false ? 'true' : 'false'},
        isUnique: ${field.unique === true ? 'true' : 'false'},
        default: ${field.defaultValue ? JSON.stringify(field.defaultValue) : 'undefined'}
    }`;
            })
            .join(',\n            ');

        // Generate index definitions
        const indexDefs = indexes
            .map((index) => {
                const indexFields = index.fields || [];
                const options = index.options || {};

                return `{
            name: "${index.name}",
            columnNames: ${JSON.stringify(indexFields)},
            isUnique: ${options.unique ? 'true' : 'false'},
            isSpatial: ${options.spatial ? 'true' : 'false'},
            isFulltext: ${options.fulltext ? 'true' : 'false'},
            where: ${options.where ? `"${options.where}"` : 'undefined'}
        }`;
            })
            .join(',\n            ');

        // Down migration recreates the table
        const downContent = `// Recreate the dropped table
const table = new Table({
    name: "${tableName}",
    columns: [
            ${columnDefs}
    ]${
        indexes.length > 0
            ? `,
    indices: [
            ${indexDefs}
    ]`
            : ''
    }
});

await queryRunner.createTable(table);`;

        return `import { MigrationInterface, QueryRunner, Table } from "typeorm";

export class Drop${className} implements MigrationInterface {
    public async up(queryRunner: QueryRunner): Promise<void> {
${this.indentCode(upContent, 8)}
    }

    public async down(queryRunner: QueryRunner): Promise<void> {
${this.indentCode(downContent, 8)}
    }
}
`;
    }
}
