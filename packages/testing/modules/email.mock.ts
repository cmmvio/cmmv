import { vi } from 'vitest';

/**
 * Mock para EmailSendingContract
 */
export class MockEmailSendingContract {
    public email: string = 'test@example.com';
    public messageId: string = 'mock-message-id';
    public subject: string = 'Test Subject';
    public context: string = 'test-context';
    public recived: boolean = false;
    public recivedAt: Date | null = null;
    public opened: boolean = false;
    public error: string | null = null;
    public pixelId: string | null = null;

    public customProto = vi.fn().mockReturnValue('');
    public customTypes = vi.fn().mockReturnValue('');

    public static reset(): void {
        const instance = new MockEmailSendingContract();
        instance.email = 'test@example.com';
        instance.messageId = 'mock-message-id';
        instance.subject = 'Test Subject';
        instance.context = 'test-context';
        instance.recived = false;
        instance.recivedAt = null;
        instance.opened = false;
        instance.error = null;
        instance.pixelId = null;
    }
}

/**
 * Mock para EmailController
 */
export class MockEmailController {
    public emailService: MockEmailService;

    constructor() {
        this.emailService = MockEmailService.getInstance();
    }

    public updateOpening = vi
        .fn()
        .mockImplementation(async (emailId: string, res: any) => {
            await this.emailService.updateEmailOpening(emailId);

            const transparentPixel = Buffer.from(
                'iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAQAAAC1HAwCAAAAC0lEQVR42mP8/58HAAMBAQAYE3nOAAAAAElFTkSuQmCC',
                'base64',
            );

            res.setHeader = vi.fn();
            res.send = vi.fn();

            return res;
        });

    public unsubscribe = vi
        .fn()
        .mockImplementation(async (userId: string, token: string, res: any) => {
            return await this.emailService.unsubscribeNewsletter(
                userId,
                token,
                res,
            );
        });

    public static reset(): void {
        const controller = new MockEmailController();
        controller.updateOpening.mockClear();
        controller.unsubscribe.mockClear();
    }
}

/**
 * Mock para EmailService
 */
export class MockEmailService {
    private static _instance: MockEmailService;

    public logger = {
        log: vi.fn(),
        error: vi.fn(),
        debug: vi.fn(),
        warn: vi.fn(),
    };

    public static transporter = {
        sendMail: vi.fn().mockResolvedValue({
            messageId: 'mock-message-id',
            envelope: { from: 'from@example.com', to: ['to@example.com'] },
            accepted: ['to@example.com'],
            rejected: [],
            response: '250 OK',
        }),
    };

    public onListen = vi.fn().mockResolvedValue(undefined);

    public send = vi
        .fn()
        .mockImplementation(
            async (
                from: string,
                to: string,
                subject: string,
                html: string,
                context: string,
                pixelId?: string,
                options?: any,
            ) => {
                try {
                    const info = await MockEmailService.transporter.sendMail({
                        from,
                        to,
                        subject,
                        html,
                        ...options,
                    });

                    return true;
                } catch (err) {
                    this.logger.error(`Error sending email: ${err.message}`);
                    return false;
                }
            },
        );

    public maskEmail = vi.fn().mockImplementation((email: string) => {
        const [user, domain] = email.split('@');
        const maskedUser =
            user.charAt(0) +
            '*'.repeat(user.length - 2) +
            user.charAt(user.length - 1);
        return `${maskedUser}@${domain}`;
    });

    public telemetry = vi.fn().mockResolvedValue(undefined);

    public generatePixelId = vi.fn().mockReturnValue('mock-pixel-id-12345');

    public getPixelUrl = vi
        .fn()
        .mockImplementation((pixelId: string | null) => {
            if (!pixelId) pixelId = this.generatePixelId();
            return `https://example.com/email/pixel?id=${pixelId}`;
        });

    public getUnsubscribeLink = vi
        .fn()
        .mockImplementation((userId: string, pixelId: string) => {
            return `https://example.com/email/unsubscribe?u=${userId}&t=${pixelId}`;
        });

    public updateEmailOpening = vi.fn().mockResolvedValue(true);

    public unsubscribeNewsletter = vi
        .fn()
        .mockImplementation(async (userId: string, token: string, res: any) => {
            if (res && res.res) {
                res.res.writeHead = vi.fn();
                res.res.end = vi.fn();
            }
            return true;
        });

    public static getInstance(): MockEmailService {
        if (!MockEmailService._instance) {
            MockEmailService._instance = new MockEmailService();
        }
        return MockEmailService._instance;
    }

    public static reset(): void {
        if (MockEmailService._instance) {
            const instance = MockEmailService._instance;

            // Reset logger mocks
            instance.logger.log.mockReset();
            instance.logger.error.mockReset();
            instance.logger.debug.mockReset();
            instance.logger.warn.mockReset();

            // Reset service methods
            instance.onListen.mockReset();
            instance.send.mockReset();
            instance.maskEmail.mockReset();
            instance.telemetry.mockReset();
            instance.generatePixelId.mockReset();
            instance.getPixelUrl.mockReset();
            instance.getUnsubscribeLink.mockReset();
            instance.updateEmailOpening.mockReset();
            instance.unsubscribeNewsletter.mockReset();

            // Reset transporter
            MockEmailService.transporter.sendMail.mockReset();

            // Restore default implementations
            instance.onListen.mockResolvedValue(undefined);
            instance.send.mockImplementation(
                async (from, to, subject, html, context, pixelId, options) =>
                    true,
            );
            instance.maskEmail.mockImplementation((email: string) => {
                const [user, domain] = email.split('@');
                const maskedUser =
                    user.charAt(0) +
                    '*'.repeat(user.length - 2) +
                    user.charAt(user.length - 1);
                return `${maskedUser}@${domain}`;
            });
            instance.generatePixelId.mockReturnValue('mock-pixel-id-12345');
            instance.getPixelUrl.mockImplementation(
                (pixelId: string | null) => {
                    if (!pixelId) pixelId = instance.generatePixelId();
                    return `https://example.com/email/pixel?id=${pixelId}`;
                },
            );
            instance.getUnsubscribeLink.mockImplementation(
                (userId: string, pixelId: string) => {
                    return `https://example.com/email/unsubscribe?u=${userId}&t=${pixelId}`;
                },
            );
            instance.updateEmailOpening.mockResolvedValue(true);
            instance.unsubscribeNewsletter.mockImplementation(
                async (userId: string, token: string, res: any) => {
                    if (res && res.res) {
                        res.res.writeHead = vi.fn();
                        res.res.end = vi.fn();
                    }
                    return true;
                },
            );

            MockEmailService.transporter.sendMail.mockResolvedValue({
                messageId: 'mock-message-id',
                envelope: { from: 'from@example.com', to: ['to@example.com'] },
                accepted: ['to@example.com'],
                rejected: [],
                response: '250 OK',
            });
        }
    }

    public static getMockModule() {
        return {
            EmailService: {
                getInstance: MockEmailService.getInstance,
                transporter: MockEmailService.transporter,
                logger: MockEmailService.getInstance().logger,
            },
        };
    }
}

/**
 * Mock para EmailModule
 */
export class MockEmailModule {
    public static providers = [MockEmailService];
    public static controllers = [MockEmailController];
    public static contracts = [MockEmailSendingContract];

    public static reset(): void {
        MockEmailSendingContract.reset();
        MockEmailController.reset();
        MockEmailService.reset();
    }

    public static getMockModule() {
        return {
            EmailModule: {
                providers: MockEmailModule.providers,
                controllers: MockEmailModule.controllers,
                contracts: MockEmailModule.contracts,
            },
        };
    }
}

/**
 * Centralized mock for all Email components
 */
export class MockEmail {
    public static EmailSendingContract = MockEmailSendingContract;
    public static EmailController = MockEmailController;
    public static EmailService = MockEmailService;
    public static EmailModule = MockEmailModule;

    /**
     * Reset all email mocks
     */
    public static reset(): void {
        MockEmailSendingContract.reset();
        MockEmailController.reset();
        MockEmailService.reset();
        MockEmailModule.reset();
    }

    /**
     * Get a complete mock of the email module
     */
    public static getMockModule() {
        return {
            EmailSendingContract: MockEmailSendingContract,
            EmailController: MockEmailController,
            EmailService: MockEmailService,
            EmailModule: MockEmailModule.getMockModule().EmailModule,
        };
    }
}

/**
 * Centralized mock export for email
 */
export const mockEmail = MockEmail;

// Export individual components
export const EmailSendingContract = MockEmailSendingContract;
export const EmailController = MockEmailController;
export const EmailService = MockEmailService;
export const EmailModule = MockEmailModule;
