import { vi } from 'vitest';

/**
 * Mock de HttpStatus (http.exception.ts)
 */
export enum HttpStatus {
    CONTINUE = 100,
    SWITCHING_PROTOCOLS = 101,
    PROCESSING = 102,
    EARLYHINTS = 103,
    OK = 200,
    CREATED = 201,
    ACCEPTED = 202,
    NON_AUTHORITATIVE_INFORMATION = 203,
    NO_CONTENT = 204,
    RESET_CONTENT = 205,
    PARTIAL_CONTENT = 206,
    MULTI_STATUS = 207,
    ALREADY_REPORTED = 208,
    CONTENT_DIFFERENT = 210,
    AMBIGUOUS = 300,
    MOVED_PERMANENTLY = 301,
    FOUND = 302,
    SEE_OTHER = 303,
    NOT_MODIFIED = 304,
    TEMPORARY_REDIRECT = 307,
    PERMANENT_REDIRECT = 308,
    BAD_REQUEST = 400,
    UNAUTHORIZED = 401,
    PAYMENT_REQUIRED = 402,
    FORBIDDEN = 403,
    NOT_FOUND = 404,
    METHOD_NOT_ALLOWED = 405,
    NOT_ACCEPTABLE = 406,
    PROXY_AUTHENTICATION_REQUIRED = 407,
    REQUEST_TIMEOUT = 408,
    CONFLICT = 409,
    GONE = 410,
    LENGTH_REQUIRED = 411,
    PRECONDITION_FAILED = 412,
    PAYLOAD_TOO_LARGE = 413,
    URI_TOO_LONG = 414,
    UNSUPPORTED_MEDIA_TYPE = 415,
    REQUESTED_RANGE_NOT_SATISFIABLE = 416,
    EXPECTATION_FAILED = 417,
    I_AM_A_TEAPOT = 418,
    MISDIRECTED = 421,
    UNPROCESSABLE_ENTITY = 422,
    LOCKED = 423,
    FAILED_DEPENDENCY = 424,
    PRECONDITION_REQUIRED = 428,
    TOO_MANY_REQUESTS = 429,
    UNRECOVERABLE_ERROR = 456,
    INTERNAL_SERVER_ERROR = 500,
    NOT_IMPLEMENTED = 501,
    BAD_GATEWAY = 502,
    SERVICE_UNAVAILABLE = 503,
    GATEWAY_TIMEOUT = 504,
    HTTP_VERSION_NOT_SUPPORTED = 505,
    INSUFFICIENT_STORAGE = 507,
    LOOP_DETECTED = 508,
}

/**
 * Mock de HttpException (http.exception.ts)
 */
export class MockHttpException extends Error {
    public status: number;

    constructor(message: string, status: HttpStatus) {
        super(message);
        this.status = status;
        Object.setPrototypeOf(this, MockHttpException.prototype);
    }

    toJSON() {
        return {
            statusCode: this.status,
            message: this.message,
        };
    }

    public static reset(): void {
        // Não há nada para resetar nesta classe
    }
}

/**
 * Mock de HTTP Utils (http.utils.ts)
 */
export class MockHttpUtils {
    public static generateFingerprint = vi
        .fn()
        .mockImplementation((req, usernameHashed) => {
            return (
                'mock-fingerprint-' +
                Math.random().toString(36).substring(2, 15)
            );
        });

    public static reset(): void {
        MockHttpUtils.generateFingerprint.mockReset();
        MockHttpUtils.generateFingerprint.mockImplementation(
            (req, usernameHashed) => {
                return (
                    'mock-fingerprint-' +
                    Math.random().toString(36).substring(2, 15)
                );
            },
        );
    }
}

/**
 * Mock de HTTP Schema (http.schema.ts)
 */
export class MockHttpSchema {
    public static ResponseSchema = vi.fn().mockImplementation((data) => {
        return JSON.stringify(data);
    });

    public static reset(): void {
        MockHttpSchema.ResponseSchema.mockReset();
        MockHttpSchema.ResponseSchema.mockImplementation((data) => {
            return JSON.stringify(data);
        });
    }
}

/**
 * Interfaces para HTTP (http.interface.ts)
 */
export interface IResponse<T = undefined> {
    status: number;
    processingTime: number;
    result: IReponseResult<T>;
}

export interface IReponseResult<T = undefined> {
    count?: number;
    message?: string;
    data?: Array<T>;
    pagination?: IResponsePagination;
}

export interface IResponsePagination {
    limit: number;
    offset: number;
    sortBy?: string;
    sort?: string;
    search?: string;
    searchField?: string;
    filters?: object;
}

export interface IOperationResult<T = undefined> {
    success?: boolean;
    affected?: number;
    data?: T;
}

/**
 * Classe central para todos os mocks HTTP Lib
 */
export class MockHttpLib {
    public static HttpStatus = HttpStatus;
    public static HttpException = MockHttpException;
    public static HttpUtils = MockHttpUtils;
    public static HttpSchema = MockHttpSchema;

    public static reset(): void {
        MockHttpException.reset();
        MockHttpUtils.reset();
        MockHttpSchema.reset();
    }

    public static getMockModule() {
        return {
            // Exceções
            HttpStatus,
            HttpException: MockHttpException,

            // Utils
            generateFingerprint: MockHttpUtils.generateFingerprint,

            // Schema
            ResponseSchema: MockHttpSchema.ResponseSchema,
        };
    }
}

/**
 * Alias para facilitar o uso
 */
export const mockHttpLib = MockHttpLib;

// Exportações individuais para uso como importações diretas
export const HttpException = MockHttpException;
export const ResponseSchema = MockHttpSchema.ResponseSchema;
export const generateFingerprint = MockHttpUtils.generateFingerprint;
