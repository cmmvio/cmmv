import { Service, AbstractService } from '@cmmv/core';

import { HttpService } from '@cmmv/http';

@Service('auth_recaptcha')
export class AuthRecaptchaService extends AbstractService {
    constructor(private readonly httpService: HttpService) {
        super();
    }

    /**
     * Validate a recaptcha
     * @param secret - The secret
     * @param validation - The validation
     * @returns The success
     */
    public async validateRecaptcha(
        secret: string,
        validation: string,
    ): Promise<boolean> {
        try {
            const response = await fetch(
                `https://www.google.com/recaptcha/api/siteverify?secret=${secret}&response=${validation}`,
                { method: 'POST' },
            );

            const data = await response.json();
            return data.success === true;
        } catch (error) {
            return false;
        }
    }
}
