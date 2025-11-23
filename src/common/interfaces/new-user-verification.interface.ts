import { CreateCatDto } from 'src/modules/auth/dto/create-user.dto';

export interface INewUserVerification {
  code: string;
  user: CreateCatDto;
}
