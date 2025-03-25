import { HttpException, HttpStatus } from '@cmmv/http';

export const throttlerMessage = 'ThrottlerException: Too Many Requests';

export class ThrottlerException extends HttpException {
    constructor(message: string = throttlerMessage) {
        super(message, HttpStatus.TOO_MANY_REQUESTS);
    }
}
