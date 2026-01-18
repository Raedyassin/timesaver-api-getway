import {
  BadRequestException,
  forwardRef,
  Inject,
  Injectable,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Subscription } from './entities/subscription.entity';
import { Repository } from 'typeorm';
import { SubScriptionStatus } from 'src/common/enums/subscription.enum';
import { StripePaymentService } from '../payment/stripe.service';

@Injectable()
export class SubscriptionService {
  constructor(
    @InjectRepository(Subscription)
    private readonly subscriptionRepository: Repository<Subscription>,
    @Inject(forwardRef(() => StripePaymentService))
    private readonly stripeService: StripePaymentService,
  ) {}

  async getActiveSubscription(userId: string) {
    // Find the LATEST active subscription
    return this.subscriptionRepository.findOne({
      where: { userId, status: SubScriptionStatus.ACTIVE },
      order: { createdAt: 'DESC' }, // Get newest
      relations: ['plan'], // Load Plan to see 'creditsPerMonth'
    });
  }
  async cancelSubscription(userId: string) {
    // 1. Get Active Subscription
    const sub = await this.subscriptionRepository.findOne({
      where: { userId, status: SubScriptionStatus.ACTIVE },
      order: { createdAt: 'DESC' },
    });

    if (!sub) throw new BadRequestException('No active subscription found');

    // 2. Call Stripe to Cancel at Period End
    // This ensures we don't charge them again
    await this.stripeService.cancelAtPeriodEnd(sub.stripeSubscriptionId);

    // 3. Update Database
    // We mark cancelAtPeriodEnd = true
    sub.cancelAtPeriodEnd = true;
    await this.subscriptionRepository.save(sub);

    return {
      message:
        'Subscription cancelled. You still have access until ' +
        sub.nextBillingDate.toDateString(),
    };
  }

  async save(subscription: Subscription) {
    return this.subscriptionRepository.save(subscription);
  }
  async findSubscriptionByUserId(userId: string) {
    return this.subscriptionRepository.findOne({
      where: { userId, status: SubScriptionStatus.ACTIVE },
      order: { createdAt: 'DESC' },
    });
  }
  async findSubscriptionByStripeId(stripeSubId: string) {
    return this.subscriptionRepository.findOne({
      where: { stripeSubscriptionId: stripeSubId },
      order: { createdAt: 'DESC' },
    });
  }
}
