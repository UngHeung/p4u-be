import {
  BadRequestException,
  ForbiddenException,
  Injectable,
  InternalServerErrorException,
  Logger,
  NotFoundException,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { BaseModel } from 'src/common/entity/base.entity';
import { User } from 'src/user/entity/user.entity';
import { UserRole } from 'src/user/enum/userRole.enum';
import { DataSource, Repository, SelectQueryBuilder } from 'typeorm';
import { CreateThanksDto } from './dto/createThanks.dto';
import { UpdateThanksDto } from './dto/updateThanks.dto';
import { Thanks } from './entity/thanks.entity';
import { ReactionType } from './enum/reactionType.enum';

const logger = new Logger('ThanksService');
@Injectable()
export class ThanksService {
  constructor(
    @InjectRepository(Thanks)
    private readonly thanksRepository: Repository<Thanks>,
    private dataSource: DataSource,
  ) {}

  async createThanks(user: User, dto: CreateThanksDto): Promise<Thanks> {
    logger.log('===== thanks.service.createThanks =====');
    const createdThanks = await this.thanksRepository.save({
      ...dto,
      writer: user,
    });

    logger.log('감사글 생성이 완료되었습니다.');

    return createdThanks;
  }

  async getThanksList(
    userId: number,
    type: 'all' | 'my' | 'inactive',
    take: number,
    cursor: number,
    order: 'ASC' | 'DESC' = 'ASC',
  ): Promise<{ list: Thanks[]; cursor: number }> {
    logger.log('===== thanks.service.getThanksList =====');
    const thanks = await this.cursorPaginateThanks(
      type,
      take,
      cursor,
      order,
      userId,
    );

    if (!thanks.list.length) {
      logger.log('감사글이 존재하지 않습니다.');
      return { list: [], cursor: null };
    }

    logger.log('감사글 목록 반환이 완료되었습니다.');

    return thanks;
  }

  async getReactionsCount(id: number): Promise<{ [key: string]: number }> {
    logger.log('===== thanks.service.getReactionsCount =====');
    const thanks = await this.getThanks(id);

    logger.log('감사글 반응 수 반환이 완료되었습니다.');

    return thanks.reactionsCount;
  }

  async getThanks(id: number): Promise<Thanks> {
    logger.log('===== thanks.service.getThanks =====');

    const thanks = await this.thanksRepository
      .createQueryBuilder('thanks')
      .leftJoin('thanks.writer', 'writer')
      .leftJoin('thanks.reactions', 'reactions')
      .leftJoin('thanks.reports', 'reports')
      .select([
        'thanks.id',
        'thanks.content',
        'thanks.createdAt',
        'thanks.updatedAt',
        'thanks.reactionsCount',
        'thanks.isActive',
        'writer.id',
        'writer.name',
        'reports.id',
      ])
      .where('thanks.id = :id', { id })
      .getOne();

    if (!thanks) {
      logger.log('감사글이 존재하지 않습니다.');
      throw new NotFoundException('감사글이 존재하지 않습니다.');
    }

    logger.log('감사글 반환이 완료되었습니다.');

    return thanks;
  }

  async updateThanks(
    userId: number,
    id: number,
    dto: UpdateThanksDto,
  ): Promise<Thanks> {
    logger.log('===== thanks.service.updateThanks =====');

    const target = await this.getThanks(id);

    if (!target) {
      logger.log('감사글이 존재하지 않습니다.');
      throw new NotFoundException('감사글이 존재하지 않습니다.');
    }

    if (target.writer.id !== userId) {
      logger.log('감사글 수정 권한이 없습니다.');
      throw new ForbiddenException('감사글 수정 권한이 없습니다.');
    }

    const updatedThanks = await this.thanksRepository.update(id, {
      ...dto,
      updatedAt: new Date(),
    });

    if (!updatedThanks.affected) {
      logger.log(`${id} - 감사글 업데이트에 실패하였습니다.`);
      throw new NotFoundException('감사글 업데이트에 실패하였습니다.');
    }

    logger.log(`${id} - 감사글 수정이 완료되었습니다.`);

    return target;
  }

  async updateReactionsCount(
    id: number,
    type: ReactionType,
    isAdd: boolean,
  ): Promise<boolean> {
    logger.log('===== thanks.service.updateReactionsCount =====');
    const reactionsCount = await this.getReactionsCount(id);

    if (isAdd) {
      logger.log(`${id} - 감사글 반응 수 증가`);
      ++reactionsCount[type];
    } else {
      logger.log(`${id} - 감사글 반응 수 감소`);
      --reactionsCount[type];

      if (reactionsCount[type] < 0) {
        logger.log('감사글 반응 수가 0보다 작습니다.');
        return false;
      }
    }

    const updatedThanks = await this.thanksRepository.update(id, {
      reactionsCount,
    });

    if (!updatedThanks.affected) {
      logger.log(`${id} - 감사글 반응 수 업데이트에 실패하였습니다.`);
      throw new NotFoundException('감사글 반응 수 업데이트에 실패하였습니다.');
    }

    logger.log(`${id} - 감사글 반응 수 업데이트가 완료되었습니다.`);

    return true;
  }

  async toggleThanksActive(
    user: User,
    thanksId: number,
    isActive: boolean,
  ): Promise<boolean> {
    logger.log('===== thanks.service.toggleThanksActive =====');

    if (user.userRole !== UserRole.ADMIN) {
      logger.log('감사글 활성화 상태 변경 권한이 없습니다.');
      throw new ForbiddenException('감사글 활성화 상태 변경 권한이 없습니다.');
    }

    const target = await this.getThanks(thanksId);

    if (!target) {
      logger.log('감사글이 존재하지 않습니다.');
      return false;
    }

    const updatedThanks = await this.changeActiveThanks(user, target, isActive);

    if (!updatedThanks) {
      logger.log('감사글 활성화 상태 변경에 실패하였습니다.');
      return false;
    }

    logger.log('감사글 활성화 상태 변경이 완료되었습니다.');

    return true;
  }

  async updateReportThanks(user: User, thanksId: number): Promise<boolean> {
    logger.log('===== thanks.service.updateReportThanks =====');

    const queryRunner = this.dataSource.createQueryRunner();

    const target = await this.thanksRepository
      .createQueryBuilder('thanks')
      .leftJoin('thanks.reports', 'reports')
      .select(['thanks.id', 'reports.id'])
      .where('thanks.id = :thanksId', { thanksId })
      .getOne();

    if (!target) {
      logger.log('감사글이 존재하지 않습니다.');
      throw new NotFoundException('감사글이 존재하지 않습니다.');
    }

    if (target.reports.some(report => report.id === user.id)) {
      logger.log('이미 신고한 감사글입니다.');
      throw new BadRequestException('이미 신고한 감사글입니다.');
    }

    target.reports.push(user);

    try {
      await queryRunner.connect();
      await queryRunner.startTransaction();

      await this.thanksRepository.save(target);

      logger.log('감사글 신고 업데이트가 완료되었습니다.');

      if (target.reports.length >= 5) {
        const result = await this.changeActiveThanks(user, target, false);

        if (!result) {
          logger.log('감사글 활성화 상태 변경에 실패하였습니다.');
          throw new InternalServerErrorException(
            '감사글 활성화 상태 변경에 실패하였습니다.',
          );
        }
      }

      return true;
    } catch (error) {
      logger.log('감사글 신고 업데이트에 실패하였습니다.');
      throw new InternalServerErrorException(
        '감사글 신고 업데이트에 실패하였습니다.',
      );
    } finally {
      await queryRunner.release();
    }
  }

  async resetReportThanks(user: User, thanksId: number): Promise<boolean> {
    logger.log('===== thanks.service.resetReportThanks =====');

    if (user.userRole !== UserRole.ADMIN) {
      logger.log('감사글 신고 초기화 권한이 없습니다.');
      return false;
    }

    const target = await this.thanksRepository
      .createQueryBuilder('thanks')
      .leftJoin('thanks.reports', 'reports')
      .select(['thanks.id', 'reports.id'])
      .where('thanks.id = :thanksId', { thanksId })
      .getOne();

    if (!target) {
      logger.log('감사글이 존재하지 않습니다.');
      return false;
    }

    target.reports = [];
    if (!target.isActive) {
      target.isActive = true;
    }

    await this.thanksRepository.save(target);

    logger.log('감사글 신고 초기화가 완료되었습니다.');
    return true;
  }

  async changeReactionsCount(
    id: number,
    type: ReactionType,
    newType: ReactionType,
  ): Promise<boolean> {
    logger.log('===== thanks.service.changeReactionsCount =====');
    const currentReactionsCount = await this.getReactionsCount(id);

    if (currentReactionsCount[type] === 0) {
      logger.log('감사글 반응 수가 0입니다.');
      return false;
    }

    --currentReactionsCount[type];
    ++currentReactionsCount[newType];

    if (currentReactionsCount[type] < 0 || currentReactionsCount[newType] < 0) {
      logger.log('감사글 반응 수가 0보다 작습니다.');
      return false;
    }

    const updatedThanks = await this.thanksRepository.update(id, {
      reactionsCount: currentReactionsCount,
    });

    if (!updatedThanks.affected) {
      logger.log('감사글 반응 수 변경에 실패하였습니다.');
      return false;
    }

    logger.log('감사글 반응 수 변경이 완료되었습니다.');

    return true;
  }

  async deleteThanks(user: User, id: number): Promise<boolean> {
    logger.log('===== thanks.service.deleteThanks =====');

    const existingThanks = await this.thanksRepository
      .createQueryBuilder('thanks')
      .leftJoin('thanks.writer', 'writer')
      .where('thanks.id = :id', { id })
      .andWhere('writer.id = :userId', { userId: user.id })
      .select(['thanks.id', 'writer.id'])
      .getOne();

    if (user.userRole !== UserRole.ADMIN && !existingThanks) {
      logger.log('권한이 없거나 감사글이 존재하지 않습니다.');
      throw new NotFoundException('권한이 없거나 감사글이 존재하지 않습니다.');
    }

    const deletedThanks = await this.thanksRepository.delete(id);

    if (deletedThanks.affected === 0) {
      logger.log('감사글 삭제에 실패하였습니다.');
      throw new NotFoundException('감사글 삭제에 실패하였습니다.');
    }

    logger.log('감사글 삭제가 완료되었습니다.');
    return true;
  }

  async changeActiveThanks(
    user: User,
    thanks: Thanks,
    isActive: boolean,
  ): Promise<boolean> {
    logger.log('===== thanks.service.changeActiveThanks =====');

    if (user.userRole !== UserRole.ADMIN && isActive) {
      logger.log('감사글 활성화 상태 변경 권한이 없습니다.');
      throw new ForbiddenException('감사글 활성화 상태 변경 권한이 없습니다.');
    }

    if (isActive) {
      thanks.isActive = true;
    } else {
      thanks.isActive = false;
    }

    await this.thanksRepository.save(thanks);

    logger.log('감사글 활성화 상태 변경이 완료되었습니다.');

    return true;
  }

  /**
   * cursor pagination
   */

  async cursorPaginateThanks(
    type: 'all' | 'my' | 'inactive',
    take: number,
    cursor: number,
    order: 'ASC' | 'DESC' = 'ASC',
    userId: number,
  ): Promise<{ list: Thanks[]; cursor: number }> {
    const queryBuilder = this.composeQueryBuilder<Thanks>(
      this.thanksRepository,
      type,
      cursor,
      order,
      userId,
    );

    queryBuilder
      .leftJoin('thanks.writer', 'writer')
      .leftJoin('thanks.reports', 'reports')
      .leftJoin(
        'thanks.reactions',
        'reactions',
        'reactions.reactioner.id = :userId',
        {
          userId,
        },
      )
      .select([
        'thanks.id',
        'thanks.content',
        'thanks.createdAt',
        'thanks.updatedAt',
        'thanks.reactionsCount',
        'thanks.isActive',
        'writer.id',
        'writer.name',
        'writer.nickname',
        'writer.isShowNickname',
        'reports.id',
        'reactions.id',
        'reactions.type',
      ])
      .orderBy('thanks.id', 'DESC')
      .take(take + 1);

    const list = await queryBuilder.getMany();
    const hasNext = list.length > take;

    if (hasNext) {
      return { list: list.slice(0, take), cursor: list[list.length - 2].id };
    } else {
      return { list, cursor: null };
    }
  }

  composeQueryBuilder<T extends BaseModel>(
    repo: Repository<T>,
    type: 'all' | 'my' | 'inactive',
    cursor: number,
    order: 'ASC' | 'DESC' = 'ASC',
    userId: number,
  ): SelectQueryBuilder<T> {
    const queryBuilder = repo.createQueryBuilder('thanks');

    if (cursor !== null) {
      if (cursor === -1) {
        queryBuilder.where('thanks.id > :cursor', { cursor });
      } else {
        queryBuilder.where(
          `thanks.id ${order === 'DESC' ? '>' : '<'} :cursor`,
          {
            cursor,
          },
        );
      }

      if (type === 'my') {
        queryBuilder.andWhere('writer.id = :userId', { userId });
      } else if (type === 'inactive') {
        queryBuilder.andWhere('thanks.isActive = :isActive', {
          isActive: false,
        });
      } else {
        queryBuilder.andWhere('thanks.isActive = :isActive', {
          isActive: true,
        });
      }
    }

    return queryBuilder;
  }
}
