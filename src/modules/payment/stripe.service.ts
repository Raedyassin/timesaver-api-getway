import {
  Injectable,
  BadRequestException,
  NotFoundException,
  Inject,
  forwardRef,
} from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { User } from 'src/modules/user/entities/user.entity';
import Stripe from 'stripe';
import { CheckoutDo } from './dto/checkout.dto';
import { PlanService } from 'src/modules/plan/plan.service';
import {
  SubScriptionStatus,
  SubscriptionType,
} from 'src/common/enums/subscription.enum';
import { LoggerService } from 'src/modules/logger/logger.service';
import { Subscription } from 'src/modules/subscription/entities/subscription.entity';
import { SubscriptionService } from 'src/modules/subscription/subscription.service';
import { Plan } from '../plan/entities/plan.entity';
import { PlanType } from 'src/common/enums/plan.enum';

@Injectable()
export class StripePaymentService {
  private stripe: Stripe;

  constructor(
    private readonly configService: ConfigService,
    private readonly planService: PlanService,
    private readonly logger: LoggerService,
    @Inject(forwardRef(() => SubscriptionService))
    private readonly subscriptionService: SubscriptionService,
  ) {
    this.stripe = new Stripe(
      configService.getOrThrow<string>('STRIPE_SECRET_KEY'),
      {
        apiVersion: '2025-11-17.clover',
      },
    );
  }

  async createCheckoutSession(checkoutDo: CheckoutDo, user: User) {
    const plan = await this.getPricePlan(checkoutDo);
    let session;
    if (checkoutDo.subscriptionType === SubscriptionType.ONETIME) {
      session = await this.createOneTimeCheckoutSession(checkoutDo, user, plan);
    } else {
      session = await this.createSubscriptionCheckoutSession(
        checkoutDo,
        user,
        plan,
      );
    }
    return {
      data: {
        url: session.url,
      },
    };
  }
  private async createOneTimeCheckoutSession(
    checkoutDo: CheckoutDo,
    user: User,
    plan: Plan & { totalPrice: number },
  ) {
    if (plan.planType != PlanType.EXTRA) {
      throw new BadRequestException('Only extra plans can be ordered onetime');
    }
    const session = await this.stripe.checkout.sessions.create({
      mode: 'payment',
      payment_method_types: ['card'],
      customer_email: user.email,
      line_items: [
        {
          price_data: {
            currency: 'usd',
            unit_amount: plan.totalPrice,
          },
          quantity: 1,
        },
      ],
      metadata: {
        userId: user.id.toString(),
        planId: plan.id,
        subscriptionType: checkoutDo.subscriptionType,
      },
      success_url:
        this.configService.getOrThrow<string>('OUR_DOMAIN_URL') + '/success',
      cancel_url:
        this.configService.getOrThrow<string>('OUR_DOMAIN_URL') + '/cancel',
    });
    this.logger.info(
      `Created one time checkout session for user ${user.id}, plan id ${plan.id} and session id ${session.id}`,
    );
    return session;
  }

  private async createSubscriptionCheckoutSession(
    checkoutDo: CheckoutDo,
    user: User,
    plan: Plan & { totalPrice: number },
  ) {
    if (plan.planType != PlanType.SUBSCRIPTION) {
      throw new BadRequestException('Only subscription plans can be ordered');
    }
    const session = await this.stripe.checkout.sessions.create({
      mode: 'subscription',
      payment_method_types: ['card'],
      customer_email: user.email,
      line_items: [
        {
          price_data: {
            currency: 'usd',
            recurring: {
              interval:
                checkoutDo.subscriptionType === SubscriptionType.YEARLY
                  ? 'year'
                  : 'month',
            },
            unit_amount: plan.totalPrice,
          },
          quantity: 1,
        },
      ],
      metadata: {
        userId: user.id.toString(),
        planId: plan.id,
        subscriptionType: checkoutDo.subscriptionType,
      },
      success_url:
        this.configService.getOrThrow<string>('OUR_DOMAIN_URL') + '/success',
      cancel_url:
        this.configService.getOrThrow<string>('OUR_DOMAIN_URL') + '/cancel',
    });
    this.logger.info(
      `Checkout session created for user ${user.id} with id stripe session Id ${session.id} to subscripe plan ${plan.id} ${checkoutDo.subscriptionType}`,
    );
    return session;
  }

  async handleWebhook(rawBody: Buffer, signature: string) {
    let event: Stripe.Event;
    try {
      event = this.stripe.webhooks.constructEvent(
        rawBody,
        signature,
        this.configService.getOrThrow<string>('STRIPE_WEBHOOK_SECRET'),
      );
    } catch (err) {
      this.logger.error(
        `⚠️  Webhook signature verification failed.`,
        err.message as string,
      );
      throw new BadRequestException('Invalid Stripe signature');
    }
    switch (event.type) {
      // CASE A: User Subscribes (First time)
      case 'checkout.session.completed': {
        const session = event.data.object;
        await this.activatePayment(
          session?.metadata?.userId as string,
          session?.metadata?.planId as string,
          session?.metadata?.subscriptionType as SubscriptionType,
          session?.subscription as string | null,
          session.id,
        );
        break;
      }
      // CASE B: Monthly Renewal (Critical!)
      case 'invoice.payment_succeeded': {
        const invoice = event.data.object;
        const subscriptionId: string = (invoice as any).subscription;
        await this.renewSubscription(subscriptionId);
        break;
      }
      // CASE: Subscription actually ended (Grace period over)
      case 'customer.subscription.deleted': {
        const deletedSub = event.data.object;
        await this.cancelSubscriptionInDatabase(deletedSub.id);
        break;
      }
      // CASE: Subscription failed
      case 'invoice.payment_failed': {
        const invoice = event.data.object;
        const subscriptionId = (invoice as any).subscription;
        this.logger.warn(
          `Invoice payment failed for subscription ${subscriptionId}`,
        );
        break;
      }
      // CASE: stripe webhook not handled
      default:
        this.logger.info(`Unhandled event type: ${event.type}`);
    }
    return { received: true };
  }

  private async activatePayment(
    userId: string,
    planId: string,
    subscriptionType: SubscriptionType,
    stripeSubId: string | null,
    sessionId: string,
  ) {
    const subscripe = new Subscription();
    if (subscriptionType === SubscriptionType.ONETIME) {
      const plan = await this.planService.findPlanById(planId);
      const subscription =
        await this.subscriptionService.findSubscriptionByUserId(userId);
      if (!subscription) {
        this.logger.error(
          `No active subscription found for user ${userId}, plan id ${planId} with stripe sub id ${stripeSubId} and session id ${sessionId} the user pay but there is no active subscription`,
        );
        throw new BadRequestException('No active subscription found');
      }
      subscription.extraCredits += plan.creditsPerMonth;
      subscription.creditsResetCount += 1;
      await this.subscriptionService.save(subscription);
      this.logger.info(
        `Onetime subscribed user ${userId}, plan id ${planId} with stripe sub id ${stripeSubId} and session id ${sessionId}`,
      );
    } else {
      subscripe.userId = userId;
      subscripe.planId = planId;
      subscripe.subscriptionType = subscriptionType as SubscriptionType;
      subscripe.startDate = new Date();
      subscripe.nextBillingDate = new Date();
      subscripe.nextBillingDate.setMonth(
        subscripe.startDate.getMonth() +
          ((subscriptionType as SubscriptionType) === SubscriptionType.MONTHLY
            ? 1
            : 12),
      );
      subscripe.creditsUsed = 0;
      subscripe.stripeSubscriptionId = stripeSubId as string;
      await this.subscriptionService.save(subscripe);
      this.logger.info(
        `Subscribed user ${userId}, plan id ${planId} with stripe sub id ${stripeSubId} and session id ${sessionId}`,
      );
    }
  }

  private async renewSubscription(stripeSubId: string) {
    // 1. Find OLD Subscription
    const oldSub =
      await this.subscriptionService.findSubscriptionByStripeId(stripeSubId);

    if (!oldSub) {
      this.logger.error(
        `This come from renewSubscription method: Subscription not found for stripe sub id ${stripeSubId}`,
      );
      throw new NotFoundException(
        `Subscription not found for stripe sub id ${stripeSubId}`,
      );
    }

    // 2. Mark OLD as Cancelled/Expired (History tracking)
    oldSub.status = SubScriptionStatus.EXPIRED as SubScriptionStatus;
    await this.subscriptionService.save(oldSub);

    const newSub = new Subscription();
    newSub.userId = oldSub.userId;
    newSub.planId = oldSub.planId;
    newSub.subscriptionType = oldSub.subscriptionType;
    newSub.startDate = new Date();
    newSub.nextBillingDate = oldSub.nextBillingDate;
    newSub.creditsUsed = 0;
    newSub.stripeSubscriptionId = stripeSubId;
    newSub.startDate = new Date();
    newSub.nextBillingDate = new Date(newSub.startDate);
    newSub.nextBillingDate.setMonth(
      newSub.startDate.getMonth() +
        (oldSub.subscriptionType === SubscriptionType.MONTHLY ? 1 : 12),
    );
    await this.subscriptionService.save(newSub);

    this.logger.info(
      `Renewed subscription for user ${oldSub.userId} and stripe sub id ${stripeSubId}`,
    );
  }

  // this two methods are about canceling subscription
  async cancelAtPeriodEnd(stripeSubscriptionId: string) {
    await this.stripe.subscriptions.update(stripeSubscriptionId, {
      cancel_at_period_end: true, // <--- CRITICAL: Do not cancel NOW
    });
  }
  async cancelSubscriptionInDatabase(stripeSubscriptionId: string) {
    const sub =
      await this.subscriptionService.findSubscriptionByStripeId(
        stripeSubscriptionId,
      );
    if (sub) {
      sub.status = SubScriptionStatus.CANCELLED; // <--- Finally mark as cancelled
      await this.subscriptionService.save(sub);
    } else {
      this.logger.error(
        `This come from cancelSubscriptionInDatabase method: Subscription not found for stripe sub id ${stripeSubscriptionId}`,
      );
    }
  }

  async createCustomerPortal(customerId: string) {
    const portalSession = await this.stripe.billingPortal.sessions.create({
      customer: customerId,
      return_url: 'https://your-app.com/dashboard',
    });
    return portalSession.url;
  }

  private async getPricePlan(checkoutDo: CheckoutDo) {
    const plan = await this.planService.findPlanById(checkoutDo.planId);
    if (!plan) {
      throw new BadRequestException('Plan not found');
    }
    return {
      ...plan,
      totalPrice:
        checkoutDo.subscriptionType === SubscriptionType.MONTHLY
          ? plan.monthlyPrice
          : plan.yearlyPrice,
    };
  }
}
