import * as crypto from 'node:crypto';
import * as fs from 'node:fs';
import * as path from 'node:path';

import { Config, Service, AbstractService } from '@cmmv/core';

import { HttpException, HttpStatus, CMMVRenderer } from '@cmmv/http';

import { Repository } from '@cmmv/repository';

import {
    IOAuthAuthQuery,
    IOAuthClient,
    IOAuthAutorizeBody,
    IOAuthHandlerQuery,
} from '../lib/auth.interface';

import { AuthAutorizationService } from './autorization.service';

import { AuthLocationService } from './location.service';

@Service('oauth2')
export class OAuth2Service extends AbstractService {
    constructor(
        private readonly authAutorizationService: AuthAutorizationService,
        private readonly authLocationService: AuthLocationService,
    ) {
        super();
    }

    //Login
    /**
     * @description Authenticate the user
     * @param req
     * @param res
     * @param queries
     */
    public async auth(req: any, res: any, queries: IOAuthAuthQuery) {
        const OAuthClientsEntity = Repository.getEntity('OAuthClientsEntity');

        if (!queries.client_id)
            throw new HttpException(
                'Client ID is required',
                HttpStatus.BAD_REQUEST,
            );

        if (!queries.redirect_uri)
            throw new HttpException(
                'Redirect URI is required',
                HttpStatus.BAD_REQUEST,
            );

        if (!queries.response_type)
            throw new HttpException(
                'Response Type is required',
                HttpStatus.BAD_REQUEST,
            );

        if (!queries.state)
            throw new HttpException(
                'State is required',
                HttpStatus.BAD_REQUEST,
            );

        const client = await Repository.findBy(OAuthClientsEntity, {
            clientId: queries.client_id,
        });

        if (!client)
            throw new HttpException('Client not found', HttpStatus.NOT_FOUND);

        const customTemplate = Config.get<string>('auth.templates.auth');

        const template = customTemplate
            ? customTemplate
            : path.join(__dirname, '..', 'templates', `auth.html`);

        if (!fs.existsSync(template))
            throw new HttpException('Template not found', HttpStatus.NOT_FOUND);

        const renderer = new CMMVRenderer();

        renderer.renderFile(
            template,
            {
                title: 'Login',
            },
            {},
            (err, content) => {
                if (err) {
                    console.error(err);
                    return res.status(500).send('Internal Server Error');
                }

                res.send(content);
            },
        );
    }

    /**
     * @description Authorize the user
     * @param clientId
     * @param body
     * @param user
     * @param req
     * @param res
     * @returns
     */
    public async authorize(
        clientId: string,
        body: IOAuthAutorizeBody,
        user: any,
        req: any,
        res: any,
    ) {
        const OAuthClientsEntity = Repository.getEntity('OAuthClientsEntity');
        const client = await Repository.findBy(OAuthClientsEntity, {
            clientId,
        });

        if (!client)
            throw new HttpException('Client not found', HttpStatus.NOT_FOUND);

        if (
            client.authorizedDomains.length > 0 &&
            !client.authorizedDomains.includes(req.headers.host)
        )
            throw new HttpException('Invalid domain', HttpStatus.UNAUTHORIZED);

        if (!client.redirectUris.includes(body.redirect_uri))
            throw new HttpException(
                'Invalid redirect URI',
                HttpStatus.BAD_REQUEST,
            );

        if (!body.scope.includes('read'))
            throw new HttpException('Invalid scope', HttpStatus.BAD_REQUEST);

        if (!body.state)
            throw new HttpException('Invalid state', HttpStatus.BAD_REQUEST);

        if (!client.allowedGrantTypes.includes('authorization_code')) {
            throw new HttpException(
                'Invalid grant type',
                HttpStatus.BAD_REQUEST,
            );
        }

        const code = crypto.randomBytes(32).toString('hex');

        if (
            body.response_type === 'code' &&
            client.allowedGrantTypes.includes('authorization_code')
        ) {
            //Generate the code
            const OAuthCodesEntity = Repository.getEntity('OAuthCodesEntity');
            const oauthCode = new OAuthCodesEntity();

            oauthCode.code = code;
            oauthCode.client = client.id;
            oauthCode.redirectUri = body.redirect_uri;
            oauthCode.scope = body.scope;
            oauthCode.expiresAt = Date.now() + 1000 * 60 * 10; // 10 minutes
            oauthCode.user = user.id;
            oauthCode.state = body.state;
            oauthCode.origin = body.origin;
            oauthCode.referer = body.referer;
            oauthCode.agent = body.agent;

            const resultGenerateCode = await Repository.insert(
                OAuthCodesEntity,
                oauthCode,
            );

            if (!resultGenerateCode.success)
                throw new HttpException(
                    'Failed to generate the code',
                    HttpStatus.INTERNAL_SERVER_ERROR,
                );

            //Generate the authorization
            const OAuthAutorizationsEntity = Repository.getEntity(
                'OAuthAutorizationsEntity',
            );
            const oauthAutorization = new OAuthAutorizationsEntity();

            oauthAutorization.code = code;
            oauthAutorization.client = client.id;
            oauthAutorization.user = user.id;
            oauthAutorization.scope = body.scope;
            oauthAutorization.approvedAt = Date.now();
            oauthAutorization.codeAutorization = code;
            oauthAutorization.ip = req.ip;
            oauthAutorization.location =
                req.ip !== '127.0.0.1' && req.ip !== '::1'
                    ? await this.authLocationService.getLocation(req.ip)
                    : 'locahost';
            oauthAutorization.agent = req.headers['user-agent'];

            const resultGenerateAuthorization = await Repository.insert(
                OAuthAutorizationsEntity,
                oauthAutorization,
            );

            if (!resultGenerateAuthorization.success) {
                throw new HttpException(
                    'Failed to generate the authorization',
                    HttpStatus.INTERNAL_SERVER_ERROR,
                );
            }

            return {
                code: code,
                state: body.state,
                response_type: body.response_type,
                redirect_uri: body.redirect_uri,
            };
        } else if (
            body.response_type === 'token' &&
            client.allowedGrantTypes.includes('implicit')
        ) {
            const token = await this.authAutorizationService.autorizeUser(
                user,
                req,
                res,
                null,
            );
            return token;
        } else {
            throw new HttpException(
                'Invalid response type',
                HttpStatus.BAD_REQUEST,
            );
        }
    }

    /**
     * @description Handle the authorization code
     * @param payload
     * @param req
     * @param res
     * @returns
     */
    public async handler(payload: IOAuthHandlerQuery, req: any, res: any) {
        if (!payload.code)
            throw new HttpException('Code is required', HttpStatus.BAD_REQUEST);

        if (!payload.state)
            throw new HttpException(
                'State is required',
                HttpStatus.BAD_REQUEST,
            );

        if (!payload.client_secret)
            throw new HttpException(
                'Client secret is required',
                HttpStatus.BAD_REQUEST,
            );

        const OAuthCodesEntity = Repository.getEntity('OAuthCodesEntity');
        const oauthCode = await Repository.findBy(OAuthCodesEntity, {
            code: payload.code,
            state: payload.state,
        });

        if (!oauthCode)
            throw new HttpException('Invalid code', HttpStatus.BAD_REQUEST);

        if (oauthCode.expiresAt < Date.now())
            throw new HttpException('Code expired', HttpStatus.BAD_REQUEST);

        const OAuthClientsEntity = Repository.getEntity('OAuthClientsEntity');

        const client = await Repository.findBy(
            OAuthClientsEntity,
            Repository.queryBuilder({
                id: oauthCode.clientId,
                isActive: true,
                clientSecret: payload.client_secret,
            }),
        );

        if (!client)
            throw new HttpException('Client not found', HttpStatus.NOT_FOUND);

        if (
            client.authorizedDomains.length > 0 &&
            !client.authorizedDomains.includes(req.headers.host)
        )
            throw new HttpException('Invalid domain', HttpStatus.UNAUTHORIZED);

        if (
            payload.redirect_uri &&
            !client.redirectUris.includes(payload.redirect_uri)
        )
            throw new HttpException(
                'Invalid redirect URI',
                HttpStatus.BAD_REQUEST,
            );

        if (!client.allowedGrantTypes.includes('authorization_code'))
            throw new HttpException(
                'Invalid grant type',
                HttpStatus.BAD_REQUEST,
            );

        let user: any;

        if (oauthCode.useId === '9999') {
            user = {
                id: '9999',
                username: 'root',
                root: true,
            };
        } else {
            const UserEntity = Repository.getEntity('UserEntity');

            user = await Repository.findBy(
                UserEntity,
                {
                    id: oauthCode.userId,
                    blocked: false,
                },
                {
                    select: ['id', 'username', 'root'],
                },
            );

            if (!user)
                throw new HttpException('User not found', HttpStatus.NOT_FOUND);
        }

        const OAuthTokensEntity = Repository.getEntity('OAuthTokensEntity');
        const oauthToken = new OAuthTokensEntity();

        const token = await this.authAutorizationService.autorizeUser(
            user,
            req,
            res,
            null,
        );

        oauthToken.accessToken = token.token;
        oauthToken.refreshToken = token.refreshToken;
        oauthToken.client = oauthCode.clientId;
        oauthToken.user = user.id;
        oauthToken.scope = oauthCode.scope;
        oauthToken.expiresAt =
            Date.now() + 1000 * 60 * client.accessTokenLifetime;
        oauthToken.origin = req.headers.origin;
        oauthToken.referer = req.headers.referer;
        oauthToken.agent = req.headers['user-agent'];
        oauthToken.state = oauthCode.state;

        await Repository.insert(OAuthTokensEntity, oauthToken);
        await Repository.delete(OAuthCodesEntity, { code: payload.code });

        if (payload.redirect_uri) {
            const redirectUrl = new URL(payload.redirect_uri);
            redirectUrl.searchParams.set('token', token.token);
            redirectUrl.searchParams.set('refreshToken', token.refreshToken);
            res.res.writeHead(302, { Location: redirectUrl.toString() });
            res.res.end();
        } else {
            return token;
        }
    }

    //Clients
    /**
     * @description Create a new client
     * @param newClient
     * @returns
     */
    public async createClient(newClient: IOAuthClient) {
        const OAuthClientsEntity = Repository.getEntity('OAuthClientsEntity');

        const client = new OAuthClientsEntity();
        client.clientId = crypto.randomBytes(12).toString('hex');
        client.clientSecret = crypto.randomBytes(32).toString('hex');
        client.redirectUris = newClient.redirectUris;
        client.allowedScopes = newClient.allowedScopes;
        client.isActive = newClient.isActive || true;
        client.accessTokenLifetime = newClient.accessTokenLifetime;
        client.refreshTokenLifetime = newClient.refreshTokenLifetime;
        client.clientName = newClient.clientName;
        client.authorizedDomains = newClient.authorizedDomains;
        client.allowedGrantTypes = newClient.allowedGrantTypes;

        await Repository.insert(OAuthClientsEntity, client);

        return `Client created successfully with id: ${client.clientId}`;
    }

    /**
     * @description Get a client
     * @param clientId
     * @returns
     */
    public async getClient(clientId: string) {
        const OAuthClientsEntity = Repository.getEntity('OAuthClientsEntity');

        const client = await Repository.findBy(
            OAuthClientsEntity,
            { clientId: clientId, isActive: true },
            {
                select: ['clientId', 'clientName', 'redirectUris'],
            },
        );

        if (!client)
            throw new HttpException('Client not found', HttpStatus.NOT_FOUND);

        return client;
    }

    /**
     * @description Get a client
     * @param clientId
     * @returns
     */
    public async getClientAdmin(clientId: string) {
        const OAuthClientsEntity = Repository.getEntity('OAuthClientsEntity');
        const client = await Repository.findBy(OAuthClientsEntity, {
            clientId: clientId,
        });

        if (!client)
            throw new HttpException('Client not found', HttpStatus.NOT_FOUND);

        return client;
    }

    /**
     * @description Get all clients
     * @returns
     */
    public async getClients() {
        const OAuthClientsEntity = Repository.getEntity('OAuthClientsEntity');
        const clients = await Repository.findAll(OAuthClientsEntity);
        return clients;
    }

    /**
     * @description Update a client
     * @param clientId
     * @param payload
     * @returns
     */
    public async updateClient(clientId: string, payload: IOAuthClient) {
        const OAuthClientsEntity = Repository.getEntity('OAuthClientsEntity');
        const client = await Repository.findBy(OAuthClientsEntity, {
            clientId: clientId,
        });

        if (!client)
            throw new HttpException('Client not found', HttpStatus.NOT_FOUND);

        let updateData = {
            clientName: payload.clientName,
            redirectUris: payload.redirectUris,
            allowedScopes: payload.allowedScopes,
            authorizedDomains: payload.authorizedDomains,
            allowedGrantTypes: payload.allowedGrantTypes,
            isActive: payload.isActive,
            accessTokenLifetime: payload.accessTokenLifetime,
            refreshTokenLifetime: payload.refreshTokenLifetime,
        };

        await Repository.updateOne(
            OAuthClientsEntity,
            { clientId: clientId },
            updateData,
        );

        return `Client updated successfully with id: ${clientId}`;
    }

    /**
     * @description Delete a client
     * @param clientId
     * @returns
     */
    public async deleteClient(clientId: string) {
        const OAuthClientsEntity = Repository.getEntity('OAuthClientsEntity');
        await Repository.delete(OAuthClientsEntity, { clientId: clientId });
        return `Client deleted successfully with id: ${clientId}`;
    }
}
