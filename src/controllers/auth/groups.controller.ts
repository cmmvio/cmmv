import { Controller } from '@cmmv/http';

import { GroupsControllerGenerated } from '@generated/controllers/auth/groups.controller';

@Controller('groups')
export class GroupsController extends GroupsControllerGenerated {}
