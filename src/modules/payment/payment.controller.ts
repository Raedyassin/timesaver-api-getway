import { Body, Controller, Headers, Post, Req } from '@nestjs/common';
import { StripePaymentService } from './stripe.service';
import { GetUser } from 'src/common/decorators/get-user.decorator';
import { User } from 'src/modules/user/entities/user.entity';
import { CheckoutDo } from './dto/checkout.dto';

@Controller('payment')
export class PaymentController {
  constructor(private readonly stripePaymentService: StripePaymentService) {}

  @Post('stripe/checkout')
  async createCheckout(@Body() checkoutDo: CheckoutDo, @GetUser() user: User) {
    return this.stripePaymentService.createCheckoutSession(checkoutDo, user);
  }

  @Post('stripe/webhook')
  webhook(
    @Req() req,
    @Headers('stripe-signature') signature: string,
  ): Promise<any> {
    return this.stripePaymentService.handleWebhook(
      // req.rawBody as Buffer,
      req.body as Buffer,
      signature,
    );
  }
}
