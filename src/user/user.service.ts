import {
  ConflictException,
  ForbiddenException,
  Injectable,
  Logger,
  NotFoundException,
  UnauthorizedException,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import * as bcrypt from 'bcryptjs';
import { AuthService } from 'src/auth/auth.service';
import { SignUpDto } from 'src/auth/dto/signUp.dto';
import { Repository } from 'typeorm';
import { UpdateUserNameDto } from './dto/update-user-name.dto';
import { UpdateUserPasswordDto } from './dto/update-user-password.dto';
import { User } from './entity/user.entity';
import { UserRole } from './enum/userRole.enum';

const logger = new Logger();

@Injectable()
export class UserService {
  constructor(
    @InjectRepository(User)
    private readonly userRepository: Repository<User>,
    private readonly authService: AuthService,
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
      .select(['user.id', 'user.name', 'user.userRole', 'user.createdAt'])
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
      .select([
        'user.id',
        'user.name',
        'user.account',
        'user.userRole',
        'user.password',
      ])
      .getOne();

    if (!user) {
      logger.warn(`${account} - 유저가 존재하지 않습니다.`);
      throw new NotFoundException('유저가 존재하지 않습니다.');
    }

    logger.log(`${account} - 유저 반환이 완료되었습니다.`);
    return user;
  }

  async updatePassword(user: User, dto: UpdateUserPasswordDto): Promise<User> {
    logger.log('===== user.service.updatePassword =====');

    const targetUser = await this.userRepository
      .createQueryBuilder('user')
      .where('user.id = :id', { id: user.id })
      .select(['user.id', 'user.password'])
      .getOne();

    if (!targetUser) {
      logger.warn(`${user.id} - 유저가 존재하지 않습니다.`);
      throw new NotFoundException('유저가 존재하지 않습니다.');
    }

    const isPasswordCorrect = await this.comparePassword(
      dto.password,
      targetUser.password,
    );

    if (!isPasswordCorrect) {
      logger.warn(`${user.id} - 비밀번호가 일치하지 않습니다.`);
      throw new UnauthorizedException('비밀번호가 일치하지 않습니다.');
    }

    const newPassword = await this.authService.encodePassword(dto.newPassword);

    targetUser.password = newPassword;

    await this.userRepository.save(targetUser);

    logger.log(`${user.id} - 비밀번호가 변경되었습니다.`);

    return targetUser;
  }

  async updateName(user: User, dto: UpdateUserNameDto): Promise<User> {
    logger.log('===== user.service.updateName =====');

    const targetUser = await this.userRepository
      .createQueryBuilder('user')
      .where('user.id = :id', { id: user.id })
      .select(['user.id', 'user.name'])
      .getOne();

    if (!targetUser) {
      logger.warn(`${user.id} - 유저가 존재하지 않습니다.`);
      throw new NotFoundException('유저가 존재하지 않습니다.');
    }

    targetUser.name = dto.name;

    await this.userRepository.save(targetUser);

    logger.log(`${user.id} - 이름이 변경되었습니다.`);

    return targetUser;
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

  async toggleUserRole(user: User, id: number): Promise<User> {
    logger.log('===== user.service.toggleUserRole =====');

    if (user.userRole !== UserRole.ADMIN) {
      logger.warn(`${user.id} - 관리자 권한이 없습니다.`);
      throw new ForbiddenException('관리자 권한이 없습니다.');
    }

    const targetUser = await this.userRepository
      .createQueryBuilder('user')
      .where('id = :id', { id })
      .select(['user.id', 'user.userRole'])
      .getOne();

    if (!targetUser) {
      logger.warn(`${id} - 유저가 존재하지 않습니다.`);
      throw new NotFoundException('유저가 존재하지 않습니다.');
    }

    targetUser.userRole =
      targetUser.userRole === UserRole.USER ? UserRole.ADMIN : UserRole.USER;

    await this.userRepository.save(targetUser);

    logger.log(
      `${id} - 유저 권한이 ${targetUser.userRole}(으)로 변경되었습니다.`,
    );

    return targetUser;
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

  async comparePassword(password: string, targetPassword: string) {
    logger.log('===== user.service.comparePassword =====');

    const isPasswordCorrect = await bcrypt.compare(password, targetPassword);

    logger.log(
      `${password} - ${isPasswordCorrect ? '비밀번호가 일치합니다.' : '비밀번호가 일치하지 않습니다.'}`,
    );

    return isPasswordCorrect;
  }
}
