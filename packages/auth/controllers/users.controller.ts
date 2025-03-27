import * as fs from 'fs';
import * as path from 'path';

import {
    Controller,
    Body,
    Get,
    Delete,
    Put,
    Param,
    User,
    Query,
    Res,
    HttpException,
    HttpStatus,
} from '@cmmv/http';

import { AuthUsersService } from '../services/users.service';

import { Auth } from '../lib/auth.decorator';
import { Config } from '@cmmv/core';

@Controller('auth')
export class AuthUsersController {
    constructor(private readonly usersService: AuthUsersService) {}

    @Get('user', { exclude: true })
    @Auth()
    async user(@User() user) {
        return user;
    }

    @Get('unsubscribe', { exclude: true })
    async handlerUnsubscribe(
        @Query('u') userId: string,
        @Query('t') token: string,
        @Res() res,
    ) {
        const customTemplate = Config.get<string>('auth.templates.unsubscribe');

        const templatePath = customTemplate
            ? customTemplate
            : path.join(__dirname, '..', 'templates', `unsubscribe.html`);

        if (!fs.existsSync(templatePath))
            throw new HttpException('Template not found', HttpStatus.NOT_FOUND);

        const templateContent = fs.readFileSync(templatePath, 'utf8');

        res.setHeader('Content-Type', 'text/html');
        res.setHeader('Content-Length', templateContent.length);
        res.send(templateContent);

        return false;
    }

    /* Block User */
    @Put('user-block/:userId', { exclude: true })
    @Auth({ rootOnly: true })
    async handlerBlockUser(@Param('userId') userId) {
        return this.usersService.blockUser(userId);
    }

    @Put('user-unblock/:userId', { exclude: true })
    @Auth({ rootOnly: true })
    async handlerUnblockUser(@Param('userId') userId) {
        return this.usersService.unblockUser(userId);
    }

    /* Groups */
    @Put('user-assign-to-groups/:userId', { exclude: true })
    @Auth({ rootOnly: true })
    async handlerAssignGroupsToUser(
        @Param('userId') userId,
        @Body() payload: { groups: string | string[] },
    ) {
        return this.usersService.assignGroupsToUser(userId, payload.groups);
    }

    @Delete('user-remove-groups/:userId', { exclude: true })
    @Auth({ rootOnly: true })
    async handlerRemoveGroups(
        @Param('userId') userId,
        @Body() payload: { groups: string | string[] },
    ) {
        return this.usersService.removeGroupsFromUser(userId, payload.groups);
    }
}
