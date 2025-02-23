/**
    **********************************************
    This script was generated automatically by CMMV.
    It is recommended not to modify this file manually,
    as it may be overwritten by the application.
    **********************************************
**/

import { fastJson } from '@cmmv/core';
import { ObjectId } from '@cmmv/repository';

import { Expose, instanceToPlain, plainToInstance } from '@cmmv/core';

import {
    IsOptional,
    IsString,
    MinLength,
    MaxLength,
    IsNotEmpty,
} from '@cmmv/core';

export interface IGroups {
    _id?: ObjectId;
    name: string;
    roles?: string[];
}

//Model
export class Groups implements IGroups {
    @Expose({ toClassOnly: true })
    @IsOptional()
    id: string;

    @Expose()
    @IsNotEmpty()
    @IsString({ message: 'Invalid name' })
    @MinLength(3, { message: 'Invalid name' })
    @MaxLength(40, { message: 'Invalid name' })
    name: string;

    @Expose()
    roles?: string[] = [];

    constructor(partial: Partial<Groups>) {
        Object.assign(this, partial);
    }

    public serialize() {
        return instanceToPlain(this);
    }

    public static fromPartial(partial: Partial<Groups>): Groups {
        return plainToInstance(Groups, partial, {
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
        return GroupsFastSchema(this);
    }
}

// Schema
export const GroupsFastSchemaStructure = {
    title: 'Groups Schema',
    type: 'object',
    properties: {
        id: {
            type: 'string',
            nullable: false,
        },
        name: {
            type: 'string',
            nullable: false,
        },
        roles: {
            type: 'array',
            nullable: true,
            items: {
                type: 'string',
            },
        },
    },
    required: ['id', 'name'],
};

export const GroupsFastSchema = fastJson(GroupsFastSchemaStructure);
