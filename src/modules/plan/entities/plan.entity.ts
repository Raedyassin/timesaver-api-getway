import { BaseEntityProps } from 'src/common/entities/base.entity';
import { PlanType } from 'src/common/enums/plan.enum';
import { Subscription } from 'src/modules/subscription/entities/subscription.entity';
import { Column, Entity, OneToMany } from 'typeorm';

@Entity('plans')
export class Plan extends BaseEntityProps {
  @OneToMany(() => Subscription, (subscription) => subscription.plan)
  subscription: Subscription[];

  @Column('varchar')
  name: string;

  @Column({
    type: 'enum',
    enum: PlanType,
    default: PlanType.SUBSCRIPTION,
    name: 'plan_type',
  })
  planType: PlanType;

  @Column({ type: 'float', name: 'monthly_price' })
  monthlyPrice: number;

  @Column({ type: 'float', name: 'yearly_price' })
  yearlyPrice: number;

  @Column('varchar')
  description: string;

  @Column('varchar', { array: true, nullable: true })
  features: string[];

  @Column({ type: 'boolean', default: false })
  custom: boolean;

  // Credits is the mange units for the user cost
  @Column({ type: 'int', default: 0, name: 'credits_per_month' })
  creditsPerMonth: number;

  // the createdBy and updatedBy are the user ids for more information
  @Column({ type: 'uuid', nullable: false })
  createdBy: string;

  @Column({ type: 'uuid', nullable: false })
  updatedBy: string;
}
