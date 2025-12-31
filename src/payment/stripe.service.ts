import { Injectable, BadRequestException } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { User } from 'src/modules/user/entities/user.entity';
import { UserService } from 'src/modules/user/user.service';
import Stripe from 'stripe';
import { CheckoutDo } from './dto/checkout.dto';
import { PlanService } from 'src/modules/plan/plan.service';
import { SubscriptionType } from 'src/common/enums/subscription.enum';
import Decimal from 'decimal.js';
import { LoggerService } from 'src/modules/logger/logger.service';
import { RedisService } from 'src/modules/redis/redis.service';
import { Subscription } from 'src/modules/subscription/entities/subscription.entity';
import { SubscriptionService } from 'src/modules/subscription/subscription.service';

@Injectable()
export class StripePaymentService {
  private stripe: Stripe;

  constructor(
    private readonly userService: UserService,
    private readonly configService: ConfigService,
    private readonly planService: PlanService,
    private readonly logger: LoggerService,
    private readonly redisService: RedisService,
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
    const plan = await this.claclulatePlanPricing(checkoutDo);
    const session = await this.stripe.checkout.sessions.create({
      mode: 'subscription',
      payment_method_types: ['card'],
      customer_email: user.email,
      line_items: [
        {
          price_data: {
            currency: 'usd',
            product_data: {
              name: plan.name,
            },
            recurring: {
              interval:
                checkoutDo.subscriptionType === SubscriptionType.YEARLY
                  ? 'year'
                  : 'month',
            },
            unit_amount: plan.totalprice,
          },
          quantity: 1,
        },
      ],
      metadata: { userId: user.id.toString() },
      success_url:
        this.configService.getOrThrow<string>('OUR_DOMAIN_URL') + '/success',
      cancel_url:
        this.configService.getOrThrow<string>('OUR_DOMAIN_URL') + '/cancel',
    });
    this.logger.info(
      `Checkout session created for user ${user.id} with id stripe session Id ${session.id} to subscripe plan ${plan.id} ${checkoutDo.subscriptionType}`,
    );
    await this.redisService.set(
      `checkout:${user.id}`,
      {
        user,
        plan: {
          ...checkoutDo,
          credits: plan.creditsPerMonth,
        },
      },
      this.configService.getOrThrow<number>('STRIP_TTL_FOR_RES'),
    );
    return {
      data: {
        url: session.url,
      },
    };
  }

  async handleWebhook(rawBody: Buffer, signature: string) {
    let event: Stripe.Event;
    try {
      event = this.stripe.webhooks.constructEvent(
        rawBody,
        signature,
        this.configService.getOrThrow<string>('STRIPE_WEBHOOK_SECRET'),
      );
    } catch {
      // this.logger.error(
      //   `⚠️  Webhook signature verification failed.`,
      //   err.message,
      // );
      throw new BadRequestException('Invalid Stripe signature');
    }

    switch (event.type) {
      case 'checkout.session.completed': {
        const session = event.data.object;
        const userId = session?.metadata?.userId;
        const { user, plan } = (await this.redisService.get(
          `checkout:${userId}`,
        )) as {
          user: User;
          plan: Record<string, any>;
        };
        const subscripe = new Subscription();
        subscripe.user = user;
        subscripe.plan = plan.planId;
        subscripe.subscriptionType = plan.subscriptionType;
        const now = new Date();
        subscripe.endDate = new Date(now);
        subscripe.endDate.setMonth(
          now.getMonth() +
            (plan.subscriptionType === SubscriptionType.MONTHLY ? 1 : 12),
        );
        subscripe.creditsUsed = plan.credits;
        subscripe.stripeSubscriptionId = session.subscription as string;
        await this.subscriptionService.save(subscripe);
        await this.redisService.del(`checkout:${userId}`);
        this.logger.info(
          `Checkout session completed for user ${userId}, for session id ${session.id} to subscripe plan ${plan.id}`,
        );
        break;
      }

      case 'invoice.payment_failed': {
        const invoice = event.data.object;
        const userId = invoice.metadata?.userId;
        await this.redisService.del(`checkout:${userId}`);
        this.logger.info(
          `Invoice payment failed for user ${userId}, for invoice id ${invoice.id}`,
        );
        break;
      }
    }
    return { received: true };
  }

  async createCustomerPortal(customerId: string) {
    const portalSession = await this.stripe.billingPortal.sessions.create({
      customer: customerId,
      return_url: 'https://your-app.com/dashboard',
    });
    return portalSession.url;
  }

  private async claclulatePlanPricing(checkoutDo: CheckoutDo) {
    const plan = await this.planService.findPlanById(checkoutDo.planId);
    let price: number;
    let discount: number = 0;
    if (checkoutDo.subscriptionType === SubscriptionType.MONTHLY) {
      price = plan.monthlyPrice;
      discount = plan.monthlyDiscount;
    } else {
      price = plan.yearlyPrice;
      discount = plan.yearlyDiscount;
    }
    let totalprice = price;
    if (discount) {
      discount = Math.min(Math.max(discount, 0), 100);
      // user Decimal to solve floating point issue in js
      const discountDecimal = new Decimal(discount);
      const priceDecimal = new Decimal(price);
      const finalPrice = priceDecimal
        .mul(Decimal.sub(100, discountDecimal))
        .div(100)
        .toFixed(2);
      totalprice = Number(finalPrice);
    }
    return { totalprice, ...plan };
  }
}
