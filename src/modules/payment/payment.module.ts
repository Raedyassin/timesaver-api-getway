import { forwardRef, Module } from '@nestjs/common';
import { StripePaymentService } from './stripe.service';
import { PaymentController } from './payment.controller';
import { PlanModule } from 'src/modules/plan/plan.module';
import { SubscriptionModule } from 'src/modules/subscription/subscription.module';

@Module({
  // FIX: Use forwardRef to break the circular dependency loop
  imports: [forwardRef(() => SubscriptionModule), PlanModule],
  controllers: [PaymentController],
  providers: [StripePaymentService],
  exports: [StripePaymentService],
})
export class PaymentModule {}
