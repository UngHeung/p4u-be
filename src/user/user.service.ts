import { ConflictException, Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { SignUpDto } from 'src/auth/dto/signUp.dto';
import { Repository } from 'typeorm';
import { User } from './entity/user.entity';

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
    const isExists = await this.existsUser(dto.account);

    if (isExists) {
      throw new ConflictException('아이디가 이미 존재합니다.');
    }

    const user = this.userRepository.create({
      ...dto,
    });

    await this.userRepository.save(user);

    return user;
  }

  //
  async existsUser(account: string) {
    const isExists = await this.userRepository.exists({
      where: { account },
    });

    return isExists;
  }
}
