import { IsEmail, IsNotEmpty, IsString, Length } from 'class-validator';

export class CreateCatDto {
  @IsString()
  @Length(3, 50, {
    message:
      'Name must be at least 3 character long and less than 50 characters long',
  })
  userName: string;

  @IsEmail()
  @IsNotEmpty({ message: 'Email is required' })
  email: string;

  @IsString()
  @IsNotEmpty({ message: 'Password is required' })
  password: string;
}
