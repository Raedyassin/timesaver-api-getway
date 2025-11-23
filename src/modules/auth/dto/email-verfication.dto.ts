import { IsEmail, IsNotEmpty, IsString, Length } from 'class-validator';

export class EmailVerificationDto {
  @IsEmail()
  @IsNotEmpty({ message: 'Email is required' })
  email: string;

  @IsString()
  @Length(6, 6, { message: 'Code must be 6 characters long' })
  code: string;
}

export class ResendEmailVerificationCodeDto {
  @IsEmail()
  @IsNotEmpty({ message: 'Email is required' })
  email: string;
}
