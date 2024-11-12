import { Injectable } from '@nestjs/common';
import { SignUpDto } from 'src/auth/dto/signUp.dto';
import { Repository } from 'typeorm';
import { User } from './entity/user.entity';
import { InjectRepository } from '@nestjs/typeorm';

@Injectable()
export class UserService {
  constructor(
    @InjectRepository(User)
    private readonly userRepository: Repository<User>,
  ) {}

  async getUserById(id: number) {
    const user = await this.userRepository
      .createQueryBuilder('user')
      .where('user.id = :id', { id })
      .select(['user.id', 'user.password'])
      .getOne();

    return user;
  }

  async getUserByAccount(account: string) {
    const user = await this.userRepository
      .createQueryBuilder('user')
      .where('user.account = :account', { account })
      .select(['user.id', 'user.name', 'user.account', 'user.password'])
      .getOne();

    return user;
  }

  async createUser(dto: SignUpDto) {
    const user = this.userRepository.create({
      ...dto,
    });

    return user;
  }

  //
  async existsUser(id: number) {
    const isExists = await this.userRepository.exists({
      where: { id },
    });

    return isExists;
  }
}
