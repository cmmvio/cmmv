import * as path from 'node:path';
import * as fs from 'node:fs';

import {
    Service,
    AbstractService,
    Resolver,
    Application,
    Config,
    Module,
} from '@cmmv/core';

import { CMMVRenderer, HttpException, HttpStatus } from '@cmmv/http';

@Service('auth_email')
export class AuthEmailService extends AbstractService {
    /**
     * Send an email
     * @param templateName - The template name
     * @param to - The email to send to
     * @param subject - The subject of the email
     * @param context - The context of the email
     * @param userId - The user id
     * @param data - The data to send to the email
     */
    public async sendEmail(
        templateName: string,
        to: string,
        subject: string,
        context: string,
        userId: string,
        data: any,
    ): Promise<void> {
        if (Module.hasModule('email')) {
            const customTemplate = Config.get<string>(
                `auth.templates.${templateName}`,
            );

            const template = customTemplate
                ? customTemplate
                : path.join(
                      __dirname,
                      '..',
                      'templates',
                      `${templateName}.html`,
                  );

            if (!fs.existsSync(template))
                throw new HttpException(
                    'Template not found',
                    HttpStatus.NOT_FOUND,
                );

            //@ts-ignore
            const { EmailService } = await import('@cmmv/email');
            const emailService = Application.resolveProvider(EmailService);
            //@ts-ignore
            const pixelId = emailService.generatePixelId();
            //@ts-ignore
            const pixelUrl = emailService.getPixelUrl(pixelId);
            //@ts-ignore
            const unsubscribeLink = emailService.getUnsubscribeLink(
                userId,
                pixelId,
            );
            const renderer = new CMMVRenderer();

            const templateParsed: string = await new Promise(
                (resolve, reject) => {
                    renderer.renderFile(
                        template,
                        {
                            ...data,
                            pixelUrl: pixelUrl,
                            unsubscribeLink: unsubscribeLink,
                        },
                        {},
                        (err, content) => {
                            if (err) {
                                console.error(err);
                                throw new HttpException(
                                    'Failed to send reset password email',
                                    HttpStatus.INTERNAL_SERVER_ERROR,
                                );
                            }

                            resolve(content);
                        },
                    );
                },
            );

            //@ts-ignore
            await emailService.send(
                Config.get<string>('email.from'),
                to,
                subject,
                templateParsed,
                context,
                pixelId,
                {
                    list: {
                        unsubscribe: {
                            url: unsubscribeLink,
                            comment: 'Unsubscribe from newsletter',
                        },
                    },
                },
            );
        }
    }
}
