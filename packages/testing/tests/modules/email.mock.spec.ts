import { describe, it, expect, beforeEach, vi } from 'vitest';
import {
    mockEmail,
    MockEmail,
    MockEmailSendingContract,
    MockEmailController,
    MockEmailService,
    MockEmailModule,
    EmailSendingContract,
    EmailController,
    EmailService,
    EmailModule,
} from '../../modules/email.mock';

describe('Email Mocks', () => {
    beforeEach(() => {
        MockEmail.reset();
        vi.clearAllMocks();
    });

    describe('MockEmailSendingContract', () => {
        it('should initialize with default values', () => {
            const contract = new MockEmailSendingContract();

            expect(contract.email).toBe('test@example.com');
            expect(contract.messageId).toBe('mock-message-id');
            expect(contract.subject).toBe('Test Subject');
            expect(contract.context).toBe('test-context');
            expect(contract.recived).toBe(false);
            expect(contract.recivedAt).toBeNull();
            expect(contract.opened).toBe(false);
            expect(contract.error).toBeNull();
            expect(contract.pixelId).toBeNull();
        });

        it('should have mock methods for contract functionality', () => {
            const contract = new MockEmailSendingContract();

            expect(contract.customProto).toBeDefined();
            expect(contract.customTypes).toBeDefined();

            expect(contract.customProto()).toBe('');
            expect(contract.customTypes()).toBe('');
        });

        it('should reset contract to initial state', () => {
            const contract = new MockEmailSendingContract();
            contract.email = 'changed@example.com';
            contract.opened = true;

            MockEmailSendingContract.reset();

            // We need to create a new instance since reset() doesn't modify existing instances
            const resetContract = new MockEmailSendingContract();
            expect(resetContract.email).toBe('test@example.com');
            expect(resetContract.opened).toBe(false);
        });
    });

    describe('MockEmailController', () => {
        it('should initialize with email service', () => {
            const controller = new MockEmailController();

            expect(controller.emailService).toBeDefined();
            expect(controller.emailService).toBe(
                MockEmailService.getInstance(),
            );
        });

        it('should have updateOpening method that calls email service', async () => {
            const controller = new MockEmailController();
            const emailId = 'test-pixel-id';
            const res = {};

            const spy = vi.spyOn(controller.emailService, 'updateEmailOpening');

            await controller.updateOpening(emailId, res);

            expect(spy).toHaveBeenCalledWith(emailId);
            expect(res).toHaveProperty('setHeader');
            expect(res).toHaveProperty('send');
        });

        it('should have unsubscribe method that calls email service', async () => {
            const controller = new MockEmailController();
            const userId = 'user-123';
            const token = 'token-456';
            const res = {};

            const spy = vi.spyOn(
                controller.emailService,
                'unsubscribeNewsletter',
            );

            await controller.unsubscribe(userId, token, res);

            expect(spy).toHaveBeenCalledWith(userId, token, res);
        });

        it('should reset mock methods', () => {
            const controller = new MockEmailController();
            controller.updateOpening.mockImplementation(() => 'custom');

            expect(controller.updateOpening({} as any, {} as any)).toBe(
                'custom',
            );

            MockEmailController.reset();

            // We need to check a new instance
            const newController = new MockEmailController();
            expect(typeof newController.updateOpening).toBe('function');
            expect(newController.updateOpening.mock).toBeDefined();
        });
    });

    describe('MockEmailService', () => {
        it('should provide singleton instance', () => {
            const instance1 = MockEmailService.getInstance();
            const instance2 = MockEmailService.getInstance();

            expect(instance1).toBe(instance2);
        });

        it('should have logger object with mock methods', () => {
            const service = MockEmailService.getInstance();

            expect(service.logger).toBeDefined();
            expect(service.logger.log).toBeDefined();
            expect(service.logger.error).toBeDefined();
            expect(service.logger.debug).toBeDefined();
            expect(service.logger.warn).toBeDefined();
        });

        it('should have static transporter with sendMail method', () => {
            expect(MockEmailService.transporter).toBeDefined();
            expect(MockEmailService.transporter.sendMail).toBeDefined();

            const result = MockEmailService.transporter.sendMail({});
            expect(result).resolves.toHaveProperty('messageId');
        });

        it('should have onListen method', () => {
            const service = MockEmailService.getInstance();

            expect(service.onListen).toBeDefined();
            expect(service.onListen()).resolves.toBeUndefined();
        });

        it('should have maskEmail method that masks email addresses', () => {
            const service = MockEmailService.getInstance();
            const result = service.maskEmail('user@example.com');
            expect(result).toBe('u**r@example.com');
        });

        it('should have generatePixelId method', () => {
            const service = MockEmailService.getInstance();
            const result = service.generatePixelId();
            expect(result).toBe('mock-pixel-id-12345');
        });

        it('should have getPixelUrl method that generates tracking pixel URLs', () => {
            const service = MockEmailService.getInstance();

            const result = service.getPixelUrl('test-pixel-id');

            expect(result).toBe(
                'https://example.com/email/pixel?id=test-pixel-id',
            );
        });

        it('should use generated pixelId when none provided to getPixelUrl', () => {
            const service = MockEmailService.getInstance();
            const spy = vi.spyOn(service, 'generatePixelId');

            service.getPixelUrl(null);

            expect(spy).toHaveBeenCalled();
        });

        it('should have getUnsubscribeLink method', () => {
            const service = MockEmailService.getInstance();

            const result = service.getUnsubscribeLink('user-123', 'token-456');

            expect(result).toBe(
                'https://example.com/email/unsubscribe?u=user-123&t=token-456',
            );
        });

        it('should have updateEmailOpening method', () => {
            const service = MockEmailService.getInstance();

            expect(service.updateEmailOpening('pixel-id')).resolves.toBe(true);
        });

        it('should have unsubscribeNewsletter method that handles response object', async () => {
            const service = MockEmailService.getInstance();
            const res = { res: { writeHead: undefined, end: undefined } };

            await service.unsubscribeNewsletter('user-123', 'token-456', res);

            expect(res.res.writeHead).toBeDefined();
            expect(res.res.end).toBeDefined();
        });

        it('should reset all mock implementations', () => {
            const service = MockEmailService.getInstance();

            // Change some implementations
            service.logger.log.mockImplementation(() => 'log');
            service.send.mockResolvedValue(false);
            service.getPixelUrl.mockReturnValue('custom-url');

            // Verify changes
            expect(service.logger.log()).toBe('log');
            expect(
                service.send(
                    '' as any,
                    '' as any,
                    '' as any,
                    '' as any,
                    '' as any,
                ),
            ).resolves.toBe(false);
            expect(service.getPixelUrl('id')).toBe('custom-url');

            // Reset
            MockEmailService.reset();

            // Verify reset
            expect(service.logger.log()).toBeUndefined();
            expect(
                service.send(
                    '' as any,
                    '' as any,
                    '' as any,
                    '' as any,
                    '' as any,
                ),
            ).resolves.toBe(true);
            expect(service.getPixelUrl('id')).toBe(
                'https://example.com/email/pixel?id=id',
            );
        });

        it('should provide mock module with EmailService methods', () => {
            const mockModule = MockEmailService.getMockModule();

            expect(mockModule).toHaveProperty('EmailService');
            expect(mockModule.EmailService).toHaveProperty('getInstance');
            expect(mockModule.EmailService).toHaveProperty('transporter');
            expect(mockModule.EmailService).toHaveProperty('logger');
        });
    });

    describe('MockEmailModule', () => {
        it('should have providers array with EmailService', () => {
            expect(MockEmailModule.providers).toContain(MockEmailService);
        });

        it('should have controllers array with EmailController', () => {
            expect(MockEmailModule.controllers).toContain(MockEmailController);
        });

        it('should have contracts array with EmailSendingContract', () => {
            expect(MockEmailModule.contracts).toContain(
                MockEmailSendingContract,
            );
        });

        it('should call reset on all components when reset is called', () => {
            const spyContract = vi.spyOn(MockEmailSendingContract, 'reset');
            const spyController = vi.spyOn(MockEmailController, 'reset');
            const spyService = vi.spyOn(MockEmailService, 'reset');

            MockEmailModule.reset();

            expect(spyContract).toHaveBeenCalled();
            expect(spyController).toHaveBeenCalled();
            expect(spyService).toHaveBeenCalled();
        });

        it('should provide mock module with EmailModule properties', () => {
            const mockModule = MockEmailModule.getMockModule();

            expect(mockModule).toHaveProperty('EmailModule');
            expect(mockModule.EmailModule).toHaveProperty('providers');
            expect(mockModule.EmailModule).toHaveProperty('controllers');
            expect(mockModule.EmailModule).toHaveProperty('contracts');
        });
    });

    describe('MockEmail (Central)', () => {
        it('should provide access to all component mocks', () => {
            expect(MockEmail.EmailSendingContract).toBe(
                MockEmailSendingContract,
            );
            expect(MockEmail.EmailController).toBe(MockEmailController);
            expect(MockEmail.EmailService).toBe(MockEmailService);
            expect(MockEmail.EmailModule).toBe(MockEmailModule);
        });

        it('should call reset on all components when reset is called', () => {
            const spyContract = vi.spyOn(MockEmailSendingContract, 'reset');
            const spyController = vi.spyOn(MockEmailController, 'reset');
            const spyService = vi.spyOn(MockEmailService, 'reset');
            const spyModule = vi.spyOn(MockEmailModule, 'reset');

            MockEmail.reset();

            expect(spyContract).toHaveBeenCalled();
            expect(spyController).toHaveBeenCalled();
            expect(spyService).toHaveBeenCalled();
            expect(spyModule).toHaveBeenCalled();
        });

        it('should provide complete mock module with all components', () => {
            const mockModule = MockEmail.getMockModule();

            expect(mockModule).toHaveProperty('EmailSendingContract');
            expect(mockModule).toHaveProperty('EmailController');
            expect(mockModule).toHaveProperty('EmailService');
            expect(mockModule).toHaveProperty('EmailModule');
        });
    });

    describe('Individual exports', () => {
        it('should export EmailSendingContract', () => {
            expect(EmailSendingContract).toBe(MockEmailSendingContract);
        });

        it('should export EmailController', () => {
            expect(EmailController).toBe(MockEmailController);
        });

        it('should export EmailService', () => {
            expect(EmailService).toBe(MockEmailService);
        });

        it('should export EmailModule', () => {
            expect(EmailModule).toBe(MockEmailModule);
        });

        it('should export mockEmail', () => {
            expect(mockEmail).toBe(MockEmail);
        });
    });
});
