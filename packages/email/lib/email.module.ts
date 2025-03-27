import { Module } from '@cmmv/core';

import { EmailConfig } from './email.config';
import { EmailService } from './email.service';

export const EmailModule = new Module('email', {
    configs: [EmailConfig],
    providers: [EmailService],
});
