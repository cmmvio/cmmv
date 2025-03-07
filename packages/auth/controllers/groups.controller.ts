import { Controller, Get, Body, Post, Put, Param, Delete } from '@cmmv/http';

import { AuthGroupsService } from '../services/groups.service';

import { Auth } from '../lib/auth.decorator';

import { GroupPayload, GroupRolesPayload } from '../lib/auth.interface';

@Controller('auth')
export class AuthGroupsController {
    constructor(private readonly groupsService: AuthGroupsService) {}

    @Get('group-getall')
    @Auth({ rootOnly: true })
    async handlerGroupGetAll() {
        return this.groupsService.getAllGroups();
    }

    @Post('group-create')
    @Auth({ rootOnly: true })
    async handlerCreateGroup(@Body() payload: GroupPayload) {
        return this.groupsService.createGroup(payload);
    }

    @Put('group-update/:groupId')
    @Auth({ rootOnly: true })
    async handlerUpdateGroup(
        @Param('groupId') groupId,
        @Body() payload: GroupPayload,
    ) {
        return this.groupsService.updateGroup(groupId, payload);
    }

    @Delete('group-delete/:groupId')
    @Auth({ rootOnly: true })
    async handlerDeleteGroup(@Param('groupId') groupId) {
        return this.groupsService.deleteGroup(groupId);
    }

    @Put('group-assign-roles/:groupId')
    @Auth({ rootOnly: true })
    async handlerAssignRolesToGroup(
        @Param('groupId') groupId,
        @Body() payload: GroupRolesPayload,
    ) {
        return this.groupsService.assignRolesToGroup(groupId, payload.roles);
    }

    @Put('group-remove-roles/:groupId')
    @Auth({ rootOnly: true })
    async handlerRemoveRolesFromGroup(
        @Param('groupId') groupId,
        @Body() payload: GroupRolesPayload,
    ) {
        return this.groupsService.removeRolesFromGroup(groupId, payload.roles);
    }
}
