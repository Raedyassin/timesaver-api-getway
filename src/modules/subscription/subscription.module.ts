import { forwardRef, Module } from '@nestjs/common';
import { SubscriptionService } from './subscription.service';
import { SubscriptionController } from './subscription.controller';
import { TypeOrmModule } from '@nestjs/typeorm';
import { Subscription } from './entities/subscription.entity';
import { PlanModule } from '../plan/plan.module';
import { PaymentModule } from '../payment/payment.module';
import { CronService } from './services/cron.service';

@Module({
  imports: [
    TypeOrmModule.forFeature([Subscription]),
    PlanModule,
    forwardRef(() => PaymentModule),
  ],
  controllers: [SubscriptionController],
  providers: [SubscriptionService, CronService],
  exports: [SubscriptionService],
})
export class SubscriptionModule {}
