import {
  BadRequestException,
  ForbiddenException,
  Injectable,
  Logger,
  NotFoundException,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { BaseModel } from 'src/common/entity/base.entity';
import { User } from 'src/user/entity/user.entity';
import { Repository, SelectQueryBuilder } from 'typeorm';
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
  ) {}

  async createThanks(user: User, dto: CreateThanksDto): Promise<Thanks> {
    logger.log('===== thanks.service.createThanks =====');
    const createdThanks = await this.thanksRepository.save({
      ...dto,
      writer: user,
      reactionsCount: {
        HEART: 0,
        THUMBS_UP: 0,
        CLAP: 0,
        SMILE: 0,
        PARTY: 0,
      } as { [key: string]: number },
    });

    logger.log('감사글 생성이 완료되었습니다.');

    return createdThanks;
  }

  async getThanksList(
    type: 'all' | 'my',
    take: number,
    cursor: number,
    userId: number,
  ): Promise<{ list: Thanks[]; cursor: number }> {
    logger.log('===== thanks.service.getThanksList =====');
    const thanks = await this.cursorPaginateThanks(type, take, cursor, userId);

    if (!thanks.list.length) {
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
      .select([
        'thanks.id',
        'thanks.content',
        'thanks.createdAt',
        'thanks.reactionsCount',
        'writer.id',
        'writer.name',
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

    const updatedThanks = await this.thanksRepository.update(id, dto);

    if (!updatedThanks.affected) {
      logger.log(`${id} - 감사글 업데이트에 실패하였습니다.`);
      throw new NotFoundException('감사글 업데이트에 실패하였습니다.');
    }

    logger.log(`${id} - 감사글 수정이 완료되었습니다.`);

    return target;
  }
}