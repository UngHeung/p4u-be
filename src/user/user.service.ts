import {
  ConflictException,
  Injectable,
  Logger,
  NotFoundException,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { SignUpDto } from 'src/auth/dto/signUp.dto';
import { Repository } from 'typeorm';
import { User } from './entity/user.entity';

const logger = new Logger();

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

    if (!user) {
      logger.warn(`${id} - 유저가 존재하지 않습니다.`);
      throw new NotFoundException('유저가 존재하지 않습니다.');
    }

    return user;
  }

  async getUserByAccount(account: string) {
    const user = await this.userRepository
      .createQueryBuilder('user')
      .where('user.account = :account', { account })
      .select(['user.id', 'user.name', 'user.account', 'user.password'])
      .getOne();

    if (!user) {
      logger.warn(`${account} - 유저가 존재하지 않습니다.`);
      throw new NotFoundException('유저가 존재하지 않습니다.');
    }

    return user;
  }

  async createUser(dto: SignUpDto) {
    const isExists = await this.existsUser(dto.account);

    if (isExists) {
      logger.warn(`${dto.account} - 아이디가 이미 존재합니다.`);
      throw new ConflictException('아이디가 이미 존재합니다.');
    }

    const user = this.userRepository.create({
      ...dto,
    });

    await this.userRepository.save(user);

    logger.log(`${user.id} - 유저가 생성되었습니다.`);

    return user;
  }

  //
  async existsUser(account: string) {
    const isExists = await this.userRepository.exists({
      where: { account },
    });

    logger.log(
      `${account} - 사용자가 ${isExists ? '존재합니다' : '존재하지 않습니다'}.`,
    );

    return isExists;
  }
}
