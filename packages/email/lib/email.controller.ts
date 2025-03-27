import { Controller, Get, Query, Res } from '@cmmv/http';

import { EmailService } from './email.service';

@Controller('email')
export class EmailController {
    constructor(private readonly emailService: EmailService) {}

    @Get('pixel')
    public async updateOpening(@Query('id') emailId: string, @Res() res) {
        await this.emailService.updateEmailOpening(emailId);

        const transparentPixel = Buffer.from(
            'iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAQAAAC1HAwCAAAAC0lEQVR42mP8/58HAAMBAQAYE3nOAAAAAElFTkSuQmCC',
            'base64',
        );

        res.setHeader('Content-Type', 'image/png');
        res.setHeader('Content-Length', transparentPixel.length);
        res.send(transparentPixel);
    }

    @Get('unsubscribe')
    public async unsubscribe(
        @Query('u') userId: string,
        @Query('t') token: string,
        @Res() res,
    ) {
        await this.emailService.unsubscribeNewsletter(userId, token, res);
    }
}
