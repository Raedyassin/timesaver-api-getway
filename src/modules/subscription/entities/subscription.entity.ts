import { BaseEntityProps } from 'src/common/entities/base.entity';
import {
  SubScriptionStatus,
  SubscriptionType,
} from 'src/common/enums/subscription.enum';
import { Plan } from 'src/modules/plan/entities/plan.entity';
import { User } from 'src/modules/user/entities/user.entity';
import { Column, Entity, ManyToOne, Index, JoinColumn } from 'typeorm';

@Entity('subscriptions')
@Index(['userId', 'status']) // CRITICAL: Speeds up "Get Active Subscriptions"
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

  @Column({ nullable: true, unique: true })
  stripeSubscriptionId: string;

  @Column({ type: 'int', default: 0 })
  creditsUsed: number; // Resets to 0 on new subscription creation

  @Column({ type: 'int', default: 0 })
  creditsResetCount: number; // Tracks how many times credits were reset (optional analytics)

  @Column({ type: 'enum', enum: SubscriptionType })
  subscriptionType: SubscriptionType; // monthly or yearly

  // Using startDate is better than endDate for history tracking
  @Column({ type: 'timestamp', default: () => 'CURRENT_TIMESTAMP' })
  startDate: Date;

  @Column({ type: 'timestamp', nullable: true })
  nextBillingDate: Date; // When the cycle ends

  @Column({
    type: 'enum',
    enum: SubScriptionStatus,
    default: SubScriptionStatus.ACTIVE,
  })
  status: SubScriptionStatus;

  @Column({ type: 'boolean', default: false })
  cancelAtPeriodEnd: boolean;
}
