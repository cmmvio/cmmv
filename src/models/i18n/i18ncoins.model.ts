/**                                                                               
    **********************************************
    This script was generated automatically by CMMV.
    It is recommended not to modify this file manually, 
    as it may be overwritten by the application.
    **********************************************
**/

import * as fastJson from 'fast-json-stringify';
import { ObjectId } from 'mongodb';

import { Expose, instanceToPlain, plainToClass } from 'class-transformer';

import { IsString, IsNotEmpty } from 'class-validator';

export interface II18nCoins {
    _id?: ObjectId;
    code: string;
    name: string;
    format: string;
}

//Model
export class I18nCoins implements II18nCoins {
    @Expose()
    _id?: ObjectId;

    @Expose({ toClassOnly: true })
    id: string;

    @Expose()
    @IsString({ message: 'Invalid currency code' })
    @IsNotEmpty({ message: 'Currency code is required' })
    code: string;

    @Expose()
    @IsString({ message: 'Invalid currency name' })
    @IsNotEmpty({ message: 'Currency name is required' })
    name: string;

    @Expose()
    @IsString({ message: 'Invalid format' })
    format: string;

    constructor(partial: Partial<I18nCoins>) {
        Object.assign(this, partial);
    }

    public serialize() {
        return instanceToPlain(this);
    }

    public static toClass(partial: Partial<I18nCoins>): I18nCoins {
        return plainToClass(I18nCoins, partial, {
            exposeUnsetFields: false,
            enableImplicitConversion: true,
            excludeExtraneousValues: true,
        });
    }

    public toString() {
        return I18nCoinsFastSchema(this);
    }
}

// Schema for fast-json-stringify
export const I18nCoinsFastSchemaStructure = {
    title: 'I18nCoins Schema',
    type: 'object',
    properties: {
        code: {
            type: 'string',
            nullable: false,
        },
        name: {
            type: 'string',
            nullable: false,
        },
        format: {
            type: 'string',
            nullable: false,
        },
    },
    required: ['code', 'name', 'format'],
};

export const I18nCoinsFastSchema = fastJson(I18nCoinsFastSchemaStructure);
