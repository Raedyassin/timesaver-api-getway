import { IsEmail, IsNotEmpty, Length } from 'class-validator';

export class ForgotPasswordDto {
  @IsEmail()
  @IsNotEmpty({ message: 'Email is required' })
  email: string;
}

export class ForgotPasswordCodeDto {
  @IsEmail()
  @IsNotEmpty({ message: 'Email is required' })
  email: string;

  @IsNotEmpty({ message: 'Code is required' })
  @Length(6, 6, { message: 'Code must be 6 characters long' })
  code: string;
}
