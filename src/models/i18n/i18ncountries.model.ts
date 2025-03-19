/**
    **********************************************
    This script was generated automatically by CMMV.
    It is recommended not to modify this file manually,
    as it may be overwritten by the application.
    **********************************************
**/

import { fastJson, AbstractModel } from '@cmmv/core';

import {
    ApiSchema,
    ApiProperty,
    ApiPropertyOptional,
    ApiHideProperty,
    ApiResponseProperty,
} from '@cmmv/openapi';

import { ObjectType, Field, ID, Int, Float } from '@cmmv/graphql';

import { Expose, instanceToPlain, plainToInstance, Type } from '@cmmv/core';

import { IsOptional, IsNotEmpty } from '@cmmv/core';

export interface II18NCountries {
    id?: any;
    name?: string;
    iso?: string;
    alpha3: string;
    numeric: number;
    ddi: string;
    phoneMask: string;
}

//Model
@ApiSchema({ name: 'I18NCountries' })
@ObjectType()
export class I18NCountries extends AbstractModel implements II18NCountries {
    @ApiResponseProperty({ type: String }) //OpenAPI
    @Field((type) => ID) //GraphQL
    @Expose({ toClassOnly: true })
    @IsOptional()
    readonly id!: string;

    @Expose()
    @ApiPropertyOptional({
        type: String,
        readOnly: undefined,
        default: undefined,
    })
    @Field(() => String, { nullable: true })
    name?: string;

    @Expose()
    @ApiPropertyOptional({
        type: String,
        readOnly: undefined,
        default: undefined,
    })
    @Field(() => String, { nullable: true })
    iso?: string;

    @Expose()
    @IsNotEmpty()
    @ApiProperty({
        type: String,
        readOnly: undefined,
        required: true,
        default: undefined,
    })
    @Field(() => String, { nullable: false })
    alpha3: string;

    @Expose()
    @ApiProperty({
        type: Number,
        readOnly: undefined,
        required: true,
        default: undefined,
    })
    @Field(() => Number, { nullable: false })
    numeric: number;

    @Expose()
    @ApiProperty({
        type: String,
        readOnly: undefined,
        required: true,
        default: undefined,
    })
    @Field(() => String, { nullable: false })
    ddi: string;

    @Expose()
    @ApiProperty({
        type: String,
        readOnly: undefined,
        required: true,
        default: undefined,
    })
    @Field(() => String, { nullable: false })
    phoneMask: string;

    constructor(partial: Partial<I18NCountries>) {
        super();
        Object.assign(this, partial);
    }

    public static fromPartial(partial: Partial<I18NCountries>): I18NCountries {
        return plainToInstance(I18NCountries, partial, {
            exposeUnsetFields: false,
            enableImplicitConversion: true,
            excludeExtraneousValues: true,
        });
    }

    public static fromEntity(entity: any): any {
        return this.sanitizeEntity(I18NCountries, entity);
    }

    public toString() {
        return I18NCountriesFastSchema(this);
    }
}

// Schema
export const I18NCountriesFastSchemaStructure = {
    title: 'I18NCountries Schema',
    type: 'object',
    properties: {
        id: {
            type: 'string',
            nullable: false,
        },
        name: {
            type: 'string',
            nullable: true,
        },
        iso: {
            type: 'string',
            nullable: true,
        },
        alpha3: {
            type: 'string',
            nullable: false,
        },
        numeric: {
            type: 'integer',
            nullable: false,
        },
        ddi: {
            type: 'string',
            nullable: false,
        },
        phoneMask: {
            type: 'string',
            nullable: false,
        },
    },
    required: ['id', 'alpha3', 'numeric', 'ddi', 'phoneMask'],
};

export const I18NCountriesFastSchema = fastJson(
    I18NCountriesFastSchemaStructure,
);
