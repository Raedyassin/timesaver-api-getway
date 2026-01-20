import {
  BadRequestException,
  CanActivate,
  ExecutionContext,
  ForbiddenException,
  Injectable,
} from '@nestjs/common';
import { Request } from 'express';
import { SubscriptionService } from 'src/modules/subscription/subscription.service';
import { User } from 'src/modules/user/entities/user.entity';

@Injectable()
export class CreditsGuard implements CanActivate {
  constructor(private readonly subscriptionService: SubscriptionService) {}
  async canActivate(context: ExecutionContext): Promise<boolean> {
    const request = context.switchToHttp().getRequest<Request>();

    const user = request.user as User;
    const sub = await this.subscriptionService.findSubscriptionByUserId(
      user.id,
    );
    if (!sub) {
      throw new BadRequestException(
        'No active subscription found, please subscribe first',
      );
    }
    const totalCredits = sub.plan.creditsPerMonth + sub.extraCredits;
    if (sub.creditsUsed >= totalCredits) {
      throw new ForbiddenException(
        'You have used all your credits. Please purchase Extra Credits or wait for renewal.',
      );
    }
    return true;
  }
}
