import {
    Controller,
    Get,
    Body,
    Post,
    Put,
    Param,
    Delete,
    Query,
    RouterSchema,
} from '@cmmv/http';

import { AuthGroupsService } from '../services/groups.service';

import { Auth } from '../lib/auth.decorator';

import { GroupPayload, GroupRolesPayload } from '../lib/auth.interface';

import { GroupsContract } from '../contracts/groups.contract';

@Controller('auth')
export class AuthGroupsController {
    constructor(private readonly groupsService: AuthGroupsService) {}

    @Get('group-get-all', {
        contract: GroupsContract,
        schema: RouterSchema.GetAll,
        summary: 'Returns the list with all groups in the system',
        exposeFilters: false,
        exclude: true,
    })
    @Auth({ rootOnly: true })
    async handlerGroupGetAll() {
        return this.groupsService.getAllGroups();
    }

    @Get('group-get-in', {
        contract: GroupsContract,
        schema: RouterSchema.GetIn,
        exclude: true,
    })
    @Auth({ rootOnly: true })
    async handlerGroupGetIn(@Query('ids') ids: string[] | string) {
        return this.groupsService.getGroupsIn(ids);
    }

    @Post('group-create', { exclude: true })
    @Auth({ rootOnly: true })
    async handlerCreateGroup(@Body() payload: GroupPayload) {
        return this.groupsService.createGroup(payload);
    }

    @Put('group-update/:groupId', { exclude: true })
    @Auth({ rootOnly: true })
    async handlerUpdateGroup(
        @Param('groupId') groupId,
        @Body() payload: GroupPayload,
    ) {
        return this.groupsService.updateGroup(groupId, payload);
    }

    @Delete('group-delete/:groupId', { exclude: true })
    @Auth({ rootOnly: true })
    async handlerDeleteGroup(@Param('groupId') groupId) {
        return this.groupsService.deleteGroup(groupId);
    }

    @Put('group-assign-roles/:groupId', { exclude: true })
    @Auth({ rootOnly: true })
    async handlerAssignRolesToGroup(
        @Param('groupId') groupId,
        @Body() payload: GroupRolesPayload,
    ) {
        return this.groupsService.assignRolesToGroup(groupId, payload.roles);
    }

    @Put('group-remove-roles/:groupId', { exclude: true })
    @Auth({ rootOnly: true })
    async handlerRemoveRolesFromGroup(
        @Param('groupId') groupId,
        @Body() payload: GroupRolesPayload,
    ) {
        return this.groupsService.removeRolesFromGroup(groupId, payload.roles);
    }
}
