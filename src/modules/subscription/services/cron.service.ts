import { Injectable, Logger } from '@nestjs/common';
import { Cron, CronExpression } from '@nestjs/schedule';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository, LessThanOrEqual } from 'typeorm';
import { Subscription } from '../entities/subscription.entity';
import {
  SubScriptionStatus,
  SubscriptionType,
} from 'src/common/enums/subscription.enum';

@Injectable()
export class CronService {
  private readonly logger = new Logger(CronService.name);

  constructor(
    @InjectRepository(Subscription)
    private readonly subscriptionRepo: Repository<Subscription>,
  ) {}

  // Runs every day at 00:00
  @Cron(CronExpression.EVERY_DAY_AT_MIDNIGHT)
  async handleMonthlyResetForYearlySubs() {
    this.logger.log(
      'Checking for yearly subscribers due for their monthly credit reset...',
    );

    // 1. Determine the cutoff (Exactly one month ago from right now)
    const oneMonthAgo = new Date();
    oneMonthAgo.setMonth(oneMonthAgo.getMonth() - 1);

    const dueSubscriptions = await this.subscriptionRepo.find({
      where: {
        subscriptionType: SubscriptionType.YEARLY,
        status: SubScriptionStatus.ACTIVE,
        lastCreditsResetAt: LessThanOrEqual(oneMonthAgo),
      },
    });

    if (dueSubscriptions.length === 0) {
      this.logger.log('No subscriptions due for reset today.');
      return;
    }

    // 3. Update them
    for (const sub of dueSubscriptions) {
      try {
        await this.subscriptionRepo.update(sub.id, {
          creditsUsed: 0,
          extraCredits: 0,
          lastCreditsResetAt: new Date(), // Set to today so they wait another month
          creditsResetCount: sub.creditsResetCount + 1,
        });
      } catch (err) {
        this.logger.error(
          `Failed to reset credits for sub ${sub.id}: ${err.message}`,
        );
      }
    }

    this.logger.log(
      `Successfully reset credits for ${dueSubscriptions.length} subscribers.`,
    );
  }
}
/*
📝 Technical Issue: Monthly Credit Reset Drift(The "31st" Problem)
Problem Description
  Our current credit reset logic for yearly subscribers uses the JavaScript
  Date.setMonth() method to determine if one month has passed.Because calendar 
  months have varying lengths(28, 29, 30, or 31 days), users who subscribe on the
  31st day of a month will experience a "reset drift" during shorter months.
The Scenario
1. User Subscribes: August 31st.

2. September Check: September only has 30 days. When the Cron runs on Sept 30th, the logic Today - 1 Month points to August 30th. Since the user's last reset was August 31st, the condition LastReset <= OneMonthAgo is False.

3. October Check: On October 1st, Today - 1 Month points to September 1st. The condition becomes True.

4. Result: The user effectively waits 31 days and their "Monthly Reset Day" permanently moves from the 31st to the 1st of the next month.

Current Impact
  - Low Priority: The user still gets their 12 resets per year.

  - User Experience: A user might be confused why their credits arrived on the 1st instead of the 30th / 31st.
  
Proposed Future Solutions
  - Option A(Last Day Alignment): Modify the Cron to check if Today is the 
    last day of the month.If it is, reset all users whose subscriptionDay is $\ge$
    Today.
  - Option B(Fixed 30 - Day Cycle): Ignore calendar months entirely and reset 
    strictly every 30 days(Today - 30 days).
  - Option C(Moment.js / Day.js): Use a 
    library like Day.js with the duration plugin, which has built -in handling for 
    month - end rounding.
*/
