import { Controller } from '@cmmv/http';

import { OAuth2ControllerGenerated } from '@generated/controllers/auth/oauth2.controller';

@Controller('oauth2')
export class OAuth2Controller extends OAuth2ControllerGenerated {}
