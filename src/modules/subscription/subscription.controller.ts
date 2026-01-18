import { Body, Controller, Get, Post } from '@nestjs/common';
import { SubscriptionService } from './subscription.service';
import { GetUser } from 'src/common/decorators/get-user.decorator';
import { User } from '../user/entities/user.entity';

@Controller('sub')
export class SubscriptionController {
  constructor(private readonly subscriptionService: SubscriptionService) {}

  @Get('me')
  async getMySubscription(@GetUser() user: User) {
    const subscription = await this.subscriptionService.getActiveSubscription(
      user.id,
    );
    return {
      data: {
        subscription,
      },
    };
  }
  @Post('cancel')
  cancelSubscription(@GetUser() user: User) {
    /**
     * User cancels: You call Stripe cancel_at_period_end = true.
     * DB Update: Set cancelAtPeriodEnd = true.
     * User keeps Pro: They can still use 30,000 credits until nextBillingDate.
     * Month Ends: Stripe sends customer.subscription.deleted webhook.
     * DB Update: Set status = CANCELLED. User loses access.
     */
    return this.subscriptionService.cancelSubscription(user.id.toString());
  }
}
