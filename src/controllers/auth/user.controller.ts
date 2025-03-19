import { Controller } from '@cmmv/http';

import { UserControllerGenerated } from '@generated/controllers/auth/user.controller';

@Controller('user')
export class UserController extends UserControllerGenerated {}
