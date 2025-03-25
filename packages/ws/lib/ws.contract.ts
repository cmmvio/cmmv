import { AbstractContract, Contract, ContractField } from '@cmmv/core';

@Contract({
    controllerName: 'WsCall',
    protoPath: 'src/protos/ws.proto',
    protoPackage: 'ws',
    directMessage: true,
    generateController: false,
    generateEntities: false,
    options: {
        moduleContract: true,
    },
})
export class WSContract extends AbstractContract {
    @ContractField({ protoType: 'int32' })
    contract: number;

    @ContractField({ protoType: 'int32' })
    message: number;

    @ContractField({ protoType: 'bytes' })
    data: Uint8Array;
}

@Contract({
    controllerName: 'WsError',
    protoPath: 'src/protos/wserror.proto',
    protoPackage: 'wserror',
    directMessage: true,
    generateController: false,
    generateEntities: false,
    options: {
        moduleContract: true,
    },
})
export class WSError extends AbstractContract {
    @ContractField({ protoType: 'string' })
    message: string;

    @ContractField({ protoType: 'int32' })
    code?: number;

    @ContractField({ protoType: 'string' })
    context?: string;
}
