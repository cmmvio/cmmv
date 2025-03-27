import {
    Config,
    Logger,
    Service,
    Singleton,
    Hook,
    HooksType,
} from '@cmmv/core';

import * as nodemailer from 'nodemailer';
import { SESClient } from '@aws-sdk/client-ses';
import Mail from 'nodemailer/lib/mailer';

@Service('email')
export class EmailService extends Singleton {
    public logger: Logger = new Logger('EmailService');
    public transporter: nodemailer.Transporter = null;

    @Hook(HooksType.onListen)
    public async onListen(): Promise<void> {
        const instance = EmailService.getInstance();
        const options = Config.get<any>('email', {});

        if (options?.SES) options.SES = new SESClient(options.SES);

        instance.transporter = nodemailer.createTransport(options);
        instance.logger.log('EmailService is listening');
    }

    public async send(
        from: string,
        to: string,
        subject: string,
        html: string,
        options?: Mail.Options,
    ): Promise<boolean> {
        const instance = EmailService.getInstance();

        if (!instance.transporter)
            throw new Error('EmailService is not listening');

        try {
            const optionsLogger = Config.get<boolean>('email.logger', false);
            let message: Mail.Options = { from, to, subject, html };

            if (options) message = { ...message, ...options };

            const info = await instance.transporter.sendMail(message);

            if (optionsLogger)
                instance.logger.log(`Message sent to ${to}: ${info.messageId}`);

            return true;
        } catch (err) {
            instance.logger.error(
                `Error sending email to ${to}: ${err.message}`,
            );
            return false;
        }
    }
}
