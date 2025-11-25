import {
  CanActivate,
  ExecutionContext,
  Injectable,
  UnauthorizedException,
} from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import { UserService } from 'src/modules/user/user.service';
import { IS_PUBLIC_KEY } from '../decorators/public.decorator';
import { Reflector } from '@nestjs/core';
import { JwtPayload } from '../interfaces/jwt-payload.interface';
import { Request } from 'express';
import { RedisService } from 'src/modules/redis/redis.service';
import { User } from 'src/modules/user/entities/user.entity';

@Injectable()
export class AuthGuard implements CanActivate {
  constructor(
    private readonly userService: UserService,
    private readonly jwtService: JwtService,
    private reflector: Reflector,
    private readonly redisService: RedisService,
  ) {}
  async canActivate(context: ExecutionContext): Promise<boolean> {
    // if the endpoint is not public go
    const isPublic = this.reflector.getAllAndOverride<boolean>(IS_PUBLIC_KEY, [
      context.getHandler(),
      context.getClass(),
    ]);
    if (isPublic) {
      return true;
    }

    const request = context.switchToHttp().getRequest<Request>();
    const accessToken = this.extractTokenFromHeader(request);
    if (!accessToken) {
      throw new UnauthorizedException(
        'Access token is required with Bearer type',
      );
    }
    let payload: JwtPayload;
    try {
      payload = await this.jwtService.verifyAsync(accessToken);
    } catch {
      throw new UnauthorizedException(
        'Login first to access this route or Access token is invalid or expired',
      );
    }
    // check if the user is logged in or not
    const sessionId = await this.redisService.get(
      `loginUser:${payload.userId}`,
    );
    if (sessionId !== payload.sessionId) {
      throw new UnauthorizedException(
        'Login first to access this route or Access token is invalid or expired',
      );
    }

    // after we check if the user is logged (by checking sessionId and token) in or not
    const user = await this.userService.findUserBy({ id: payload.userId });
    // if (!user) { // we don't need to check if the user exist or not
    //   throw new UnauthorizedException('User not found');
    // }
    request['user'] = user as User;

    return true;
  }
  private extractTokenFromHeader(request: Request): string | undefined {
    const [type, token] = request.headers.authorization?.split(' ') ?? [];
    return type === 'Bearer' ? token : undefined;
  }
}
