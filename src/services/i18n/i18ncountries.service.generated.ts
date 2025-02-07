/**                                                                               
    **********************************************
    This script was generated automatically by CMMV.
    It is recommended not to modify this file manually, 
    as it may be overwritten by the application.
    **********************************************
**/

import { ObjectId } from 'mongodb';
import { validate } from 'class-validator';

import { Telemetry, Logger } from '@cmmv/core';

import {
    Repository,
    IFindResponse,
    AbstractRepositoryService,
} from '@cmmv/repository';

import {
    I18nCountries,
    II18nCountries,
} from '@models/i18n/i18ncountries.model';

import { I18nCountriesEntity } from '@entities/i18n/i18ncountries.entity';

export class I18nCountriesServiceGenerated extends AbstractRepositoryService {
    protected logger: Logger = new Logger('I18nCountriesServiceGenerated');

    async getAll(queries?: any, req?: any): Promise<IFindResponse> {
        try {
            let result = await Repository.findAll(I18nCountriesEntity, queries);
            result = this.fixIds(result);

            if (!result) throw new Error('Unable to return a valid result.');

            return {
                count: result.count,
                pagination: result.pagination,
                data:
                    result && result.data.length > 0
                        ? result.data.map(item =>
                              I18nCountries.fromEntity(item),
                          )
                        : [],
            };
        } catch (e) {
            console.log(e);
            this.logger.error(e);
            return null;
        }
    }

    async getById(id: string, req?: any): Promise<IFindResponse> {
        try {
            let result = await Repository.findBy(I18nCountriesEntity, {
                _id: new ObjectId(id),
            });
            result = this.fixIds(result);

            if (!result) throw new Error('Unable to return a valid result.');

            return {
                count: 1,
                pagination: {
                    limit: 1,
                    offset: 0,
                    search: id,
                    searchField: 'id',
                    sortBy: 'id',
                    sort: 'asc',
                    filters: {},
                },
                data: I18nCountries.fromEntity(result.data),
            };
        } catch (e) {
            return null;
        }
    }

    async insert(
        item: Partial<I18nCountries>,
        req?: any,
    ): Promise<I18nCountries> {
        try {
            let newItem: any = this.extraData(
                I18nCountries.fromPartial(item),
                req,
            );
            const validatedData = await this.validate(newItem);
            const result: any = await Repository.insert<I18nCountriesEntity>(
                I18nCountriesEntity,
                validatedData,
            );

            if (!result.success)
                throw new Error(result.message || 'Insert operation failed');

            const dataFixed = this.fixIds(result.data);
            return I18nCountries.fromEntity(dataFixed);
        } catch (error) {
            throw new Error(error.message || 'Error inserting item');
        }
    }

    async update(
        id: string,
        item: Partial<I18nCountries>,
        req?: any,
    ): Promise<{ success: boolean; affected: number }> {
        return new Promise(async (resolve, reject) => {
            try {
                let updateItem: any = I18nCountries.fromPartial(item);

                this.validate(updateItem)
                    .then(async (data: any) => {
                        const userId: string = req.user?.id;

                        if (typeof userId === 'string') {
                            try {
                                data.userLastUpdate = new ObjectId(userId);
                            } catch {}
                        }

                        const result = await Repository.update(
                            I18nCountriesEntity,
                            new ObjectId(id),
                            {
                                ...data,
                                updatedAt: new Date(),
                            },
                        );

                        resolve({ success: result > 0, affected: result });
                    })
                    .catch(error => {
                        console.log(error);
                        reject(error);
                    });
            } catch (e) {
                reject({ success: false, affected: 0 });
            }
        });
    }

    async delete(
        id: string,
        req?: any,
    ): Promise<{ success: boolean; affected: number }> {
        try {
            const result = await Repository.delete(
                I18nCountriesEntity,
                new ObjectId(id),
            );

            return { success: result > 0, affected: result };
        } catch (e) {
            return { success: false, affected: 0 };
        }
    }
}
