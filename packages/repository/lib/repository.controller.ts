import { Controller, Get, Param } from '@cmmv/http';

//import { Auth } from '@cmmv/auth';
import { Repository } from './repository.service';

@Controller('repository')
export class RepositoryController {
    /**
     * List all databases
     * @returns { databases: string[] }
     */
    @Get('list-databases', { exclude: true })
    //@Auth({ rootOnly: true })
    async handlerListDatabase() {
        return Repository.listDatabases();
    }

    /**
     * List all tables in a database
     * @param databaseName - The name of the database to list the tables from
     * @returns { tables: string[] }
     */
    @Get('list-tables/:database', { exclude: true })
    //@Auth({ rootOnly: true })
    async handlerListTables(@Param('database') databaseName: string) {
        return Repository.listTables(databaseName);
    }
}
