import { Module } from '@nestjs/common';
import { StripePaymentService } from './stripe.service';
import { PaymentController } from './payment.controller';
import { UserModule } from 'src/modules/user/user.module';
import { PlanModule } from 'src/modules/plan/plan.module';
import { SubscriptionModule } from 'src/modules/subscription/subscription.module';

@Module({
  imports: [UserModule, PlanModule, SubscriptionModule],
  controllers: [PaymentController],
  providers: [StripePaymentService],
})
export class PaymentModule {}
