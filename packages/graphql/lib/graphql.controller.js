"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.GraphQLController = void 0;
const tslib_1 = require("tslib");
const http_1 = require("@cmmv/http");
const graphql_service_1 = require("./graphql.service");
let GraphQLController = class GraphQLController {
    constructor(graphQLService) {
        this.graphQLService = graphQLService;
    }
    async handlerGraphQL(data) { }
};
exports.GraphQLController = GraphQLController;
tslib_1.__decorate([
    (0, http_1.Get)({ exclude: true }),
    tslib_1.__param(0, (0, http_1.Body)()),
    tslib_1.__metadata("design:type", Function),
    tslib_1.__metadata("design:paramtypes", [Object]),
    tslib_1.__metadata("design:returntype", Promise)
], GraphQLController.prototype, "handlerGraphQL", null);
exports.GraphQLController = GraphQLController = tslib_1.__decorate([
    (0, http_1.Controller)('graphql'),
    tslib_1.__metadata("design:paramtypes", [graphql_service_1.GraphQLService])
], GraphQLController);
