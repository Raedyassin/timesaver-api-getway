import { BaseEntityProps } from 'src/common/entities/base.ent';
import { Subscription } from 'src/modules/subscription/entities/subscription.entity';
import { Column, Entity, OneToMany } from 'typeorm';

@Entity('plans')
export class Plan extends BaseEntityProps {
  @OneToMany(() => Subscription, (subscription) => subscription.plan)
  subscription: Subscription[];

  @Column('varchar')
  name: string;

  @Column({ type: 'float', name: 'monthly_price' })
  monthlyPrice: number;

  @Column({ type: 'float', name: 'monthly_discount' })
  monthlyDiscount: number;

  @Column({ type: 'float', name: 'yearly_price' })
  yearlyPrice: number;

  @Column({ type: 'float', name: 'yearly_discount' })
  yearlyDiscount: number;

  @Column('varchar')
  description: string;

  @Column({ type: 'boolean', default: false })
  custom: boolean;

  // Credits is the mange units for the user cost
  @Column({ type: 'int', default: 0, name: 'credits_per_month' })
  creditsPerMonth: number;

  // add it in the future
  // @Column({ type: 'array', nullable: true })
  // aiModel?: string[]; // 'standard' | 'advanced'

  // potential columns for make them in sperate class then extend this class
  // but the only plan how is just use theme until now (createdBy, updatedBy)
  @Column({ type: 'uuid', nullable: true })
  createdBy: string;

  @Column({ type: 'uuid', nullable: true })
  updatedBy: string;
  /**
   * why don't use relationships? between plan and user for createdBy and updatedBy?
   * 
   * Audit history shouldn’t break if user is deleted (he will not be deleted because we are using soft delete)
      - If the User is removed, the plan still exists.
      - If you had a foreign key with CASCADE, the plan row could be deleted accidentally.
   * Performance
      - No join needed to write a plan → insert is faster.
      - High-traffic systems avoid unnecessary relations for logging/audit fields.
   * Simplicity
      - You only need the ID for most auditing/logging purposes.
      - Can still join later if needed manually
   */
}
