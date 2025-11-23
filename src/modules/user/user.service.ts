import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { User } from './entities/user.entity';
import { Repository } from 'typeorm';

@Injectable()
export class UserService {
  constructor(
    @InjectRepository(User)
    private readonly usersRepository: Repository<User>,
  ) {}

  findUserBy(query: Record<string, any>): Promise<User | null> {
    return this.usersRepository.findOneBy(query);
  }

  saveUser(user: User): Promise<User> {
    return this.usersRepository.save(user);
  }
}
