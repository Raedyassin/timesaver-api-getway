import {
  Body,
  Controller,
  Get,
  HttpCode,
  HttpStatus,
  Post,
  UseGuards,
} from '@nestjs/common';
import { AuthService } from './auth.service';
import { CreateCatDto } from './dto/create-user.dto';
import {
  EmailVerificationDto,
  ResendEmailVerificationCodeDto,
} from './dto/email-verfication.dto';
import { LoginUserDto } from './dto/login-user.dto';
import {
  ForgotPasswordCodeDto,
  ForgotPasswordDto,
} from './dto/forgot-password.dto';
import { GoogleAuthGuard } from 'src/common/guards/google-auth.guard';
import { Public } from 'src/common/decorators/public.decorator';
import { GetUser } from 'src/common/decorators/get-user.decorator';
import { User } from '../user/entities/user.entity';

@Controller()
export class AuthController {
  constructor(private readonly authService: AuthService) {}

  @Public()
  @Post('register')
  register(@Body() user: CreateCatDto) {
    return this.authService.register(user);
  }

  @Public()
  @Post('verify-email')
  verifyEmail(@Body() emailVerification: EmailVerificationDto) {
    return this.authService.verifyEmail(emailVerification);
  }

  @Public()
  @Post('resend-verification-code')
  resendVerificationCode(
    @Body() resendVerificationCodeDto: ResendEmailVerificationCodeDto,
  ) {
    return this.authService.resendVerificationCode(resendVerificationCodeDto);
  }

  @Public()
  @HttpCode(HttpStatus.OK)
  @Post('login')
  login(@Body() user: LoginUserDto) {
    return this.authService.login(user);
  }

  @Public()
  @Post('forgot-password')
  forgotPassword(@Body() user: ForgotPasswordDto) {
    return this.authService.forgotPassword(user.email);
  }

  @Public()
  @Post('forgot-password-code')
  forgotPasswordCode(@Body() user: ForgotPasswordCodeDto) {
    return this.authService.forgotPasswordCode(user);
  }

  @Public()
  @Get('google/login')
  @UseGuards(GoogleAuthGuard)
  googleLogin() {}

  // google callback => google after get approve from user will redirect here
  @Public()
  @Get('google/callback')
  @UseGuards(GoogleAuthGuard)
  googleLoginCallback(@GetUser() user: User) {
    return this.authService.generateAndReturnJwt(user);
  }

  @Post('logout')
  logout(@GetUser() user: User) {
    return this.authService.logout(user.id.toString(), user.email);
  }
}
