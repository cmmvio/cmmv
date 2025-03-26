"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.ProtobufModuleCompiler = exports.ProtobufModule = void 0;
const core_1 = require("@cmmv/core");
const protobuf_controller_1 = require("./protobuf.controller");
const protobuf_transpiler_1 = require("./protobuf.transpiler");
exports.ProtobufModule = new core_1.Module('protobuf', {
    controllers: [protobuf_controller_1.ProtobufController],
    transpilers: [protobuf_transpiler_1.ProtobufTranspile],
});
exports.ProtobufModuleCompiler = new core_1.Module('protobuf', {
    transpilers: [protobuf_transpiler_1.ProtobufTranspile],
});
