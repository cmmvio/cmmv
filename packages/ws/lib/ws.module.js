"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.WSModule = void 0;
const core_1 = require("@cmmv/core");
const rpc_config_1 = require("./rpc.config");
const ws_transpile_1 = require("./ws.transpile");
const ws_contract_1 = require("./ws.contract");
exports.WSModule = new core_1.Module('ws', {
    configs: [rpc_config_1.RPCConfig],
    contracts: [ws_contract_1.WSContract, ws_contract_1.WSError],
    transpilers: [ws_transpile_1.WSTranspile],
});
