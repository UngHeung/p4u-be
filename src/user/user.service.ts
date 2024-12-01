import {
  ConflictException,
  ForbiddenException,
  forwardRef,
  Inject,
  Injectable,
  Logger,
  NotFoundException,
  UnauthorizedException,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import * as bcrypt from 'bcryptjs';
import { AuthService } from 'src/auth/auth.service';
import { SignUpDto } from 'src/auth/dto/signUp.dto';
import { EmailService } from 'src/auth/email.service';
import { ResetCode } from 'src/auth/entity/reset-code.dto';
import { Repository } from 'typeorm';
import { RequestEmailCodeDto } from './dto/request-email-code.dto';
import { UpdateUserEmailDto } from './dto/update-user-email.dto';
import { UpdateUserNicknameDto } from './dto/update-user-nickname.dto';
import { UpdateUserPasswordDto } from './dto/update-user-password.dto';
import { UpdateUserDto } from './dto/update-user.dto';
import { VerifyEmailDto } from './dto/verify-email.dto';
import { User } from './entity/user.entity';
import { UserRole } from './enum/userRole.enum';

const logger = new Logger();

@Injectable()
export class UserService {
  constructor(
    @InjectRepository(User)
    private readonly userRepository: Repository<User>,
    @Inject(forwardRef(() => AuthService))
    private readonly authService: AuthService,
    @InjectRepository(ResetCode)
    private readonly resetCodeRepository: Repository<ResetCode>,
    private readonly emailService: EmailService,
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
      .select([
        'user.id',
        'user.name',
        'user.account',
        'user.nickname',
        'user.email',
        'user.emailVerified',
        'user.userRole',
        'user.createdAt',
      ])
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
        'user.email',
      ])
      .getOne();

    if (!user) {
      logger.warn(`${account} - 유저가 존재하지 않습니다.`);
      throw new NotFoundException('유저가 존재하지 않습니다.');
    }

    logger.log(`${account} - 유저 반환이 완료되었습니다.`);
    return user;
  }

  async updatePassword(
    user: User,
    dto: UpdateUserPasswordDto,
    isReset = false,
  ): Promise<User> {
    logger.log('===== user.service.updatePassword =====');

    if (!dto.password && !isReset) {
      logger.warn(`${user.id} - 비밀번호가 존재하지 않습니다.`);
      throw new NotFoundException('비밀번호가 존재하지 않습니다.');
    }

    const targetUser = await this.userRepository
      .createQueryBuilder('user')
      .where('user.id = :id', { id: user.id })
      .select(['user.id', 'user.password'])
      .getOne();

    if (!targetUser) {
      logger.warn(`${user.id} - 유저가 존재하지 않습니다.`);
      throw new NotFoundException('유저가 존재하지 않습니다.');
    }

    if (!isReset) {
      const isPasswordCorrect = await this.comparePassword(
        dto.password,
        targetUser.password,
      );

      if (!isPasswordCorrect) {
        logger.warn(`${user.id} - 비밀번호가 일치하지 않습니다.`);
        throw new UnauthorizedException('비밀번호가 일치하지 않습니다.');
      }
    }

    const newPassword = await this.authService.encodePassword(dto.newPassword);

    targetUser.password = newPassword;

    await this.userRepository.save({
      ...targetUser,
      email: user.email,
      emailVerified: user.emailVerified,
    });

    logger.log(`${user.id} - 비밀번호가 변경되었습니다.`);

    return targetUser;
  }

  async updateNickname(user: User, dto: UpdateUserNicknameDto): Promise<User> {
    logger.log('===== user.service.updateNickname =====');

    const targetUser = await this.userRepository
      .createQueryBuilder('user')
      .where('user.id = :id', { id: user.id })
      .select(['user.id', 'user.nickname'])
      .getOne();

    if (!targetUser) {
      logger.warn(`${user.id} - 유저가 존재하지 않습니다.`);
      throw new NotFoundException('유저가 존재하지 않습니다.');
    }

    targetUser.nickname = dto.nickname;

    await this.userRepository.save(targetUser);

    logger.log(`${user.id} - 닉네임이 변경되었습니다.`);

    return targetUser;
  }

  async updateEmail(user: User, dto: UpdateUserEmailDto): Promise<User> {
    logger.log('===== user.service.updateEmail =====');

    const targetUser = await this.userRepository
      .createQueryBuilder('user')
      .where('user.id = :id', { id: user.id })
      .select(['user.id', 'user.email'])
      .getOne();

    targetUser.email = dto.email;

    if (!targetUser.emailVerified) {
      targetUser.emailVerified = true;
    }

    await this.userRepository.save(targetUser);

    logger.log(`${user.id} - 이메일이 변경되었습니다.`);

    return targetUser;
  }

  async updateUser(user: User, dto: UpdateUserDto): Promise<User> {
    logger.log('===== user.service.updateUser =====');

    const targetUser = await this.userRepository
      .createQueryBuilder('user')
      .where('user.id = :id', { id: user.id })
      .select(['user.id', 'user.nickname', 'user.email'])
      .getOne();

    if (!targetUser) {
      logger.warn(`${user.id} - 유저가 존재하지 않습니다.`);
      throw new NotFoundException('유저가 존재하지 않습니다.');
    }

    Object.assign(targetUser, dto);

    await this.userRepository.save(targetUser);

    logger.log(`${user.id} - 유저 정보가 변경되었습니다.`);

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

  async requestEmailVerificationCode(userId: number, dto: RequestEmailCodeDto) {
    logger.log('===== user.service.requestEmailVerificationCode =====');

    const user = await this.getUserById(userId);

    if (!user) {
      logger.warn(`${userId} - 유저가 존재하지 않습니다.`);
      throw new NotFoundException('유저가 존재하지 않습니다.');
    }

    const code = Math.floor(Math.random() * 1000000).toString();

    await this.resetCodeRepository.save({
      account: user.account,
      email: dto.email,
      code,
      expiresAt: new Date(Date.now() + 30 * 60 * 1000),
    });

    logger.log(`${dto.email} - 이메일 인증 코드가 생성되었습니다.`);

    const result = await this.emailService.sendEmailVerificationCode({
      email: dto.email,
      code,
    });

    logger.log(`${dto.email} - 이메일 인증 코드가 발송되었습니다.`);

    return result;
  }

  async verifyEmailCode(user: User, dto: VerifyEmailDto) {
    logger.log('===== user.service.verifyEmailCode =====');

    const verifyCode = await this.resetCodeRepository.findOneBy({
      code: dto.code,
    });

    if (!verifyCode) {
      logger.warn(`${dto.code} - 인증 코드가 존재하지 않습니다.`);
      throw new NotFoundException('인증 코드가 존재하지 않습니다.');
    }

    if (verifyCode.email !== dto.email) {
      logger.warn(`${dto.code} - 인증 코드가 일치하지 않습니다.`);
      throw new UnauthorizedException('인증 코드가 일치하지 않습니다.');
    }

    if (verifyCode.expiresAt < new Date()) {
      logger.warn(`${dto.code} - 만료된 인증 코드입니다.`);
      throw new UnauthorizedException('만료된 인증 코드입니다.');
    }

    user.email = dto.email;
    user.emailVerified = true;

    await this.userRepository.save(user);

    logger.log(`${dto.email} - 이메일 인증 코드가 요청되었습니다.`);

    return true;
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
