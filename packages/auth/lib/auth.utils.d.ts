import { IJWTDecoded } from './auth.interface';
export declare function jwtVerify(token: string): Promise<IJWTDecoded>;
export declare function encryptJWTData(text: string, secret: string): string;
export declare function decryptJWTData(encryptedText: string, secret: string): string;
export declare function generateFingerprint(req: any, usernameHashed: any): string;
