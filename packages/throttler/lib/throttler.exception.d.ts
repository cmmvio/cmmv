import { HttpException } from '@cmmv/http';
export declare const throttlerMessage = "ThrottlerException: Too Many Requests";
export declare class ThrottlerException extends HttpException {
    constructor(message?: string);
}
