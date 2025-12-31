import { IsEnum, IsUUID } from 'class-validator';
import { SubscriptionType } from 'src/common/enums/subscription.enum';

export class CheckoutDo {
  @IsUUID()
  planId: string;

  @IsEnum(SubscriptionType, {
    message:
      'Invalid subscription type the subscription type must be monthly or yearly',
  })
  subscriptionType: SubscriptionType;
}
