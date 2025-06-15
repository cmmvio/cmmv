import * as fs from 'node:fs';
import * as path from 'node:path';

import {
    Application,
    Config,
    ITranspile,
    Logger,
    Module,
    Scope,
    IContract,
    ServiceRegistry,
} from '@cmmv/core';

export class AuthTranspile implements ITranspile {
    private logger: Logger = new Logger('AuthTranspile');

    run(): void {
        const hasWs = Module.hasModule('ws');
        //if (hasWs) this.generateWebSocketIntegration();
    }

    /**
     * Generate the web socket integration
     */
    async generateWebSocketIntegration() {
        const outputDir = path.resolve(process.cwd(), './src/gateways/auth');
        const wsFileName = `auth.gateway.ts`;

        const wsTemplate = `/**
    **********************************************
    This script was generated automatically by CMMV.
    It is recommended not to modify this file manually,
    as it may be overwritten by the application.
    **********************************************
**/

import { Rpc, Message, Data, Socket, RpcUtils } from "@cmmv/ws";
import { AuthService } from "@services/auth/auth.service";

import {
    LoginRequest,
    RegisterRequest
} from "@models/auth/user.model";

@Rpc("auth")
export class AuthGateway {
    constructor(private readonly authService: AuthService) {}

    @Message("LoginRequest")
    async login(@Data() data: LoginRequest, @Socket() socket) {
        try{
            const { result } = await this.authService.login(data);
            const response = await RpcUtils.pack("auth", "LoginResponse", result);

            if(response)
                socket.send(response);
        }
        catch(e){
            return null;
        }
    }

    @Message("RegisterRequest")
    async register(@Data() data: RegisterRequest, @Socket() socket) {
        try{
            const result = await this.authService.register(data);
            const response = await RpcUtils.pack("auth", "RegisterResponse", result);

            if(response)
                socket.send(response);
        }
        catch(e){
            return null;
        }
    }
}`;

        if (!fs.existsSync(outputDir))
            fs.mkdirSync(outputDir, { recursive: true });

        const outputFilePath = path.join(outputDir, wsFileName);
        fs.writeFileSync(outputFilePath, wsTemplate, 'utf8');

        Application.appModule.providers.push({
            name: 'AuthGateway',
            path: `@gateways/auth/auth.gateway`,
        });
    }

    /**
     * Mapper roles
     */
    async mapperRoles() {}
}
