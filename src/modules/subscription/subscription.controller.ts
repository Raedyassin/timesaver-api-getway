import { Body, Controller, Get } from '@nestjs/common';
import { SubscriptionService } from './subscription.service';
import { GetUser } from 'src/common/decorators/get-user.decorator';
import { User } from '../user/entities/user.entity';

@Controller('sub')
export class SubscriptionController {
  constructor(private readonly subscriptionService: SubscriptionService) {}

  @Get('me')
  async getMySubscription(@GetUser() user: User) {
    const subscription =
      await this.subscriptionService.findSubscriptionByUserId(user.id);
    return {
      data: {
        subscription,
      },
    };
  }
}
