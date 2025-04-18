import { describe, it, expect, beforeEach, vi } from 'vitest';
import {
    mockHttpLib,
    MockHttpLib,
    MockHttpException,
    MockHttpUtils,
    MockHttpSchema,
    HttpStatus,
    HttpException,
    ResponseSchema,
    generateFingerprint,
} from '../../http/http-lib.mock';

describe('HTTP Lib Mocks', () => {
    beforeEach(() => {
        MockHttpLib.reset();
        vi.clearAllMocks();
    });

    describe('HttpException', () => {
        it('should create exception with status and message', () => {
            const exception = new MockHttpException(
                'Resource not found',
                HttpStatus.NOT_FOUND,
            );

            expect(exception.message).toBe('Resource not found');
            expect(exception.status).toBe(404);
        });

        it('should format exception as JSON', () => {
            const exception = new MockHttpException(
                'Unauthorized',
                HttpStatus.UNAUTHORIZED,
            );
            const json = exception.toJSON();

            expect(json).toEqual({
                statusCode: 401,
                message: 'Unauthorized',
            });
        });

        it('should export HttpException as alias for MockHttpException', () => {
            expect(HttpException).toBe(MockHttpException);
        });
    });

    describe('HttpUtils', () => {
        it('should mock generateFingerprint function', () => {
            const req = {
                headers: {
                    'user-agent': 'test-agent',
                    'accept-language': 'en-US',
                },
                ip: '127.0.0.1',
            };

            const result = generateFingerprint(req, 'hashed-username');

            expect(generateFingerprint).toHaveBeenCalledWith(
                req,
                'hashed-username',
            );
            expect(typeof result).toBe('string');
            expect(result).toContain('mock-fingerprint-');
        });

        it('should reset generateFingerprint mock implementation', () => {
            // Override implementation
            MockHttpUtils.generateFingerprint.mockReturnValue(
                'custom-fingerprint',
            );

            expect(generateFingerprint({}, 'user')).toBe('custom-fingerprint');

            // Reset
            MockHttpUtils.reset();

            const result = generateFingerprint({}, 'user');
            expect(result).not.toBe('custom-fingerprint');
            expect(result).toContain('mock-fingerprint-');
        });
    });

    describe('HttpSchema', () => {
        it('should mock ResponseSchema function', () => {
            const data = {
                status: 200,
                processingTime: 50,
                result: {
                    message: 'Success',
                    data: [{ id: 1 }],
                },
            };

            const result = ResponseSchema(data);

            expect(ResponseSchema).toHaveBeenCalledWith(data);
            expect(typeof result).toBe('string');
            expect(JSON.parse(result)).toEqual(data);
        });

        it('should reset ResponseSchema mock implementation', () => {
            // Override implementation
            MockHttpSchema.ResponseSchema.mockReturnValue(
                '{"custom":"response"}',
            );

            expect(ResponseSchema({})).toBe('{"custom":"response"}');

            // Reset
            MockHttpSchema.reset();

            const data = { test: true };
            expect(ResponseSchema(data)).toBe(JSON.stringify(data));
        });
    });

    describe('MockHttpLib central class', () => {
        it('should provide access to all HTTP lib mocks', () => {
            expect(MockHttpLib.HttpStatus).toBe(HttpStatus);
            expect(MockHttpLib.HttpException).toBe(MockHttpException);
            expect(MockHttpLib.HttpUtils).toBe(MockHttpUtils);
            expect(MockHttpLib.HttpSchema).toBe(MockHttpSchema);
        });

        it('should reset all mock implementations', () => {
            // Setup spies on individual reset methods
            const spyExceptionReset = vi.spyOn(MockHttpException, 'reset');
            const spyUtilsReset = vi.spyOn(MockHttpUtils, 'reset');
            const spySchemaReset = vi.spyOn(MockHttpSchema, 'reset');

            // Call central reset
            MockHttpLib.reset();

            // Verify all reset methods were called
            expect(spyExceptionReset).toHaveBeenCalled();
            expect(spyUtilsReset).toHaveBeenCalled();
            expect(spySchemaReset).toHaveBeenCalled();
        });

        it('should provide getMockModule to export all mocked components', () => {
            const mockModule = MockHttpLib.getMockModule();

            expect(mockModule.HttpStatus).toBe(HttpStatus);
            expect(mockModule.HttpException).toBe(MockHttpException);
            expect(mockModule.generateFingerprint).toBe(
                MockHttpUtils.generateFingerprint,
            );
            expect(mockModule.ResponseSchema).toBe(
                MockHttpSchema.ResponseSchema,
            );
        });

        it('should export mockHttpLib as alias for MockHttpLib', () => {
            expect(mockHttpLib).toBe(MockHttpLib);
        });
    });
});
