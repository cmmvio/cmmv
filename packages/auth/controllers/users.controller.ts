import {
    Controller,
    Post,
    Body,
    Get,
    Header,
    Delete,
    Put,
    Param,
    User,
} from '@cmmv/http';

import { AuthUsersService } from '../services/users.service';
import { Auth } from '../lib/auth.decorator';

@Controller('auth')
export class AuthUsersController {
    constructor(private readonly usersService: AuthUsersService) {}

    @Get('user')
    @Auth()
    async user(@User() user) {
        return user;
    }

    /* Block User */
    @Put('user-block/:userId')
    @Auth({ rootOnly: true })
    async handlerBlockUser(@Param('userId') userId) {
        return this.usersService.blockUser(userId);
    }

    @Put('user-unblock/:userId')
    @Auth({ rootOnly: true })
    async handlerUnblockUser(@Param('userId') userId) {
        return this.usersService.unblockUser(userId);
    }

    /* Groups */
    @Put('user-assign-to-groups/:userId')
    @Auth({ rootOnly: true })
    async handlerAssignGroupsToUser(
        @Param('userId') userId,
        @Body() payload: { groups: string | string[] },
    ) {
        return this.usersService.assignGroupsToUser(userId, payload.groups);
    }

    @Delete('user-remove-groups/:userId')
    @Auth({ rootOnly: true })
    async handlerRemoveGroups(
        @Param('userId') userId,
        @Body() payload: { groups: string | string[] },
    ) {
        return this.usersService.removeGroupsFromUser(userId, payload.groups);
    }
}
