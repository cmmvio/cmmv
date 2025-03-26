export declare abstract class AbstractService {
    name?: string;
    removeUndefined(obj: any): {
        [k: string]: unknown;
    };
    fixIds(item: any, subtree?: boolean): any;
    appendUser(payload: any, userId: any): any;
    appendUpdateUser(payload: any, userId: any): any;
    validate<T>(item: any, partial?: boolean): Promise<T>;
}
