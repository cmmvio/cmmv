import * as crypto from 'node:crypto';

import {
    Config,
    Logger,
    Service,
    Singleton,
    Hook,
    HooksType,
    Module,
} from '@cmmv/core';

import * as nodemailer from 'nodemailer';
import * as aws from '@aws-sdk/client-ses';
import Mail from 'nodemailer/lib/mailer';

@Service('email')
export class EmailService {
    public static logger: Logger = new Logger('EmailService');
    public static transporter: nodemailer.Transporter = null;

    @Hook(HooksType.onListen)
    public async onListen(): Promise<void> {
        const options = Config.get<any>('email', {});

        if (options?.SES) {
            let {
                defaultProvider,
            } = require('@aws-sdk/credential-provider-node');
            options.SES = {
                ses: new aws.SES({
                    apiVersion: '2010-12-01',
                    ...options.SES,
                    defaultProvider,
                }),
                aws,
            };
        }

        EmailService.transporter = nodemailer.createTransport(options);
        EmailService.logger.log('EmailService is listening');
    }

    /**
     * Send an email
     * @param from - The sender email
     * @param to - The recipient email
     * @param subject - The email subject
     * @param html - The email body
     * @param context - The email context
     * @param options - The email options
     * @returns True if the email was sent successfully, false otherwise
     */
    public async send(
        from: string,
        to: string,
        subject: string,
        html: string,
        context: string,
        pixelId?: string,
        options?: Mail.Options,
    ): Promise<boolean> {
        if (!EmailService.transporter)
            throw new Error('EmailService is not listening');

        try {
            const logger = Config.get<boolean>('email.logger', true);
            const telemetry = Config.get<boolean>('email.telemetry', true);
            let message: Mail.Options = { from, to, subject, html };

            if (options) message = { ...message, ...options };

            const info = await EmailService.transporter.sendMail(message);

            if (logger)
                EmailService.logger.log(
                    `Message sent to ${this.maskEmail(to)}: ${info.messageId}`,
                );

            if (telemetry)
                await this.telemetry(
                    this.maskEmail(to),
                    subject,
                    context,
                    info,
                    pixelId,
                );

            return true;
        } catch (err) {
            EmailService.logger.error(
                `Error sending email to ${this.maskEmail(to)}: ${err.message}`,
            );
            return false;
        }
    }

    /**
     * Mask an email address
     * @param email - The email address to mask
     * @returns The masked email address
     */
    private maskEmail(email) {
        const [user, domain] = email.split('@');

        let maskedUser;

        if (user.length <= 4)
            maskedUser = user[0] + '*'.repeat(user.length - 1);
        else
            maskedUser =
                user.slice(0, 2) + '*'.repeat(user.length - 4) + user.slice(-2);

        return `${maskedUser}@${domain}`;
    }

    /**
     * Send telemetry data
     * @param to - The recipient email
     * @param subject - The email subject
     * @param context - The email context
     * @param info - The email info
     */
    private async telemetry(
        to: string,
        subject: string,
        context: string,
        info: any,
        pixelId?: string,
    ) {
        if (!Module.hasModule('repository')) return;

        //@ts-ignore
        const { Repository } = await import('@cmmv/repository');
        const EmailSendingEntity = Repository.getEntity('EmailSendingEntity');

        await Repository.insert(EmailSendingEntity, {
            email: to,
            messageId: info.messageId,
            subject: subject,
            context: context,
            recived: 0,
            opened: 0,
            pixelId: pixelId,
        });
    }

    /**
     * Generate a pixel id
     * @returns The pixel id
     */
    public generatePixelId(): string {
        return crypto.randomBytes(32).toString('hex');
    }

    /**
     * Get the pixel url
     * @param pixelId - The pixel id
     * @returns The pixel url
     */
    public getPixelUrl(pixelId: string | null): string {
        if (!pixelId) pixelId = this.generatePixelId();

        const pixelUrl = Config.get<string>('email.pixelUrl');
        return `${pixelUrl}?id=${pixelId}`;
    }

    /**
     * Get the unsubscribe link
     * @param userId - The user id
     * @param pixelId - The pixel id
     * @returns The unsubscribe link
     */
    public getUnsubscribeLink(userId: string, pixelId: string): string {
        const unsubscribeUrl = Config.get<string>('email.unsubscribeUrl');
        return `${unsubscribeUrl}?u=${userId}&t=${pixelId}`;
    }

    /**
     * Update the email opening
     * @param pixelId - The pixel id
     * @returns True if the email opening was updated successfully, false otherwise
     */
    public async updateEmailOpening(pixelId: string): Promise<boolean> {
        if (!Module.hasModule('repository')) return false;

        //@ts-ignore
        const { Repository } = await import('@cmmv/repository');
        const EmailSendingEntity = Repository.getEntity('EmailSendingEntity');
        const emailSending = await Repository.findOne(EmailSendingEntity, {
            pixelId,
        });

        if (!emailSending) return false;

        emailSending.opened = 1;
        await Repository.updateOne(
            EmailSendingEntity,
            { pixelId },
            emailSending,
        );
        return true;
    }

    /**
     * Unsubscribe from newsletter
     * @param userId - The user id
     * @param token - The token
     * @returns True if the newsletter was unsubscribed successfully, false otherwise
     */
    public async unsubscribeNewsletter(
        userId: string,
        token: string,
        res: any,
    ): Promise<boolean> {
        const unsubscribeLinkApi = Config.get<string>(
            'email.unsubscribeLinkApi',
        );

        if (!unsubscribeLinkApi)
            throw new Error('Unsubscribe link API not found');

        const redirectUrl = `${unsubscribeLinkApi}?u=${userId}&t=${token}`;
        res.res.writeHead(302, { Location: redirectUrl.toString() });
        res.res.end();

        return true;
    }
}
