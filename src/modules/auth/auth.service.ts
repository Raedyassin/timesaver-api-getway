import { BadRequestException, Injectable } from '@nestjs/common';
import { LoggerService } from '../logger/logger.service';
import { RedisService } from '../redis/redis.service';
import { UserService } from '../user/user.service';
import { User } from '../user/entities/user.entity';
import { CreateCatDto } from './dto/create-user.dto';
import { comparePassword, hashPassword } from 'src/common/utils/bcrypt.util';
import { generateCode } from 'src/common/utils/generate-code.util';
import { ConfigService } from '@nestjs/config';
import { SendMailService } from '../send-mail/send-mail.service';
import {
  EmailVerificationDto,
  ResendEmailVerificationCodeDto,
} from './dto/email-verfication.dto';
import { JwtService } from '@nestjs/jwt';
import { v4 as uuidv4 } from 'uuid';
import { JwtPayload } from 'src/common/interfaces/jwt-payload.interface';
import { INewUserVerification } from 'src/common/interfaces/new-user-verification.interface';
import { LoginUserDto } from './dto/login-user.dto';
import { ForgotPasswordCodeDto } from './dto/forgot-password.dto';
@Injectable()
export class AuthService {
  constructor(
    private readonly logger: LoggerService,
    private readonly redisService: RedisService,
    private readonly Userservice: UserService,
    private readonly configService: ConfigService,
    private readonly SendMailService: SendMailService,
    private readonly JwtService: JwtService,
  ) {}
  async register(user: CreateCatDto) {
    const isUserFound = await this.Userservice.findUserBy({
      email: user.email,
    });
    if (isUserFound) {
      throw new BadRequestException('User already exists');
    }
    user.password = await hashPassword(user.password);
    try {
      const emailVerficationCode = generateCode(6);
      // send email verfication code
      await this.SendMailService.sendVerificationCode(
        user.email,
        user.userName,
        emailVerficationCode,
      );
      // store email verfication code in redis for 10 minutes
      await this.redisService.set(
        `newUser:${user.email}`,
        { code: emailVerficationCode, user },
        parseInt(
          this.configService.getOrThrow<string>('EMAIL_VERIFICATION_CODE_TTL'),
        ),
      );
      // this.logger.info(`Email verfication code sent to ${user.email}`);
      return {
        message:
          'Email verfication code sent to your email, the code is valid for 10 minutes',
      };
    } catch (error) {
      this.logger.error(error);
    }
  }
  async verifyEmail(emailVerficationCode: EmailVerificationDto) {
    const emailVerficationCodeFromRedis =
      await this.redisService.get<INewUserVerification>(
        `newUser:${emailVerficationCode.email}`,
      );
    if (!emailVerficationCodeFromRedis) {
      throw new BadRequestException('Email verfication code is invalid');
    }
    const { code, user } = emailVerficationCodeFromRedis;
    if (code !== emailVerficationCode.code) {
      throw new BadRequestException('Email verfication code is invalid');
    }
    let newUser = new User();
    Object.assign(newUser, user);
    newUser.isEmailVerified = true;
    newUser = await this.Userservice.saveUser(newUser);
    await this.redisService.del(`newUser:${emailVerficationCode.email}`);
    this.logger.info(`New user ${user.email} is Created successfully`);
    const accessToken = await this.generateJwtAccessToken(
      newUser.id.toString(),
      newUser.email,
    );
    return {
      message: 'Email verfication code is valid',
      accessToken,
    };
  }

  async resendVerificationCode(
    resendEmailVerificationCodeDto: ResendEmailVerificationCodeDto,
  ) {
    const { email } = resendEmailVerificationCodeDto;
    const user = await this.redisService.get<INewUserVerification>(
      `newUser:${email}`,
    );
    if (!user) {
      throw new BadRequestException(
        'User not found, please register first or registration again',
      );
    }
    const { code, user: userData } = user;
    const verficationCode = generateCode(6);
    await this.redisService.set(
      `newUser:${email}`,
      { code: verficationCode, user: userData },
      parseInt(
        this.configService.getOrThrow<string>('EMAIL_VERIFICATION_CODE_TTL'),
      ),
    );
    await this.SendMailService.sendVerificationCode(
      email,
      userData.userName,
      verficationCode,
    );
    // this.logger.info(`Resend email verfication code to ${email}`);
    return {
      message:
        'Email verfication code sent to your email, the code is valid for 10 minutes',
    };
  }

  async login(user: LoginUserDto) {
    const isUserFound = await this.Userservice.findUserBy({
      email: user.email,
    });
    if (!isUserFound) {
      throw new BadRequestException('Invalid email or password');
    }
    const isPasswordMatch = await comparePassword(
      user.password,
      isUserFound.password,
    );
    if (!isPasswordMatch) {
      throw new BadRequestException('Invalid email or password');
    }
    const accessToken = await this.generateJwtAccessToken(
      isUserFound.id.toString(),
      isUserFound.email,
    );
    return {
      accessToken,
    };
  }

  async forgotPassword(email: string) {
    const user = await this.Userservice.findUserBy({ email });
    if (!user) {
      throw new BadRequestException('User not found');
    }
    const passwordResetCode = generateCode(6);
    await this.redisService.set(
      `passwordReset:${user.email}`,
      { code: passwordResetCode, userId: user.id.toString() },
      parseInt(
        this.configService.getOrThrow<string>('PASSWORD_RESET_CODE_TTL'),
      ),
    );
    await this.SendMailService.sendPasswordResetCode(
      email,
      user.userName,
      passwordResetCode,
    );
    return {
      message:
        'Password reset code sent to your email, the code is valid for 3 minutes',
    };
  }
  async forgotPasswordCode(user: ForgotPasswordCodeDto) {
    const passwordResetCodeFromRedis = await this.redisService.get<{
      code: string;
      userId: string;
    }>(`passwordReset:${user.email}`);
    if (!passwordResetCodeFromRedis) {
      throw new BadRequestException('Password reset code is invalid');
    }
    if (passwordResetCodeFromRedis.code !== user.code) {
      throw new BadRequestException('Password reset code is invalid');
    }
    await this.redisService.del(`passwordReset:${user.email}`);
    const accessToken = await this.generateJwtAccessToken(
      passwordResetCodeFromRedis.userId,
      user.email,
    );
    return {
      message: 'Forgot password code is valid',
      accessToken,
    };
  }
  private async generateJwtAccessToken(
    userId: string,
    email: string,
  ): Promise<string> {
    // will create session for each user login and when he logout will destory
    // this sessionId form redis because the jwt token is not destroy it's just invalid when his time is over
    const sessionId = uuidv4();
    const payload: JwtPayload = {
      sessionId,
      userId,
      email,
    };
    // store sessionId in redis for 30 days
    await this.redisService.set(
      `loginUser:${userId}`,
      sessionId,
      parseInt(this.configService.getOrThrow<string>('JWT_EXPIRATION')),
    );
    this.logger.info(`User ${email} is logged in successfully`);
    return this.JwtService.signAsync(payload);
  }
}
