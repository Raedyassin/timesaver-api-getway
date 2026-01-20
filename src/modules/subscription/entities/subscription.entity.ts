import { BaseEntityProps } from 'src/common/entities/base.entity';
import {
  SubScriptionStatus,
  SubscriptionType,
} from 'src/common/enums/subscription.enum';
import { Plan } from 'src/modules/plan/entities/plan.entity';
import { User } from 'src/modules/user/entities/user.entity';
import { Column, Entity, ManyToOne, Index, JoinColumn } from 'typeorm';

@Entity('subscriptions')
@Index(['userId', 'status'])
export class Subscription extends BaseEntityProps {
  @Column({ type: 'uuid' })
  userId: string; // Storing ID is faster/faster index than full object relation

  @ManyToOne(() => User, (user) => user.subscription)
  @JoinColumn({ name: 'userId' })
  user: User;

  @Column({ type: 'uuid' })
  planId: string;

  @ManyToOne(() => Plan, (plan) => plan.subscription)
  @JoinColumn({ name: 'planId' })
  plan: Plan;

  // Stripe Subscription ID
  @Column({ name: 'stripe_subscription_id', nullable: true })
  stripeSubscriptionId: string;

  @Column({ type: 'enum', enum: SubscriptionType, name: 'subscription_type' })
  subscriptionType: SubscriptionType; // monthly or yearly

  // Using startDate is better than endDate for history tracking
  @Column({
    type: 'timestamp',
    name: 'start_date',
    default: () => 'CURRENT_TIMESTAMP',
  })
  startDate: Date;

  @Column({ type: 'timestamp', name: 'next_billing_date', nullable: true })
  nextBillingDate: Date; // When the cycle ends

  // this for yearly subscriptions
  @Column({
    type: 'timestamp',
    name: 'last_credits_reset_at',
    default: () => 'CURRENT_TIMESTAMP',
  })
  lastCreditsResetAt: Date;

  @Column({
    type: 'enum',
    enum: SubScriptionStatus,
    default: SubScriptionStatus.ACTIVE,
  })
  status: SubScriptionStatus;

  @Column({ type: 'boolean', name: 'cancel_at_period_end', default: false })
  cancelAtPeriodEnd: boolean;

  // CREDITS LOGIC
  // creditsUsed tracks consumption for the CURRENT cycle
  @Column({ type: 'int', name: 'credits_used', default: 0 })
  creditsUsed: number;

  // extraCredits tracks Top-Ups (One-time payments)
  @Column({ type: 'int', name: 'extra_credits', default: 0 })
  extraCredits: number;

  // Optional: Analytics tracking
  @Column({ type: 'int', name: 'extra_credits_reset_count', default: 0 })
  extraCreditsResetCount: number; // Tracks how many times credits were reset (optional analytics)

  // Optional: Analytics tracking this for yearly subscriptions
  @Column({ type: 'int', name: 'credits_reset_count', default: 0 })
  creditsResetCount: number; // Tracks how many times credits were reset (optional analytics)
}
