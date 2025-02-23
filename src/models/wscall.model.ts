/**
    **********************************************
    This script was generated automatically by CMMV.
    It is recommended not to modify this file manually,
    as it may be overwritten by the application.
    **********************************************
**/

import { fastJson } from '@cmmv/core';

import { Expose, instanceToPlain, plainToInstance } from '@cmmv/core';

import { IsOptional } from '@cmmv/core';

export interface IWsCall {
    contract: number;
    message: number;
    data: Uint8Array;
}

//Model
export class WsCall implements IWsCall {
    @Expose({ toClassOnly: true })
    @IsOptional()
    id: string;

    @Expose()
    contract: number;

    @Expose()
    message: number;

    @Expose()
    data: Uint8Array;

    constructor(partial: Partial<WsCall>) {
        Object.assign(this, partial);
    }

    public serialize() {
        return instanceToPlain(this);
    }

    public static fromPartial(partial: Partial<WsCall>): WsCall {
        return plainToInstance(WsCall, partial, {
            exposeUnsetFields: false,
            enableImplicitConversion: true,
            excludeExtraneousValues: true,
        });
    }

    public static fromEntity(entity: any): any {
        return plainToInstance(this, entity, {
            exposeUnsetFields: false,
            enableImplicitConversion: true,
            excludeExtraneousValues: true,
        });
    }

    public toString() {
        return WsCallFastSchema(this);
    }
}

// Schema
export const WsCallFastSchemaStructure = {
    title: 'WsCall Schema',
    type: 'object',
    properties: {
        id: {
            type: 'string',
            nullable: false,
        },
        contract: {
            type: 'integer',
            nullable: false,
        },
        message: {
            type: 'integer',
            nullable: false,
        },
        data: {
            type: 'string',
            nullable: false,
        },
    },
    required: ['id', 'contract', 'message', 'data'],
};

export const WsCallFastSchema = fastJson(WsCallFastSchemaStructure);
