import { Controller, Get } from '@nestjs/common';
import { UserService } from './user.service';
import { UserRoles } from 'src/common/decorators/user-role.decorator';
import { Roles } from 'src/common/enums/role.enum';

@Controller('user')
export class UserController {
  constructor(private readonly userService: UserService) {}

  @UserRoles(Roles.ADMIN)
  @Get()
  findAll() {
    return this.userService.findAll();
  }
}
