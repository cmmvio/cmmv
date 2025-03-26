"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.ProtobufController = void 0;
const tslib_1 = require("tslib");
const fs = require("fs");
const path = require("path");
const http_1 = require("@cmmv/http");
let ProtobufController = class ProtobufController {
    async getContract(contract, res) {
        const contractFilename = path.resolve(process.cwd(), `./src/protos/${contract}.json`);
        if (fs.existsSync(contractFilename)) {
            const contract = fs.readFileSync(contractFilename, 'utf-8');
            res.json(JSON.parse(contract));
        }
        else {
            res.status(404).send();
        }
    }
};
exports.ProtobufController = ProtobufController;
tslib_1.__decorate([
    (0, http_1.Get)(':contract', { exclude: true }),
    tslib_1.__param(0, (0, http_1.Param)('contract')),
    tslib_1.__param(1, (0, http_1.Res)()),
    tslib_1.__metadata("design:type", Function),
    tslib_1.__metadata("design:paramtypes", [Object, Object]),
    tslib_1.__metadata("design:returntype", Promise)
], ProtobufController.prototype, "getContract", null);
exports.ProtobufController = ProtobufController = tslib_1.__decorate([
    (0, http_1.Controller)('proto')
], ProtobufController);
