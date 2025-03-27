import { Module } from '@cmmv/core';

import { EmailConfig } from './email.config';
import { EmailService } from './email.service';
import { EmailController } from './email.controller';

import { EmailSendingContract } from './email.contract';

export const EmailModule = new Module('email', {
    configs: [EmailConfig],
    providers: [EmailService],
    contracts: [EmailSendingContract],
    controllers: [EmailController],
});
