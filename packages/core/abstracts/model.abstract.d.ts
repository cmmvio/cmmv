export declare class AbstractModel {
    serialize(): Record<string, any>;
    static sanitizeEntity<T>(ModelClass: new (partial: Partial<any>) => T, entity: any): T;
    static fromEntity(entity: any): any;
    static fromEntities(entities: Array<any>): Array<any>;
    afterValidation(item: this): this;
}
