import { Rpc } from '@cmmv/ws';

import { I18NCountriesGatewayGenerated } from '@generated/gateways/i18n/i18ncountries.gateway';

@Rpc('i18ncountries')
export class I18NCountriesGateway extends I18NCountriesGatewayGenerated {}
