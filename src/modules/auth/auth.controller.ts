import { Body, Controller, Get, Post, Req, UseGuards } from '@nestjs/common';
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

@Controller()
export class AuthController {
  constructor(private readonly authService: AuthService) {}

  @Post('register')
  register(@Body() user: CreateCatDto) {
    return this.authService.register(user);
  }

  @Post('verify-email')
  verifyEmail(@Body() emailVerification: EmailVerificationDto) {
    return this.authService.verifyEmail(emailVerification);
  }

  @Post('resend-verification-code')
  resendVerificationCode(
    @Body() resendVerificationCodeDto: ResendEmailVerificationCodeDto,
  ) {
    return this.authService.resendVerificationCode(resendVerificationCodeDto);
  }

  @Post('login')
  login(@Body() user: LoginUserDto) {
    return this.authService.login(user);
  }

  @Post('forgot-password')
  forgotPassword(@Body() user: ForgotPasswordDto) {
    return this.authService.forgotPassword(user.email);
  }

  @Post('forgot-password-code')
  forgotPasswordCode(@Body() user: ForgotPasswordCodeDto) {
    return this.authService.forgotPasswordCode(user);
  }

  @Get('google/login')
  @UseGuards(GoogleAuthGuard)
  googleLogin() {}

  // google callback => google after get approve from user will redirect here
  @Get('google/callback')
  @UseGuards(GoogleAuthGuard)
  googleLoginCallback(@Req() req: any) {
    return this.authService.generateAndReturnJwt(req.user);
  }
}
