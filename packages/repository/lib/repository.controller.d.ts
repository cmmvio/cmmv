export declare class RepositoryController {
    /**
     * List all databases
     * @returns { databases: string[] }
     */
    handlerListDatabase(): Promise<{
        databases: string[];
    }>;
    /**
     * List all tables in a database
     * @param databaseName - The name of the database to list the tables from
     * @returns { tables: string[] }
     */
    handlerListTables(databaseName: string): Promise<{
        tables: string[];
    }>;
}
