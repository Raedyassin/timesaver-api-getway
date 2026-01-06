import { BaseEntityProps } from 'src/common/entities/base.entity';
import {
  SubScriptionStatus,
  SubscriptionType,
} from 'src/common/enums/subscription.enum';
import { Plan } from 'src/modules/plan/entities/plan.entity';
import { User } from 'src/modules/user/entities/user.entity';
import { Column, Entity, ManyToOne } from 'typeorm';

@Entity('subscriptions')
export class Subscription extends BaseEntityProps {
  @ManyToOne(() => User, (user) => user.subscription)
  user: User;

  @ManyToOne(() => Plan, (plan) => plan.subscription)
  plan: Plan;

  @Column({ nullable: true, unique: true })
  stripeSubscriptionId: string;

  @Column({ type: 'int', default: 0 })
  creditsUsed: number;

  @Column({
    type: 'enum',
    enum: SubscriptionType,
  }) // monthly or yearly
  subscriptionType: SubscriptionType;

  @Column({ type: 'timestamp', nullable: true })
  endDate: Date;

  @Column({
    type: 'enum',
    enum: SubScriptionStatus,
    default: SubScriptionStatus.ACTIVE,
  })
  status: SubScriptionStatus;

  @Column({ type: 'boolean', default: false })
  cancelAtPeriodEnd: boolean;
}
