import { ITranspile } from '@cmmv/core';
export declare class AuthTranspile implements ITranspile {
    private logger;
    run(): void;
    generateWebSocketIntegration(): Promise<void>;
    mapperRoles(): Promise<void>;
}
