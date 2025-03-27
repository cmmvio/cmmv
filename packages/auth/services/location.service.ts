import { Service, AbstractService } from '@cmmv/core';

import { HttpService } from '@cmmv/http';

@Service('auth_location')
export class AuthLocationService extends AbstractService {
    constructor(private readonly httpService: HttpService) {
        super();
    }

    /**
     * Get the location
     * @param ip - The ip
     * @returns The location
     */
    public async getLocation(ip: string) {
        const ipInfo = await this.httpService.get(
            `https://ipinfo.io/${ip}/json`,
        );
        return `${ipInfo.city} - ${ipInfo.region}, ${ipInfo.country}`;
    }
}
