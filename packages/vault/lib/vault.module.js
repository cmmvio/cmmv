"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.VaultModule = void 0;
const core_1 = require("@cmmv/core");
const vault_config_1 = require("./vault.config");
const vault_controller_1 = require("./vault.controller");
const vault_contract_1 = require("./vault.contract");
const vault_service_1 = require("./vault.service");
exports.VaultModule = new core_1.Module('vault', {
    configs: [vault_config_1.VaultConfig],
    controllers: [vault_controller_1.VaultController],
    contracts: [vault_contract_1.VaultContract],
    providers: [vault_service_1.VaultService],
});
