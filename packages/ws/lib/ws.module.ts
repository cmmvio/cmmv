import { Module } from '@cmmv/core';

import { RPCConfig } from './rpc.config';
import { WSTranspile } from './ws.transpile';
import { WSContract, WSError } from './ws.contract';

export const WSModule = new Module('ws', {
    configs: [RPCConfig],
    contracts: [WSContract, WSError],
    transpilers: [WSTranspile],
});
