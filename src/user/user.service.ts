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
import { UserRole } from './enum/userRole.enum';

const logger = new Logger();

@Injectable()
export class UserService {
  constructor(
    @InjectRepository(User)
    private readonly userRepository: Repository<User>,
  ) {}

  async createUser(dto: SignUpDto) {
    logger.log('===== user.service.createUser =====');

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

  async getUserById(id: number) {
    logger.log('===== user.service.getUserById =====');

    const user = await this.userRepository
      .createQueryBuilder('user')
      .where('user.id = :id', { id })
      .select(['user.id', 'user.name'])
      .getOne();

    if (!user) {
      logger.warn(`${id} - 유저가 존재하지 않습니다.`);
      throw new NotFoundException('유저가 존재하지 않습니다.');
    }

    logger.log(`${id} - 유저 반환이 완료되었습니다.`);
    return user;
  }

  async getUserByIdForVerifyPassword(id: number) {
    logger.log('===== user.service.getUserById =====');

    const user = await this.userRepository
      .createQueryBuilder('user')
      .where('user.id = :id', { id })
      .select(['user.id', 'user.password'])
      .getOne();

    if (!user) {
      logger.warn(`${id} - 유저가 존재하지 않습니다.`);
      throw new NotFoundException('유저가 존재하지 않습니다.');
    }

    logger.log(`${id} - 유저 반환이 완료되었습니다.`);
    return user;
  }

  async getUserByAccount(account: string) {
    logger.log('===== user.service.getUserByAccount =====');

    const user = await this.userRepository
      .createQueryBuilder('user')
      .where('user.account = :account', { account })
      .select(['user.id', 'user.name', 'user.account', 'user.password'])
      .getOne();

    if (!user) {
      logger.warn(`${account} - 유저가 존재하지 않습니다.`);
      throw new NotFoundException('유저가 존재하지 않습니다.');
    }

    logger.log(`${account} - 유저 반환이 완료되었습니다.`);
    return user;
  }

  async toggleActivateUser(id: number): Promise<User> {
    logger.log('===== user.service.toggleActivateUser =====');

    const user = await this.userRepository
      .createQueryBuilder('users')
      .where('id = :id', { id })
      .select(['user.id', 'user.isActivate'])
      .getOne();

    if (!user) {
      logger.warn(`${id} - 유저가 존재하지 않습니다.`);
      throw new NotFoundException('유저가 존재하지 않습니다.');
    }

    user.isActivate = !user.isActivate;

    await this.userRepository.save(user);

    logger.log(`유저가 ${!user.isActivate ? '비' : ''}활성화 되었습니다.`);

    return user;
  }

  async toggleUserRole(id: number): Promise<User> {
    logger.log('===== user.service.toggleUserRole =====');

    const user = await this.userRepository
      .createQueryBuilder('user')
      .where('id = :id', { id })
      .select(['user.id', 'user.userRole'])
      .getOne();

    if (!user) {
      logger.warn(`${id} - 유저가 존재하지 않습니다.`);
      throw new NotFoundException('유저가 존재하지 않습니다.');
    }

    user.userRole =
      user.userRole === UserRole.USER ? UserRole.ADMIN : UserRole.USER;

    await this.userRepository.save(user);

    logger.log(`${id} - 유저 권한이 ${user.userRole}(으)로 변경되었습니다.`);

    return user;
  }

  async deleteUser(id: number): Promise<void> {
    logger.log('===== user.service.deleteUser =====');

    const deleteResponse = await this.userRepository.delete({ id });

    if (deleteResponse.affected) {
      logger.log('유저 정보가 삭제되었습니다.');
    } else {
      logger.warn('유저 정보가 삭제되지 않았습니다.');
    }
  }

  //
  async existsUser(account: string) {
    logger.log('===== user.service.existsUser =====');

    const isExists = await this.userRepository.exists({
      where: { account },
    });

    logger.log(
      `${account} - 사용자가 ${isExists ? '존재합니다' : '존재하지 않습니다'}.`,
    );

    return isExists;
  }
}
