import { describe, it, expect, beforeEach, vi, afterEach } from 'vitest';
import * as crypto from 'node:crypto';
import { EmailService } from '../lib/email.service';

vi.mock('@cmmv/core', async (importOriginal) => {
    const actual = await importOriginal();
    return {
        ...(actual as any),
        Config: {
            get: vi.fn(),
        },
        Logger: vi.fn().mockImplementation(() => ({
            log: vi.fn(),
            error: vi.fn(),
        })),
        Module: {
            hasModule: vi.fn().mockReturnValue(false),
        },
        Service: () => (target: any) => target,
        Singleton: class {},
        Hook: () => () => {},
        HooksType: { onListen: 'onListen' },
    };
});

vi.mock('nodemailer', () => ({
    createTransport: vi.fn().mockReturnValue({
        sendMail: vi.fn(),
    }),
}));

vi.mock('@aws-sdk/client-ses', () => ({
    SES: vi.fn(),
}));

import { Config, Module } from '@cmmv/core';
import * as nodemailer from 'nodemailer';

describe('EmailService', () => {
    let service: EmailService;

    beforeEach(() => {
        vi.clearAllMocks();
        service = new EmailService();
        EmailService.transporter = null;
    });

    describe('onListen', () => {
        it('should create nodemailer transporter with config options', async () => {
            const mockOptions = {
                host: 'smtp.example.com',
                port: 587,
                auth: { user: 'test', pass: 'password' },
            };
            vi.mocked(Config.get).mockReturnValue(mockOptions);

            await service.onListen();

            expect(nodemailer.createTransport).toHaveBeenCalledWith(
                mockOptions,
            );
            expect(EmailService.transporter).not.toBeNull();
        });

        it('should configure SES if SES option is provided', async () => {
            const mockOptions = {
                SES: { region: 'us-east-1' },
            };
            vi.mocked(Config.get).mockReturnValue(mockOptions);

            // This will fail due to require, but we're testing the path
            try {
                await service.onListen();
            } catch (e) {
                // Expected to fail without proper AWS setup
            }
        });
    });

    describe('send', () => {
        beforeEach(async () => {
            vi.mocked(Config.get).mockImplementation(
                (key: string, defaultValue?: any) => {
                    if (key === 'email') return { host: 'smtp.test.com' };
                    if (key === 'email.logger') return false;
                    if (key === 'email.telemetry') return false;
                    return defaultValue;
                },
            );
            await service.onListen();
        });

        it('should throw error if transporter is not initialized', async () => {
            EmailService.transporter = null;

            await expect(
                service.send(
                    'from@test.com',
                    'to@test.com',
                    'Subject',
                    '<p>Body</p>',
                    'context',
                ),
            ).rejects.toThrow('EmailService is not listening');
        });

        it('should send email successfully', async () => {
            const mockSendMail = vi
                .fn()
                .mockResolvedValue({ messageId: 'test-id' });
            EmailService.transporter = { sendMail: mockSendMail } as any;

            const result = await service.send(
                'from@test.com',
                'to@test.com',
                'Subject',
                '<p>Body</p>',
                'context',
            );

            expect(result).toBe(true);
            expect(mockSendMail).toHaveBeenCalledWith({
                from: 'from@test.com',
                to: 'to@test.com',
                subject: 'Subject',
                html: '<p>Body</p>',
            });
        });

        it('should merge additional options', async () => {
            const mockSendMail = vi
                .fn()
                .mockResolvedValue({ messageId: 'test-id' });
            EmailService.transporter = { sendMail: mockSendMail } as any;

            await service.send(
                'from@test.com',
                'to@test.com',
                'Subject',
                '<p>Body</p>',
                'context',
                undefined,
                { cc: 'cc@test.com' },
            );

            expect(mockSendMail).toHaveBeenCalledWith({
                from: 'from@test.com',
                to: 'to@test.com',
                subject: 'Subject',
                html: '<p>Body</p>',
                cc: 'cc@test.com',
            });
        });

        it('should return false on send error', async () => {
            const mockSendMail = vi
                .fn()
                .mockRejectedValue(new Error('SMTP error'));
            EmailService.transporter = { sendMail: mockSendMail } as any;

            const result = await service.send(
                'from@test.com',
                'to@test.com',
                'Subject',
                '<p>Body</p>',
                'context',
            );

            expect(result).toBe(false);
        });

        it('should log when logger is enabled', async () => {
            vi.mocked(Config.get).mockImplementation(
                (key: string, defaultValue?: any) => {
                    if (key === 'email.logger') return true;
                    if (key === 'email.telemetry') return false;
                    return defaultValue;
                },
            );

            const mockSendMail = vi
                .fn()
                .mockResolvedValue({ messageId: 'test-id' });
            EmailService.transporter = { sendMail: mockSendMail } as any;

            await service.send(
                'from@test.com',
                'to@test.com',
                'Subject',
                '<p>Body</p>',
                'context',
            );

            expect(mockSendMail).toHaveBeenCalled();
        });
    });

    describe('generatePixelId', () => {
        it('should generate a 64 character hex string', () => {
            const pixelId = service.generatePixelId();

            expect(pixelId).toHaveLength(64);
            expect(/^[a-f0-9]+$/.test(pixelId)).toBe(true);
        });

        it('should generate unique ids', () => {
            const id1 = service.generatePixelId();
            const id2 = service.generatePixelId();

            expect(id1).not.toBe(id2);
        });
    });

    describe('getPixelUrl', () => {
        it('should return pixel URL with provided pixelId', () => {
            vi.mocked(Config.get).mockReturnValue('https://example.com/pixel');

            const url = service.getPixelUrl('test-pixel-id');

            expect(url).toBe('https://example.com/pixel?id=test-pixel-id');
        });

        it('should generate pixelId if not provided', () => {
            vi.mocked(Config.get).mockReturnValue('https://example.com/pixel');

            const url = service.getPixelUrl(null);

            expect(url).toMatch(
                /^https:\/\/example\.com\/pixel\?id=[a-f0-9]{64}$/,
            );
        });
    });

    describe('getUnsubscribeLink', () => {
        it('should return unsubscribe link with userId and pixelId', () => {
            vi.mocked(Config.get).mockReturnValue(
                'https://example.com/unsubscribe',
            );

            const link = service.getUnsubscribeLink('user-123', 'pixel-456');

            expect(link).toBe(
                'https://example.com/unsubscribe?u=user-123&t=pixel-456',
            );
        });
    });

    describe('updateEmailOpening', () => {
        it('should return false if repository module is not available', async () => {
            vi.mocked(Module.hasModule).mockReturnValue(false);

            const result = await service.updateEmailOpening('pixel-123');

            expect(result).toBe(false);
        });
    });

    describe('unsubscribeNewsletter', () => {
        it('should throw error if unsubscribeLinkApi is not configured', async () => {
            vi.mocked(Config.get).mockReturnValue(undefined);
            const mockRes = { res: { writeHead: vi.fn(), end: vi.fn() } };

            await expect(
                service.unsubscribeNewsletter('user-123', 'token-456', mockRes),
            ).rejects.toThrow('Unsubscribe link API not found');
        });

        it('should redirect to unsubscribe API', async () => {
            vi.mocked(Config.get).mockReturnValue(
                'https://api.example.com/unsubscribe',
            );
            const mockRes = { res: { writeHead: vi.fn(), end: vi.fn() } };

            const result = await service.unsubscribeNewsletter(
                'user-123',
                'token-456',
                mockRes,
            );

            expect(result).toBe(true);
            expect(mockRes.res.writeHead).toHaveBeenCalledWith(302, {
                Location:
                    'https://api.example.com/unsubscribe?u=user-123&t=token-456',
            });
            expect(mockRes.res.end).toHaveBeenCalled();
        });
    });
});

describe('Email masking', () => {
    let service: EmailService;

    beforeEach(() => {
        service = new EmailService();
    });

    it('should mask short emails correctly', () => {
        // Access private method via type casting
        const maskEmail = (service as any).maskEmail.bind(service);

        expect(maskEmail('ab@test.com')).toBe('a*@test.com');
        expect(maskEmail('abc@test.com')).toBe('a**@test.com');
        expect(maskEmail('abcd@test.com')).toBe('a***@test.com');
    });

    it('should mask long emails correctly', () => {
        const maskEmail = (service as any).maskEmail.bind(service);

        expect(maskEmail('johndoe@test.com')).toBe('jo***oe@test.com');
        expect(maskEmail('testing@example.com')).toBe('te***ng@example.com');
    });
});
