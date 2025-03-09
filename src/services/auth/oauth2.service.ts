import { Service } from '@cmmv/core';

import { OAuth2ServiceGenerated } from '@generated/services/auth/oauth2.service';

@Service('oauth2')
export class OAuth2Service extends OAuth2ServiceGenerated {}
