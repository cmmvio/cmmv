/**
    **********************************************
    This script was generated automatically by CMMV.
    It is recommended not to modify this file manually,
    as it may be overwritten by the application.
    **********************************************
**/

import {
    Resolver,
    Query,
    Mutation,
    Authorized,
    Arg,
    Args,
    ID,
    Int,
    Float,
    Ctx,
    Field,
    ArgsType,
    ObjectType,
    PaginationArgs,
    GraphQLContext,
    PaginationResponse,
} from '@cmmv/graphql';

import {
    II18NCountries,
    I18NCountries,
} from '@models/i18n/i18ncountries.model';

import { I18NCountriesService } from '@services/i18n/i18ncountries.service';

@ArgsType()
class CreateI18NCountriesInput {
    @Field(() => String, {
        nullable: true,
    })
    name?: String;

    @Field(() => String, {
        nullable: true,
    })
    iso?: String;

    @Field(() => String, {
        nullable: false,
    })
    alpha3: String;

    @Field(() => Number, {
        nullable: false,
    })
    numeric: Number;

    @Field(() => String, {
        nullable: false,
    })
    ddi: String;

    @Field(() => String, {
        nullable: false,
    })
    phoneMask: String;
}

@ArgsType()
class UpdateI18NCountriesInput {
    @Field(() => ID)
    id: string;

    @Field(() => String, {
        nullable: true,
    })
    name?: String;

    @Field(() => String, {
        nullable: true,
    })
    iso?: String;

    @Field(() => String, {
        nullable: false,
    })
    alpha3: String;

    @Field(() => Number, {
        nullable: false,
    })
    numeric: Number;

    @Field(() => String, {
        nullable: false,
    })
    ddi: String;

    @Field(() => String, {
        nullable: false,
    })
    phoneMask: String;
}

@ObjectType()
class PaginationI18NCountriesReturn {
    @Field(() => Int, {
        description: 'Total number of records available in the dataset.',
        nullable: false,
    })
    count!: number;

    @Field(() => [I18NCountries], {
        description: 'List of user records for the current page.',
        nullable: false,
    })
    data?: I18NCountries[];

    @Field(() => PaginationResponse, {
        description: 'Pagination metadata, including page information.',
        nullable: false,
    })
    pagination!: PaginationResponse;
}

@Resolver((of) => I18NCountries)
export class I18NCountriesResolverGenerated {
    private readonly i18ncountriesservice: I18NCountriesService;

    constructor() {
        this.i18ncountriesservice = new I18NCountriesService();
    }

    @Query((returns) => PaginationI18NCountriesReturn)
    @Authorized('i18ncountries:get')
    async i18ncountriesFind(
        @Args() queries: PaginationArgs,
        @Ctx() ctx: GraphQLContext,
    ) {
        return await this.i18ncountriesservice.getAll(queries, ctx.req);
    }

    @Query((returns) => I18NCountries)
    @Authorized('i18ncountries:get')
    async i18ncountriesById(@Arg('id') id: string) {
        return (await this.i18ncountriesservice.getById(id)).data;
    }

    @Mutation((returns) => I18NCountries)
    @Authorized('i18ncountries:insert')
    async createI18NCountries(
        @Args() createI18NCountriesData: CreateI18NCountriesInput,
    ): Promise<I18NCountries> {
        return (
            await this.i18ncountriesservice.insert(
                createI18NCountriesData as Partial<I18NCountries>,
            )
        ).data;
    }

    @Mutation((returns) => Boolean)
    @Authorized('i18ncountries:update')
    async updateI18NCountries(
        @Args() updateI18NCountriesData: UpdateI18NCountriesInput,
    ): Promise<Boolean> {
        return (
            await this.i18ncountriesservice.update(
                updateI18NCountriesData.id,
                updateI18NCountriesData as Partial<I18NCountries>,
            )
        ).success;
    }

    @Mutation((returns) => Boolean)
    @Authorized('i18ncountries:delete')
    async deleteI18NCountries(@Arg('id') id: string): Promise<boolean> {
        return (await this.i18ncountriesservice.delete(id)).success;
    }
}
