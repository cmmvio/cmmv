import { Controller, Get, Param } from '@cmmv/http';

//import { Auth } from '@cmmv/auth';
import { Repository } from './repository.service';

@Controller('repository')
export class RepositoryController {
    @Get('list-databases')
    //@Auth({ rootOnly: true })
    async handlerListDatabase() {
        return Repository.listDatabases();
    }

    @Get('list-tables/:database')
    //@Auth({ rootOnly: true })
    async handlerListTables(@Param('database') databaseName: string) {
        return Repository.listTables(databaseName);
    }
}
