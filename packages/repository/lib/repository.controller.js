"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.RepositoryController = void 0;
const tslib_1 = require("tslib");
const http_1 = require("@cmmv/http");
//import { Auth } from '@cmmv/auth';
const repository_service_1 = require("./repository.service");
let RepositoryController = class RepositoryController {
    /**
     * List all databases
     * @returns { databases: string[] }
     */
    //@Auth({ rootOnly: true })
    async handlerListDatabase() {
        return repository_service_1.Repository.listDatabases();
    }
    /**
     * List all tables in a database
     * @param databaseName - The name of the database to list the tables from
     * @returns { tables: string[] }
     */
    //@Auth({ rootOnly: true })
    async handlerListTables(databaseName) {
        return repository_service_1.Repository.listTables(databaseName);
    }
};
exports.RepositoryController = RepositoryController;
tslib_1.__decorate([
    (0, http_1.Get)('list-databases', { exclude: true })
    //@Auth({ rootOnly: true })
    ,
    tslib_1.__metadata("design:type", Function),
    tslib_1.__metadata("design:paramtypes", []),
    tslib_1.__metadata("design:returntype", Promise)
], RepositoryController.prototype, "handlerListDatabase", null);
tslib_1.__decorate([
    (0, http_1.Get)('list-tables/:database', { exclude: true })
    //@Auth({ rootOnly: true })
    ,
    tslib_1.__param(0, (0, http_1.Param)('database')),
    tslib_1.__metadata("design:type", Function),
    tslib_1.__metadata("design:paramtypes", [String]),
    tslib_1.__metadata("design:returntype", Promise)
], RepositoryController.prototype, "handlerListTables", null);
exports.RepositoryController = RepositoryController = tslib_1.__decorate([
    (0, http_1.Controller)('repository')
], RepositoryController);
