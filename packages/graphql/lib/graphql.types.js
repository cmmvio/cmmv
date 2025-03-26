"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.PaginationArgs = exports.PaginationResponse = void 0;
const tslib_1 = require("tslib");
const type_graphql_1 = require("type-graphql");
const graphql_type_json_1 = require("graphql-type-json");
let PaginationResponse = class PaginationResponse {
};
exports.PaginationResponse = PaginationResponse;
tslib_1.__decorate([
    (0, type_graphql_1.Field)(() => type_graphql_1.Int, {
        description: 'Maximum number of items to be returned per page. Default: 10.',
    }),
    tslib_1.__metadata("design:type", Number)
], PaginationResponse.prototype, "limit", void 0);
tslib_1.__decorate([
    (0, type_graphql_1.Field)(() => type_graphql_1.Int, {
        description: 'Number of items to be skipped before returning results. Default: 0.',
    }),
    tslib_1.__metadata("design:type", Number)
], PaginationResponse.prototype, "offset", void 0);
tslib_1.__decorate([
    (0, type_graphql_1.Field)({
        description: "Field used to sort the results. Default: 'id'.",
    }),
    tslib_1.__metadata("design:type", String)
], PaginationResponse.prototype, "sortBy", void 0);
tslib_1.__decorate([
    (0, type_graphql_1.Field)({
        description: "Sorting order: 'asc' (ascending) or 'desc' (descending). Default: 'asc'.",
    }),
    tslib_1.__metadata("design:type", String)
], PaginationResponse.prototype, "sort", void 0);
tslib_1.__decorate([
    (0, type_graphql_1.Field)({
        description: 'Search term to filter results.',
        nullable: true,
    }),
    tslib_1.__metadata("design:type", String)
], PaginationResponse.prototype, "search", void 0);
tslib_1.__decorate([
    (0, type_graphql_1.Field)({
        description: 'Specific field where the search should be applied.',
        nullable: true,
    }),
    tslib_1.__metadata("design:type", String)
], PaginationResponse.prototype, "searchField", void 0);
tslib_1.__decorate([
    (0, type_graphql_1.Field)(() => graphql_type_json_1.default, {
        description: 'Flexible filter object where the key is the field name and the value is the filter condition.',
        nullable: true,
    }),
    tslib_1.__metadata("design:type", Object)
], PaginationResponse.prototype, "filters", void 0);
exports.PaginationResponse = PaginationResponse = tslib_1.__decorate([
    (0, type_graphql_1.ObjectType)()
], PaginationResponse);
let PaginationArgs = class PaginationArgs {
};
exports.PaginationArgs = PaginationArgs;
tslib_1.__decorate([
    (0, type_graphql_1.Field)(() => type_graphql_1.Int, {
        description: 'Maximum number of items to be returned per page. Default: 10.',
        nullable: true,
        defaultValue: 10,
    }),
    tslib_1.__metadata("design:type", Number)
], PaginationArgs.prototype, "limit", void 0);
tslib_1.__decorate([
    (0, type_graphql_1.Field)({
        description: 'Number of items to be skipped before returning results. Default: 0.',
        nullable: true,
        defaultValue: 0,
    }),
    tslib_1.__metadata("design:type", Number)
], PaginationArgs.prototype, "offset", void 0);
tslib_1.__decorate([
    (0, type_graphql_1.Field)({
        description: "Field used to sort the results. Default: 'id'.",
        nullable: true,
        defaultValue: 'id',
    }),
    tslib_1.__metadata("design:type", String)
], PaginationArgs.prototype, "sortBy", void 0);
tslib_1.__decorate([
    (0, type_graphql_1.Field)({
        description: "Sorting order: 'asc' (ascending) or 'desc' (descending). Default: 'asc'.",
        nullable: true,
        defaultValue: 'asc',
    }),
    tslib_1.__metadata("design:type", String)
], PaginationArgs.prototype, "sort", void 0);
tslib_1.__decorate([
    (0, type_graphql_1.Field)({
        description: 'Search term to filter results.',
        nullable: true,
    }),
    tslib_1.__metadata("design:type", String)
], PaginationArgs.prototype, "search", void 0);
tslib_1.__decorate([
    (0, type_graphql_1.Field)({
        description: 'Specific field where the search should be applied.',
        nullable: true,
    }),
    tslib_1.__metadata("design:type", String)
], PaginationArgs.prototype, "searchField", void 0);
tslib_1.__decorate([
    (0, type_graphql_1.Field)(() => graphql_type_json_1.default, {
        description: 'Flexible filter object where the key is the field name and the value is the filter condition.',
        nullable: true,
    }),
    tslib_1.__metadata("design:type", Object)
], PaginationArgs.prototype, "filters", void 0);
exports.PaginationArgs = PaginationArgs = tslib_1.__decorate([
    (0, type_graphql_1.ArgsType)()
], PaginationArgs);
