import { Rpc } from '@cmmv/ws';

import { OAuth2GatewayGenerated } from '@generated/gateways/auth/oauth2.gateway';

@Rpc('oauth2')
export class OAuth2Gateway extends OAuth2GatewayGenerated {}
