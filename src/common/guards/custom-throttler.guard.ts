import { ThrottlerGuard } from '@nestjs/throttler';
import { Injectable } from '@nestjs/common';

@Injectable()
export class UserThrottlerGuard extends ThrottlerGuard {
  /**
   * Customize the rate limit key.
   * You can use userId (if logged in), IP, route, etc.
   */
  protected getTracker(req: any): Promise<string> {
    // Default: IP address
    // x-forwarded-for is a proxy header that contains the client's IP address not the id for proxy
    const ip = req.ip || req.headers['x-forwarded-for'];

    const userId = req.user?.id;
    return Promise.resolve(userId ? `user-${userId}` : `ip-${ip}`);
    /* Throttler make key for each ip or user.id for use it wiht route to count
     * the number or requests in this route by this ip or user
     */
  }

  /* the key for rate limit is by combin <tracker>-<suffix>
   * and the suffix is the route path
   */

  /* why i add the user.id rather tahn the ip(is the defautl tracker)
   * because somem times ip is not unique or the same ip can be used by many users
   */
}
