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

export interface IWsError {
    message: string;
    code: number;
    context: string;
}

//Model
export class WsError implements IWsError {
    @Expose({ toClassOnly: true })
    @IsOptional()
    id: string;

    @Expose()
    message: string;

    @Expose()
    code: number;

    @Expose()
    context: string;

    constructor(partial: Partial<WsError>) {
        Object.assign(this, partial);
    }

    public serialize() {
        return instanceToPlain(this);
    }

    public static fromPartial(partial: Partial<WsError>): WsError {
        return plainToInstance(WsError, partial, {
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
        return WsErrorFastSchema(this);
    }
}

// Schema
export const WsErrorFastSchemaStructure = {
    title: 'WsError Schema',
    type: 'object',
    properties: {
        id: {
            type: 'string',
            nullable: false,
        },
        message: {
            type: 'string',
            nullable: false,
        },
        code: {
            type: 'integer',
            nullable: false,
        },
        context: {
            type: 'string',
            nullable: false,
        },
    },
    required: ['id', 'message', 'code', 'context'],
};

export const WsErrorFastSchema = fastJson(WsErrorFastSchemaStructure);
