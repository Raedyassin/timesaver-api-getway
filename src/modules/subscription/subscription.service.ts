import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Subscription } from './entities/subscription.entity';
import { Repository } from 'typeorm';
import { SubScriptionStatus } from 'src/common/enums/subscription.enum';

@Injectable()
export class SubscriptionService {
  constructor(
    @InjectRepository(Subscription)
    private readonly subscriptionRepository: Repository<Subscription>,
  ) {}
  async save(subscription: Subscription) {
    return this.subscriptionRepository.save(subscription);
  }
  async findSubscriptionByUserId(userId: string) {
    return this.subscriptionRepository.findOne({
      where: { user: { id: userId }, status: SubScriptionStatus.ACTIVE },
      relations: ['user', 'plan'],
    });
  }
}
