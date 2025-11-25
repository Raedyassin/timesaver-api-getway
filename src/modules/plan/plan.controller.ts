import {
  Controller,
  Get,
  Post,
  Body,
  Patch,
  Param,
  Delete,
  Query,
} from '@nestjs/common';
import { PlanService } from './plan.service';
import { CreatePlanDto } from './dto/create-plan.dto';
import { UpdatePlanDto } from './dto/update-plan.dto';
import { Public } from 'src/common/decorators/public.decorator';
import { GetUser } from 'src/common/decorators/get-user.decorator';
import { User } from '../user/entities/user.entity';
import { UserRoles } from 'src/common/decorators/user-role.decorator';
import { Roles } from 'src/common/enums/role.enum';
import { PlanQueryDto } from './dto/plan-query.dto';

@Controller('plan')
export class PlanController {
  constructor(private readonly planService: PlanService) {}

  @Post()
  @UserRoles(Roles.ADMIN)
  create(@Body() createPlanDto: CreatePlanDto, @GetUser() user: User) {
    return this.planService.create(createPlanDto, user.id.toString());
  }

  @Patch(':id')
  @UserRoles(Roles.ADMIN)
  update(
    @Param('id') id: string,
    @Body() updatePlanDto: UpdatePlanDto,
    @GetUser() user: User,
  ) {
    return this.planService.update(id, updatePlanDto, user.id.toString());
  }

  // why i sperate getOne and getAll for admin because the only admin how can
  // see all plans for all users (like custome plans) or deleted plans
  @Get('admin')
  @UserRoles(Roles.ADMIN)
  findAllForAdmin(@Query() query: PlanQueryDto) {
    return this.planService.findAllForAdmin(query);
  }

  @Get('admin/:id')
  @UserRoles(Roles.ADMIN)
  findOneForAdmin(@Param('id') id: string) {
    return this.planService.findOneForAdmin(id);
  }

  @Delete(':id')
  @UserRoles(Roles.ADMIN)
  remove(@Param('id') id: string, @GetUser() user: User) {
    return this.planService.remove(id, user.id.toString());
  }

  // ********** public for users subscription and showing plans **********

  @Public()
  @Get()
  findAll() {
    /**
     * we will add only two or three plans for public users and
     * another plans will be added by admin for custom requirements for specific users
     */
    return this.planService.findAll();
  }

  @Public()
  @Get(':id')
  findOne(@Param('id') id: string) {
    return this.planService.findOne(id);
  }
}
