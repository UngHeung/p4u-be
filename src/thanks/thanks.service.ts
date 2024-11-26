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
}
