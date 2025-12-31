import { Body, Controller, Headers, Post, Req } from '@nestjs/common';
import { StripePaymentService } from './stripe.service';
import { GetUser } from 'src/common/decorators/get-user.decorator';
import { User } from 'src/modules/user/entities/user.entity';
import { CheckoutDo } from './dto/checkout.dto';

@Controller('payment')
export class PaymentController {
  constructor(private readonly stripePaymentService: StripePaymentService) {}

  @Post('checkout')
  async createCheckout(@Body() checkoutDo: CheckoutDo, @GetUser() user: User) {
    return this.stripePaymentService.createCheckoutSession(checkoutDo, user);
  }

  @Post('webhook')
  webhook(@Req() req, @Headers('stripe-signature') signature: string) {
    return this.stripePaymentService.handleWebhook(req.rawBody, signature);
  }
}
