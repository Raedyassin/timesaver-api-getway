import {
  BadRequestException,
  forwardRef,
  Inject,
  Injectable,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Subscription } from './entities/subscription.entity';
import { Repository } from 'typeorm';
import {
  SubScriptionStatus,
  SubscriptionType,
} from 'src/common/enums/subscription.enum';
import { StripePaymentService } from '../payment/stripe.service';
import { LoggerService } from '../logger/logger.service';
import { FREE_PLAN_ID } from 'src/common/enums/plan.enum';

@Injectable()
export class SubscriptionService {
  constructor(
    @InjectRepository(Subscription)
    private readonly subscriptionRepository: Repository<Subscription>,
    @Inject(forwardRef(() => StripePaymentService))
    private readonly stripeService: StripePaymentService,
    private readonly logger: LoggerService,
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
      relations: ['plan'],
    });

    if (!sub) throw new BadRequestException('No active subscription found');

    if (sub.plan.id === FREE_PLAN_ID) {
      throw new BadRequestException('You can not cancel free trial plan');
    }
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

  async freeTrialSubscription(userId: string) {
    const sub = new Subscription();
    sub.userId = userId;
    // we should create a free trial plan
    sub.planId = FREE_PLAN_ID;
    sub.subscriptionType = SubscriptionType.ONETIME;
    sub.nextBillingDate = new Date();
    sub.nextBillingDate.setMonth(sub.nextBillingDate.getMonth() + 1);
    await this.subscriptionRepository.save(sub);
    this.logger.info(
      `User ${userId} subscribed for free trial plan, id ${sub.planId}`,
    );
  }

  async updateSubscriptionCredits(userId: string, credits: number) {
    const sub = await this.subscriptionRepository.findOne({
      where: { userId, status: SubScriptionStatus.ACTIVE },
      order: { createdAt: 'DESC' },
      relations: ['plan'],
    });
    if (!sub) throw new BadRequestException('No active subscription found');
    sub.creditsUsed += credits;
    // Don't let them go over (we can make the user if he use his all credits but
    // we make the request befor check we will let them go this time but next
    // time we will check(in credits guard))
    const allUserCredits = sub.plan.creditsPerMonth + sub.extraCredits;
    if (sub.creditsUsed >= allUserCredits) {
      sub.creditsUsed = allUserCredits;
    }
    await this.subscriptionRepository.update(sub.id, {
      creditsUsed: sub.creditsUsed,
    });
  }

  async save(subscription: Subscription) {
    return this.subscriptionRepository.save(subscription);
  }
  async findSubscriptionByUserId(userId: string) {
    return this.subscriptionRepository.findOne({
      where: { userId, status: SubScriptionStatus.ACTIVE },
      order: { createdAt: 'DESC' },
      relations: ['plan'],
    });
  }
  async findSubscriptionByStripeId(stripeSubId: string) {
    return this.subscriptionRepository.findOne({
      where: { stripeSubscriptionId: stripeSubId },
      order: { createdAt: 'DESC' },
    });
  }

  /** *****************************  admin ***************************** */
  async getAllSubscriptions() {
    const subs = await this.subscriptionRepository.find();
    return {
      data: {
        subscriptions: subs,
      },
    };
  }
}
