"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.AuthTranspile = void 0;
const fs = require("node:fs");
const path = require("node:path");
const core_1 = require("@cmmv/core");
class AuthTranspile {
    constructor() {
        this.logger = new core_1.Logger('AuthTranspile');
    }
    run() {
        const hasWs = core_1.Module.hasModule('ws');
        //if (hasWs) this.generateWebSocketIntegration();
    }
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
        core_1.Application.appModule.providers.push({
            name: 'AuthGateway',
            path: `@gateways/auth/auth.gateway`,
        });
    }
    async mapperRoles() { }
}
exports.AuthTranspile = AuthTranspile;
