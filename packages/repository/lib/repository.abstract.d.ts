import { AbstractService } from '@cmmv/core';
import { RepositorySchema } from './repository.service';
export declare abstract class AbstractRepositoryService extends AbstractService {
    /**
     * The schema of the repository
     */
    protected schema: RepositorySchema<any, any>;
    /**
     * Fix the IDs for the repository
     * @param item - The item to fix the IDs for
     * @param subtree - Whether to fix the IDs for the subtree
     * @returns The item with the fixed IDs
     */
    fixIds(item: any, subtree?: boolean): any;
    /**
     * Convert a partial model to a model
     * @param model - The model to convert
     * @param data - The data to convert
     * @param req - The request object
     * @returns The converted model
     */
    protected fromPartial<T>(model: any, data: any, req: any): T;
    /**
     * Convert a data to a model
     * @param model - The model to convert
     * @param data - The data to convert
     * @returns The converted model
     */
    protected toModel(model: any, data: any): any;
    /**
     * Extra the data
     * @param newItem - The new item
     * @param req - The request object
     * @returns The extra data
     */
    protected extraData(newItem: any, req: any): any;
}
