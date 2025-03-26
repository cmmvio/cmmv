import { AbstractService } from '@cmmv/core';
import { HttpService } from '@cmmv/http';
export declare class AuthRecaptchaService extends AbstractService {
    private readonly httpService;
    constructor(httpService: HttpService);
    validateRecaptcha(secret: string, validation: string): Promise<boolean>;
}
