import { IsEnum, IsNotEmpty, IsUUID } from 'class-validator';
import { SubscriptionType } from 'src/common/enums/subscription.enum';

export class CheckoutDo {
  @IsUUID()
  @IsNotEmpty()
  planId: string;

  @IsEnum(SubscriptionType, {
    message:
      'Invalid subscription type the subscription type must be monthly or yearly',
  })
  @IsNotEmpty()
  subscriptionType: SubscriptionType;
}
