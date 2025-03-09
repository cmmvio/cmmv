import { Config } from '@cmmv/core';

import {
    Controller,
    Post,
    Get,
    Delete,
    Body,
    Request,
    Response,
    Param,
    Query,
} from '@cmmv/http';

import { Auth } from '../lib/auth.decorator';

@Controller('oauth2')
export class OAuth2Controller {
    //constructor(private readonly oauth2Service: OAuth2Service) {}
}
