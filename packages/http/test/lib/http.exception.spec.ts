import { describe, it, expect } from 'vitest';
import { HttpException, HttpStatus } from '../../lib/http.exception';

describe('HttpStatus', () => {
    describe('informational responses (1xx)', () => {
        it('should have CONTINUE = 100', () => {
            expect(HttpStatus.CONTINUE).toBe(100);
        });

        it('should have SWITCHING_PROTOCOLS = 101', () => {
            expect(HttpStatus.SWITCHING_PROTOCOLS).toBe(101);
        });

        it('should have PROCESSING = 102', () => {
            expect(HttpStatus.PROCESSING).toBe(102);
        });

        it('should have EARLYHINTS = 103', () => {
            expect(HttpStatus.EARLYHINTS).toBe(103);
        });
    });

    describe('successful responses (2xx)', () => {
        it('should have OK = 200', () => {
            expect(HttpStatus.OK).toBe(200);
        });

        it('should have CREATED = 201', () => {
            expect(HttpStatus.CREATED).toBe(201);
        });

        it('should have ACCEPTED = 202', () => {
            expect(HttpStatus.ACCEPTED).toBe(202);
        });

        it('should have NO_CONTENT = 204', () => {
            expect(HttpStatus.NO_CONTENT).toBe(204);
        });

        it('should have PARTIAL_CONTENT = 206', () => {
            expect(HttpStatus.PARTIAL_CONTENT).toBe(206);
        });
    });

    describe('redirection responses (3xx)', () => {
        it('should have AMBIGUOUS = 300', () => {
            expect(HttpStatus.AMBIGUOUS).toBe(300);
        });

        it('should have MOVED_PERMANENTLY = 301', () => {
            expect(HttpStatus.MOVED_PERMANENTLY).toBe(301);
        });

        it('should have FOUND = 302', () => {
            expect(HttpStatus.FOUND).toBe(302);
        });

        it('should have NOT_MODIFIED = 304', () => {
            expect(HttpStatus.NOT_MODIFIED).toBe(304);
        });

        it('should have TEMPORARY_REDIRECT = 307', () => {
            expect(HttpStatus.TEMPORARY_REDIRECT).toBe(307);
        });

        it('should have PERMANENT_REDIRECT = 308', () => {
            expect(HttpStatus.PERMANENT_REDIRECT).toBe(308);
        });
    });

    describe('client error responses (4xx)', () => {
        it('should have BAD_REQUEST = 400', () => {
            expect(HttpStatus.BAD_REQUEST).toBe(400);
        });

        it('should have UNAUTHORIZED = 401', () => {
            expect(HttpStatus.UNAUTHORIZED).toBe(401);
        });

        it('should have FORBIDDEN = 403', () => {
            expect(HttpStatus.FORBIDDEN).toBe(403);
        });

        it('should have NOT_FOUND = 404', () => {
            expect(HttpStatus.NOT_FOUND).toBe(404);
        });

        it('should have METHOD_NOT_ALLOWED = 405', () => {
            expect(HttpStatus.METHOD_NOT_ALLOWED).toBe(405);
        });

        it('should have CONFLICT = 409', () => {
            expect(HttpStatus.CONFLICT).toBe(409);
        });

        it('should have UNPROCESSABLE_ENTITY = 422', () => {
            expect(HttpStatus.UNPROCESSABLE_ENTITY).toBe(422);
        });

        it('should have TOO_MANY_REQUESTS = 429', () => {
            expect(HttpStatus.TOO_MANY_REQUESTS).toBe(429);
        });

        it('should have I_AM_A_TEAPOT = 418', () => {
            expect(HttpStatus.I_AM_A_TEAPOT).toBe(418);
        });
    });

    describe('server error responses (5xx)', () => {
        it('should have INTERNAL_SERVER_ERROR = 500', () => {
            expect(HttpStatus.INTERNAL_SERVER_ERROR).toBe(500);
        });

        it('should have NOT_IMPLEMENTED = 501', () => {
            expect(HttpStatus.NOT_IMPLEMENTED).toBe(501);
        });

        it('should have BAD_GATEWAY = 502', () => {
            expect(HttpStatus.BAD_GATEWAY).toBe(502);
        });

        it('should have SERVICE_UNAVAILABLE = 503', () => {
            expect(HttpStatus.SERVICE_UNAVAILABLE).toBe(503);
        });

        it('should have GATEWAY_TIMEOUT = 504', () => {
            expect(HttpStatus.GATEWAY_TIMEOUT).toBe(504);
        });
    });
});

describe('HttpException', () => {
    describe('constructor', () => {
        it('should create exception with message and status', () => {
            const exception = new HttpException(
                'Not Found',
                HttpStatus.NOT_FOUND,
            );

            expect(exception.message).toBe('Not Found');
            expect(exception.status).toBe(404);
        });

        it('should extend Error class', () => {
            const exception = new HttpException(
                'Test Error',
                HttpStatus.BAD_REQUEST,
            );

            expect(exception).toBeInstanceOf(Error);
            expect(exception).toBeInstanceOf(HttpException);
        });

        it('should have correct prototype chain', () => {
            const exception = new HttpException(
                'Test',
                HttpStatus.INTERNAL_SERVER_ERROR,
            );

            expect(Object.getPrototypeOf(exception)).toBe(
                HttpException.prototype,
            );
        });
    });

    describe('status codes', () => {
        it('should handle 400 Bad Request', () => {
            const exception = new HttpException(
                'Invalid input',
                HttpStatus.BAD_REQUEST,
            );

            expect(exception.status).toBe(400);
        });

        it('should handle 401 Unauthorized', () => {
            const exception = new HttpException(
                'Please login',
                HttpStatus.UNAUTHORIZED,
            );

            expect(exception.status).toBe(401);
        });

        it('should handle 403 Forbidden', () => {
            const exception = new HttpException(
                'Access denied',
                HttpStatus.FORBIDDEN,
            );

            expect(exception.status).toBe(403);
        });

        it('should handle 404 Not Found', () => {
            const exception = new HttpException(
                'Resource not found',
                HttpStatus.NOT_FOUND,
            );

            expect(exception.status).toBe(404);
        });

        it('should handle 500 Internal Server Error', () => {
            const exception = new HttpException(
                'Server error',
                HttpStatus.INTERNAL_SERVER_ERROR,
            );

            expect(exception.status).toBe(500);
        });
    });

    describe('toJSON', () => {
        it('should return object with statusCode and message', () => {
            const exception = new HttpException(
                'Not Found',
                HttpStatus.NOT_FOUND,
            );

            const json = exception.toJSON();

            expect(json).toEqual({
                statusCode: 404,
                message: 'Not Found',
            });
        });

        it('should serialize correctly for JSON.stringify', () => {
            const exception = new HttpException(
                'Bad Request',
                HttpStatus.BAD_REQUEST,
            );

            const serialized = JSON.stringify(exception);
            const parsed = JSON.parse(serialized);

            expect(parsed.statusCode).toBe(400);
            expect(parsed.message).toBe('Bad Request');
        });

        it('should handle empty message', () => {
            const exception = new HttpException('', HttpStatus.NO_CONTENT);

            const json = exception.toJSON();

            expect(json.message).toBe('');
            expect(json.statusCode).toBe(204);
        });

        it('should handle special characters in message', () => {
            const exception = new HttpException(
                'Error: <script>alert("xss")</script>',
                HttpStatus.BAD_REQUEST,
            );

            const json = exception.toJSON();

            expect(json.message).toBe('Error: <script>alert("xss")</script>');
        });
    });

    describe('error handling', () => {
        it('should be throwable', () => {
            expect(() => {
                throw new HttpException('Test error', HttpStatus.BAD_REQUEST);
            }).toThrow(HttpException);
        });

        it('should be catchable', () => {
            try {
                throw new HttpException(
                    'Caught error',
                    HttpStatus.INTERNAL_SERVER_ERROR,
                );
            } catch (error) {
                expect(error).toBeInstanceOf(HttpException);
                expect((error as HttpException).status).toBe(500);
            }
        });

        it('should preserve stack trace', () => {
            const exception = new HttpException(
                'Test',
                HttpStatus.BAD_REQUEST,
            );

            expect(exception.stack).toBeDefined();
            // Stack trace format varies by environment, just check it exists and has content
            expect(exception.stack!.length).toBeGreaterThan(0);
        });
    });

    describe('edge cases', () => {
        it('should handle very long messages', () => {
            const longMessage = 'a'.repeat(10000);
            const exception = new HttpException(
                longMessage,
                HttpStatus.BAD_REQUEST,
            );

            expect(exception.message).toBe(longMessage);
            expect(exception.toJSON().message).toBe(longMessage);
        });

        it('should handle unicode messages', () => {
            const exception = new HttpException(
                '错误消息 🚫',
                HttpStatus.BAD_REQUEST,
            );

            expect(exception.message).toBe('错误消息 🚫');
        });

        it('should handle newlines in messages', () => {
            const exception = new HttpException(
                'Line 1\nLine 2\nLine 3',
                HttpStatus.BAD_REQUEST,
            );

            expect(exception.message).toBe('Line 1\nLine 2\nLine 3');
        });
    });
});
