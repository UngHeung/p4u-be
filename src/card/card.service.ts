import {
  BadRequestException,
  Injectable,
  InternalServerErrorException,
  Logger,
  NotFoundException,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { TagService } from 'src/tag/tag.service';
import { User } from 'src/user/entity/user.entity';
import { DataSource, Repository } from 'typeorm';
import { CreateCardDto } from './dto/create-card.dto';
import { Card } from './entity/card.entity';

const logger = new Logger();

@Injectable()
export class CardService {
  constructor(
    @InjectRepository(Card)
    private readonly cardRepository: Repository<Card>,
    private readonly tagService: TagService,
    private readonly dataSource: DataSource,
  ) {}

  async createCard(user: User, dto: CreateCardDto): Promise<Card> {
    const queryRunner = this.dataSource.createQueryRunner();

    await queryRunner.connect();
    await queryRunner.startTransaction();

    try {
      const card = this.cardRepository.create({
        ...dto,
        tags: [],
        writer: user,
      });

      if (!dto.keywords.length) {
        logger.warn('최소 1개의 태그가 필요합니다.');
        throw new BadRequestException('최소 1개의 태그가 필요합니다.');
      }

      card.tags = await Promise.all(
        dto.keywords.map(async keyword => {
          const tag = await this.tagService.getTagByKeyword(keyword);

          if (tag) {
            return tag;
          } else {
            return await this.tagService.createTag({ keyword });
          }
        }),
      );

      await this.cardRepository.save(card);

      logger.log(`${card.id} - 카드가 생성되었습니다.`);
      await queryRunner.commitTransaction();

      return card;
    } catch (error) {
      await queryRunner.rollbackTransaction();

      if (error.status === 400) {
        throw new BadRequestException(error.message);
      } else {
        throw new InternalServerErrorException(error.message);
      }
    } finally {
      await queryRunner.release();
    }
  }

  async getCardsByWriterId(id: number): Promise<Card[]> {
    const cards = await this.cardRepository
      .createQueryBuilder('card')
      .leftJoinAndSelect('card.writer', 'writer')
      .leftJoinAndSelect('card.tags', 'tags')
      .where('writer.id = :id', { id })
      .select([
        'card.id',
        'card.title',
        'card.content',
        'card.isAnonymity',
        'card.isAnswered',
        'tags.id',
        'tags.keyword',
        'writer.id',
        'writer.name',
      ])
      .getMany();

    if (!cards) {
      logger.log(`카드가 존재하지 않습니다.`);
      return [];
    }

    logger.log('카드 목록 반환이 완료되었습니다.');

    return cards;
  }

  async getCardsByAnswered(isAnswered: boolean): Promise<Card[]> {
    const cards = await this.cardRepository
      .createQueryBuilder('card')
      .leftJoinAndSelect('card.writer', 'writer')
      .leftJoinAndSelect('card.tags', 'tags')
      .where('card.isAnswered = :isAnswered', { isAnswered })
      .select([
        'card.id',
        'card.title',
        'card.content',
        'card.isAnonymity',
        'card.isAnswered',
        'tags.id',
        'tags.keyword',
        'writer.id',
        'writer.name',
      ])
      .getMany();

    if (!cards) {
      logger.log(`카드가 존재하지 않습니다.`);
      return [];
    }

    logger.log('카드 목록 반환이 완료되었습니다.');

    return cards;
  }

  async deleteCard(id: number) {
    const queryRunner = this.dataSource.createQueryRunner();

    await queryRunner.connect();
    await queryRunner.startTransaction();

    try {
      const card = await this.cardRepository
        .createQueryBuilder('card')
        .where('card.id = :id', { id })
        .leftJoinAndSelect('card.tags', 'tags')
        .select(['card.id', 'tags.id'])
        .getOne();

      if (!card) {
        logger.warn(`${id} - 카드가 존재하지 않습니다.`);
        throw new NotFoundException(`카드가 존재하지 않습니다.`);
      }

      if (card.tags.length) {
        card.tags.forEach(tag => {
          this.tagService.deleteTag(tag.id);
        });
      }

      await this.cardRepository.delete({ id });

      logger.log(`${id} - 카드가 삭제되었습니다.`);

      return card;
    } catch (error) {
      await queryRunner.rollbackTransaction();

      if (error.status === 404) {
        throw new NotFoundException(error.message);
      } else {
        throw new InternalServerErrorException(error.message);
      }
    } finally {
      await queryRunner.release();
    }
  }
}
